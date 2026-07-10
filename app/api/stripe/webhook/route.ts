import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { syncSubscriptionQuantity } from "@/lib/env-billing";

export const runtime = "nodejs"; // need the raw request body for signature verification

/**
 * Writes via Prisma, which bypasses the workspaces_lock_billing trigger (that
 * trigger only pins writes made by the "authenticated" RLS role). All writes
 * are last-value-wins keyed by workspaceId, so redelivery is naturally
 * idempotent -- no separate dedupe table needed.
 */
async function findWorkspaceIdBySubscription(subscriptionId: string): Promise<string | null> {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    select: { id: true },
  });
  return workspace?.id ?? null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.client_reference_id;
        if (workspaceId && session.customer && session.subscription) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
              stripeCustomerId: String(session.customer),
              stripeSubscriptionId: String(session.subscription),
              stripeSubscriptionStatus: "active",
            },
          });
          // ponytail: Checkout's quantity was a pre-action guess (e.g.
          // subscribing right at the free limit) -- reconcile to reality.
          await syncSubscriptionQuantity(workspaceId);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId =
          subscription.metadata?.workspaceId ?? (await findWorkspaceIdBySubscription(subscription.id));
        if (workspaceId) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { stripeSubscriptionStatus: subscription.status },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId =
          subscription.metadata?.workspaceId ?? (await findWorkspaceIdBySubscription(subscription.id));
        if (workspaceId) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { stripeSubscriptionStatus: "canceled", stripeSubscriptionId: null },
          });
        }
        break;
      }
      default:
        break; // ignored event type, still 200 so Stripe doesn't retry
    }
  } catch (error) {
    console.error("stripe webhook handling failed", event.type, error);
    // Return 200 anyway: this is a workspace-not-found/DB hiccup, not a
    // signature problem -- retrying won't fix it, and we don't want Stripe
    // hammering the endpoint. Investigate via server logs.
  }

  return NextResponse.json({ received: true });
}
