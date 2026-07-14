import "server-only";

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { FREE_ENVIRONMENT_LIMIT } from "@/lib/billing";

/**
 * Singleton Stripe client (server-only, secret key never reaches the
 * client). Pin apiVersion so a Stripe account upgrade doesn't silently change
 * webhook payload shapes underneath us.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Ensures the workspace has a Stripe Customer, creating one on first use and
 * persisting it via Prisma (bypasses the workspaces_lock_billing trigger,
 * which only pins writes from the "authenticated" role). Idempotent: returns
 * the existing id if already set.
 */
export async function getOrCreateCustomer(
  workspace: { id: string; name: string; stripeCustomerId: string | null },
  ownerEmail: string
): Promise<string> {
  if (workspace.stripeCustomerId) return workspace.stripeCustomerId;

  const customer = await stripe.customers.create({
    name: workspace.name,
    email: ownerEmail,
    metadata: { workspaceId: workspace.id },
  });

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Sets the workspace's subscription-item quantity to `qty` (paid
 * environments beyond the free tier). No-op if already correct.
 * ponytail: best-effort, no idempotency-key -- a dropped call self-heals the
 * next time an environment is added or removed (see lib/env-billing.ts).
 */
export async function ensureSubscriptionQuantity(subscriptionId: string, qty: number): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const item = subscription.items.data[0];
  if (!item || item.quantity === qty) return;

  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: item.id, quantity: qty }],
    proration_behavior: "create_prorations",
  });
}

/**
 * Hosted Stripe Checkout for a workspace's *first* subscription. Both
 * client_reference_id and subscription_data.metadata carry workspaceId since
 * checkout.session.completed and later customer.subscription.* webhook
 * events need to map back to the workspace independently.
 */
export async function createCheckoutSession(args: {
  workspaceId: string;
  customerId: string;
  quantity: number;
  locale: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: args.customerId,
    client_reference_id: args.workspaceId,
    subscription_data: { metadata: { workspaceId: args.workspaceId } },
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: args.quantity }],
    success_url: `${appUrl()}/${args.locale}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/${args.locale}/settings/billing?checkout=canceled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/**
 * Confirms a just-completed Checkout session server-side and writes the
 * subscription onto the workspace. Runs on the success-return in addition to
 * the webhook so the user isn't stuck showing "3 z 3" if the webhook is
 * delayed or (in local dev) `stripe listen` isn't running.
 */
export async function confirmCheckoutSession(sessionId: string, workspaceId: string): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== workspaceId) return;
  if (session.payment_status !== "paid" && session.status !== "complete") return;
  if (typeof session.subscription !== "string" || typeof session.customer !== "string") return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
    },
  });

  // ponytail: Checkout's line-item quantity is a guess made before the
  // gated action actually ran (e.g. subscribing at exactly the free limit,
  // before the 4th env exists) -- reconcile to the real count right away.
  const count = await prisma.envFile.count({ where: { workspaceId } });
  const qty = Math.max(0, count - FREE_ENVIRONMENT_LIMIT);
  const item = subscription.items.data[0];
  if (item && item.quantity !== qty) {
    await stripe.subscriptions.update(subscription.id, {
      items: [{ id: item.id, quantity: qty }],
      proration_behavior: "create_prorations",
    });
  }
}

export type UpcomingInvoice = { amountDue: number; currency: string; dueDate: Date | null } | null;
export type InvoiceHistoryItem = {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
};

/** Real Stripe data for the billing page: what's coming next and what's already been charged. */
export async function getUpcomingInvoice(customerId: string): Promise<UpcomingInvoice> {
  try {
    const invoice = await stripe.invoices.createPreview({ customer: customerId });
    return {
      amountDue: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      dueDate: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null,
    };
  } catch {
    return null; // no upcoming invoice (e.g. no active subscription)
  }
}

export async function getInvoiceHistory(customerId: string): Promise<InvoiceHistoryItem[]> {
  try {
    const invoices = await stripe.invoices.list({ customer: customerId, limit: 12 });
    return invoices.data.map((invoice) => ({
      id: invoice.id ?? invoice.number ?? "",
      date: new Date(invoice.created * 1000),
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status ?? "unknown",
      pdfUrl: invoice.invoice_pdf ?? null,
    }));
  } catch {
    return []; // stale/missing customer (e.g. Stripe test-mode reset) -- don't crash the billing page
  }
}

/** Stripe-hosted Customer Portal: card updates, cancellation, invoice history -- we build none of it ourselves. */
export async function createPortalSession(customerId: string, locale: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/${locale}/settings/billing`,
  });
  return session.url;
}
