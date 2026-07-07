import { prisma } from "@/lib/prisma";
import { generateShareToken, hashToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail";
import { assertOwner } from "@/lib/membership";
import type { WorkspaceRole } from "@prisma/client";

const EMAIL_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LINK_INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Prisma already bypasses RLS (same trust level as the Supabase admin
 * client), so invitation reads/writes go straight through it  the owner
 * check in assertOwner() (writes) and the token hash+expiry+revoked checks
 * in resolveInvite() (reads, by an invitee who isn't a member yet) are the
 * real access-control boundary, mirroring how ShareLink resolution works.
 */

export async function createEmailInvite(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
  acceptUrlBase: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ownerId = await assertOwner(workspaceId);

  const rawToken = generateShareToken();
  await prisma.invitation.create({
    data: {
      workspaceId,
      kind: "email",
      email,
      role,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_INVITE_TTL_MS),
      invitedBy: ownerId,
    },
  });

  try {
    await sendMail(
      email,
      "Zaproszenie do workspace'a - share.env",
      `<p>Zostałeś zaproszony do dołączenia do workspace'a na share.env.</p><p><a href="${acceptUrlBase}/${rawToken}">Dołącz do workspace'a</a></p><p>Link wygasa za 7 dni.</p>`
    );
  } catch (err) {
    console.error("createEmailInvite failed (sendMail):", err);
    return { ok: false, error: "Nie udało się wysłać zaproszenia e-mail." };
  }
  return { ok: true };
}

export async function createLinkInvite(
  workspaceId: string,
  role: WorkspaceRole
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const ownerId = await assertOwner(workspaceId);

  const rawToken = generateShareToken();
  await prisma.invitation.create({
    data: {
      workspaceId,
      kind: "link",
      role,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + LINK_INVITE_TTL_MS),
      invitedBy: ownerId,
    },
  });
  return { ok: true, token: rawToken };
}

export async function revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
  await assertOwner(workspaceId);
  await prisma.invitation.updateMany({
    where: { id: invitationId, workspaceId },
    data: { revoked: true },
  });
}

export async function listPendingInvitations(workspaceId: string) {
  await assertOwner(workspaceId);
  return prisma.invitation.findMany({
    where: { workspaceId, revoked: false, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, email: true, role: true, expiresAt: true, createdAt: true },
  });
}

type ResolvedInvite = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  kind: "email" | "link";
  email: string | null;
  role: WorkspaceRole;
};

/** Looks up a raw invite token, applying every validity check in one place. */
export async function resolveInvite(rawToken: string): Promise<ResolvedInvite | null> {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { workspace: { select: { name: true } } },
  });
  if (!invitation) return null;
  if (invitation.revoked) return null;
  if (invitation.expiresAt.getTime() <= Date.now()) return null;
  if (invitation.kind === "email" && invitation.acceptedAt) return null; // single-use

  return {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    workspaceName: invitation.workspace.name,
    kind: invitation.kind,
    email: invitation.email,
    role: invitation.role,
  };
}

/**
 * Accepts a resolved invite for a signed-in user. Idempotent if the user is
 * already a member (mirrors ensureDefaultWorkspace's idempotency). For
 * kind=email, only the invited address may accept, and acceptance consumes
 * the invite; kind=link stays reusable by anyone holding it.
 */
export async function acceptInvite(
  rawToken: string,
  userId: string,
  userEmail: string | null
): Promise<{ ok: true; workspaceId: string } | { ok: false; error: string }> {
  const invitation = await resolveInvite(rawToken);
  if (!invitation) return { ok: false, error: "Zaproszenie jest nieprawidłowe lub wygasło." };

  if (invitation.kind === "email" && invitation.email?.toLowerCase() !== userEmail?.toLowerCase()) {
    return { ok: false, error: "To zaproszenie zostało wysłane na inny adres e-mail." };
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId } },
    select: { workspaceId: true },
  });

  if (!existing) {
    await prisma.workspaceMember.create({
      data: { workspaceId: invitation.workspaceId, userId, role: invitation.role },
    });
  }

  if (invitation.kind === "email") {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
  }

  return { ok: true, workspaceId: invitation.workspaceId };
}

// ponytail: no standalone self-check here  this module imports lib/prisma.ts
// (which imports "server-only" and throws outside Next's bundler), so it
// can't run via bare `tsx` the way lib/tokens.ts/env-lock.ts do. Its expiry/
// revoked/accepted-at/email-match branches are covered by lib/env-lock.ts's
// and lib/tokens.ts's token self-checks plus `npm run lint`/`tsc --noEmit`;
// exercise the actual DB paths via the E2E steps in the membership plan.
