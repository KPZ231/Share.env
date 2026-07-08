import "server-only";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseEnv, serializeEnv } from "@/lib/env-format";
import { decodeBlob } from "@/lib/environment";
import { verifyPassword, verifyUnlockToken, signUnlockToken } from "@/lib/env-lock";
import { verifyTotpCode } from "@/lib/totp";
import { decryptTotpSecret } from "@/lib/totp-crypto";

/**
 * Same read path as lib/environment.ts and lib/lock-actions.ts, but for a
 * userId resolved from a CLI bearer token (lib/cli-auth.ts) instead of a
 * Supabase session cookie  so every function here does its own explicit
 * membership check via Prisma, the same discipline as lib/membership.ts,
 * since Prisma bypasses RLS.
 */

export type CliEnvironmentSummary = {
  id: string;
  name: string;
  workspaceName: string;
  protectionLevel: "none" | "password_2fa" | "password_2fa_key";
  githubOwner: string | null;
  githubRepo: string | null;
};

export async function listCliEnvironments(userId: string): Promise<CliEnvironmentSummary[]> {
  const memberships = await prisma.workspaceMember.findMany({ where: { userId }, select: { workspaceId: true } });
  if (memberships.length === 0) return [];
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const [files, hidden] = await Promise.all([
    prisma.envFile.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        protectionLevel: true,
        githubOwner: true,
        githubRepo: true,
        workspace: { select: { name: true } },
      },
    }),
    prisma.envFileHiddenMember.findMany({ where: { userId, workspaceId: { in: workspaceIds } }, select: { envFileId: true } }),
  ]);
  const hiddenIds = new Set(hidden.map((h) => h.envFileId));

  return files
    .filter((f) => !hiddenIds.has(f.id))
    .map((f) => ({
      id: f.id,
      name: f.name,
      workspaceName: f.workspace.name,
      protectionLevel: f.protectionLevel,
      githubOwner: f.githubOwner,
      githubRepo: f.githubRepo,
    }));
}

async function assertVisibleMember(userId: string, envFileId: string) {
  const file = await prisma.envFile.findUnique({
    where: { id: envFileId },
    select: { id: true, workspaceId: true, passwordHash: true, protectionLevel: true, storagePath: true },
  });
  if (!file) return null;

  const [membership, hidden] = await Promise.all([
    prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: file.workspaceId, userId } } }),
    prisma.envFileHiddenMember.findUnique({ where: { envFileId_userId: { envFileId, userId } } }),
  ]);
  if (!membership || hidden) return null;
  return file;
}

export type UnlockResult = { ok: true; unlockToken: string } | { ok: false; error: string };

/** Mirrors lock-actions.ts's password + TOTP (+ access key) checks, collapsed into one call since the CLI has no multi-step cookie session to carry state between steps. */
export async function unlockCliEnvironment(
  userId: string,
  envFileId: string,
  creds: { password?: string; totpCode?: string; accessKey?: string }
): Promise<UnlockResult> {
  const file = await assertVisibleMember(userId, envFileId);
  if (!file) return { ok: false, error: "Nie znaleziono środowiska." };
  if (file.protectionLevel === "none" || !file.passwordHash) {
    return { ok: true, unlockToken: signUnlockToken(envFileId, userId) };
  }

  if (!creds.password || !verifyPassword(creds.password, file.passwordHash)) {
    return { ok: false, error: "Nieprawidłowe hasło." };
  }

  if (!creds.totpCode) {
    return { ok: false, error: "Wymagany jest kod z aplikacji uwierzytelniającej (passkeys nie są obsługiwane w CLI)." };
  }
  const totp = await prisma.totpCredential.findUnique({ where: { userId } });
  if (!totp) return { ok: false, error: "Nie masz skonfigurowanej aplikacji uwierzytelniającej." };
  const secret = decryptTotpSecret({ ciphertext: totp.secretEnc, iv: totp.secretIv, tag: totp.secretTag });
  if (!verifyTotpCode(secret, creds.totpCode)) return { ok: false, error: "Nieprawidłowy kod." };

  if (file.protectionLevel === "password_2fa_key") {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: file.workspaceId, userId } },
      select: { accessKeyHash: true },
    });
    if (!member?.accessKeyHash) return { ok: false, error: "Nie masz jeszcze wygenerowanego klucza zabezpieczeń." };
    if (!creds.accessKey || !verifyPassword(creds.accessKey, member.accessKeyHash)) {
      return { ok: false, error: "Nieprawidłowy klucz zabezpieczeń." };
    }
  }

  return { ok: true, unlockToken: signUnlockToken(envFileId, userId) };
}

export type DownloadResult = { ok: true; content: string } | { ok: false; error: string };

export async function downloadCliEnvironment(
  userId: string,
  envFileId: string,
  unlockToken: string | null
): Promise<DownloadResult> {
  const file = await assertVisibleMember(userId, envFileId);
  if (!file) return { ok: false, error: "Nie znaleziono środowiska." };

  if (file.protectionLevel !== "none" && file.passwordHash) {
    if (!unlockToken || !verifyUnlockToken(unlockToken, envFileId, userId)) {
      return { ok: false, error: "Środowisko jest zablokowane. Wywołaj najpierw unlock." };
    }
  }

  const admin = createAdminClient();
  const { data: blob, error } = await admin.storage.from("env-files").download(file.storagePath);
  if (error || !blob) return { ok: false, error: "Nie udało się pobrać pliku." };

  const content = serializeEnv(parseEnv(decodeBlob(await blob.text())));
  return { ok: true, content };
}
