import "server-only";

import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { generateShareToken, hashToken } from "@/lib/tokens";
import { encryptSecret, decryptSecret, type EncryptedSecret } from "@/lib/totp-crypto";

/**
 * Device-code login for `envshare` (GitHub CLI style) + bearer-token
 * resolution for the /api/cli/* routes. Reuses lib/tokens.ts's token
 * generation/hashing (share links, CLI tokens and device codes are all
 * "256-bit random value, only the hash is stored" the same way).
 */

const DEVICE_AUTH_TTL_MS = 10 * 60 * 1000;
const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

function generateUserCode(): string {
  const chars = Array.from({ length: 8 }, () => USER_CODE_ALPHABET[randomInt(USER_CODE_ALPHABET.length)]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export async function startDeviceAuth(): Promise<{ deviceCode: string; userCode: string; expiresIn: number }> {
  const deviceCode = generateShareToken();
  const userCode = generateUserCode();
  await prisma.cliDeviceAuth.create({
    data: {
      deviceCodeHash: hashToken(deviceCode),
      userCode,
      expiresAt: new Date(Date.now() + DEVICE_AUTH_TTL_MS),
    },
  });
  return { deviceCode, userCode, expiresIn: DEVICE_AUTH_TTL_MS / 1000 };
}

export type DevicePollResult =
  | { status: "pending" }
  | { status: "denied" }
  | { status: "expired" }
  | { status: "approved"; token: string };

/** CLI polls this; the raw token is handed over exactly once, then cleared from the row. */
export async function pollDeviceAuth(deviceCode: string): Promise<DevicePollResult> {
  const row = await prisma.cliDeviceAuth.findUnique({ where: { deviceCodeHash: hashToken(deviceCode) } });
  if (!row || row.expiresAt.getTime() <= Date.now()) return { status: "expired" };
  if (row.status === "denied") return { status: "denied" };
  if (row.status !== "approved" || !row.issuedToken) return { status: "pending" };

  // ponytail: the row briefly holds a working bearer token between approval
  // and the CLI's poll  encrypted at rest with the same AES-256-GCM key as
  // the .env blobs/TOTP secrets, so a DB read alone in that window doesn't
  // hand over a usable credential.
  const token = decryptSecret(JSON.parse(row.issuedToken) as EncryptedSecret);
  await prisma.cliDeviceAuth.delete({ where: { id: row.id } });
  return { status: "approved", token };
}

/** Called from the web app's /cli/authorize page once the signed-in user approves or denies. */
export async function resolveDeviceAuth(
  userCode: string,
  userId: string,
  approve: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.cliDeviceAuth.findUnique({ where: { userCode } });
  if (!row || row.expiresAt.getTime() <= Date.now()) return { ok: false, error: "Kod wygasł lub jest nieprawidłowy." };
  if (row.status !== "pending") return { ok: false, error: "Ten kod został już użyty." };

  if (!approve) {
    await prisma.cliDeviceAuth.update({ where: { id: row.id }, data: { status: "denied" } });
    return { ok: true };
  }

  const rawToken = generateShareToken();
  await prisma.cliToken.create({ data: { tokenHash: hashToken(rawToken), userId } });
  await prisma.cliDeviceAuth.update({
    where: { id: row.id },
    data: { status: "approved", userId, issuedToken: JSON.stringify(encryptSecret(rawToken)) },
  });
  return { ok: true };
}

/** Resolves an `Authorization: Bearer <token>` header to a userId, or null. */
export async function resolveCliUser(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  if (!token) return null;

  const row = await prisma.cliToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.revoked) return null;

  await prisma.cliToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
  return row.userId;
}

/** `envshare logout`  revokes exactly the token presented, not every token the user holds. */
export async function revokeCliToken(request: Request): Promise<void> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  if (!token) return;
  await prisma.cliToken.updateMany({ where: { tokenHash: hashToken(token) }, data: { revoked: true } });
}
