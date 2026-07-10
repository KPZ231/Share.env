import "server-only";

import { prisma } from "@/lib/prisma";
import { FREE_ENVIRONMENT_LIMIT } from "@/lib/billing";
import { ensureSubscriptionQuantity } from "@/lib/stripe";

export type GateResult = { ok: true } | { ok: false; reason: "needs_checkout" };

// Statuses that keep serving paid environments. past_due still serves --
// Stripe's own dunning emails/retries handle collection; kicking a workspace
// out mid-retry is more surprising than it's worth.
const ACTIVE_STATUSES = new Set(["active", "past_due"]);

/**
 * The single gate every environment-create path (web action, future CLI
 * create) must call before inserting a new env_files row. Never redirects or
 * throws itself -- it only signals; the caller decides what "needs_checkout"
 * means for its surface (web: send to Stripe Checkout, CLI: 402 + a link).
 */
export async function checkCanAddEnvironment(workspaceId: string): Promise<GateResult> {
  const count = await prisma.envFile.count({ where: { workspaceId } });
  if (count < FREE_ENVIRONMENT_LIMIT) return { ok: true };

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { stripeSubscriptionStatus: true },
  });
  if (workspace?.stripeSubscriptionStatus && ACTIVE_STATUSES.has(workspace.stripeSubscriptionStatus)) {
    return { ok: true };
  }

  return { ok: false, reason: "needs_checkout" };
}

/**
 * Keeps the Stripe subscription quantity in sync with paid environment count
 * after any create/delete. Best-effort: a Stripe hiccup must never fail the
 * user's environment action, and a missed sync self-heals on the next call.
 */
export async function syncSubscriptionQuantity(workspaceId: string): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { stripeSubscriptionId: true },
  });
  if (!workspace?.stripeSubscriptionId) return; // free tier only, nothing to sync

  try {
    const count = await prisma.envFile.count({ where: { workspaceId } });
    const qty = Math.max(0, count - FREE_ENVIRONMENT_LIMIT);
    await ensureSubscriptionQuantity(workspace.stripeSubscriptionId, qty);
  } catch (error) {
    console.error("syncSubscriptionQuantity failed", error);
  }
}
