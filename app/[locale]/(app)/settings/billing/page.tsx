import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { updateTag } from "next/cache";
import { buildMetadata } from "@/lib/metadata";
import { resolveActiveWorkspace } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { confirmCheckoutSession, getUpcomingInvoice, getInvoiceHistory } from "@/lib/stripe";
import { FREE_ENVIRONMENT_LIMIT, formatPrice, monthlyCost } from "@/lib/billing";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { startCheckoutAction, openPortalAction } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ locale, namespace: "meta.billing", path: "/settings/billing", noindex: true });
}

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const { locale } = await params;
  const { checkout, session_id: sessionId } = await searchParams;
  const workspace = await resolveActiveWorkspace();
  const dashboardT = await getTranslations("dashboard.breadcrumbs");
  const settingsT = await getTranslations("settings");
  const t = await getTranslations("billing");

  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-body">{dashboardT("dashboard")}</p>
      </div>
    );
  }
  if (workspace.role !== "owner") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: dashboardT("dashboard"), href: "/dashboard" },
            { label: settingsT("breadcrumb"), href: "/settings" },
            { label: t("breadcrumb") },
          ]}
        />
        <p className="text-body">{settingsT("ownerOnly")}</p>
      </div>
    );
  }

  // Success-return verification: don't rely solely on the webhook (e.g. local
  // dev without `stripe listen`, or a slow delivery) leaving the user stuck
  // on the free-tier view right after paying.
  if (checkout === "success" && sessionId) {
    await confirmCheckoutSession(sessionId, workspace.id);
    updateTag(`ws:${workspace.id}`);
  }

  const [envCount, row] = await Promise.all([
    prisma.envFile.count({ where: { workspaceId: workspace.id } }),
    prisma.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      select: { stripeSubscriptionStatus: true, stripeCustomerId: true },
    }),
  ]);
  const paidUnits = Math.max(0, envCount - FREE_ENVIRONMENT_LIMIT);
  const cost = monthlyCost(envCount);
  const status = row.stripeSubscriptionStatus;
  const hasSubscription = status === "active" || status === "past_due";

  const [upcomingInvoice, invoiceHistory] = row.stripeCustomerId
    ? await Promise.all([getUpcomingInvoice(row.stripeCustomerId), getInvoiceHistory(row.stripeCustomerId)])
    : [null, []];

  const statusLabel =
    status === "active"
      ? t("statusActive")
      : status === "past_due"
        ? t("statusPastDue")
        : status === "canceled"
          ? t("statusCanceled")
          : t("noSubscription");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: dashboardT("dashboard"), href: "/dashboard" },
          { label: settingsT("breadcrumb"), href: "/settings" },
          { label: t("breadcrumb") },
        ]}
      />

      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-body">{statusLabel}</p>
      </div>

      {checkout === "success" ? (
        <p className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-foreground">
          {t("checkoutSuccess")}
        </p>
      ) : checkout === "canceled" ? (
        <p className="rounded-lg border border-hairline-strong bg-surface-soft p-4 text-sm text-body">
          {t("checkoutCanceled")}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 rounded-lg border border-hairline-strong bg-surface-soft p-6 text-sm text-body">
        <p>
          {t("freeUsage", { count: envCount, limit: FREE_ENVIRONMENT_LIMIT })}
        </p>
        <p>{t("paidUnits", { count: paidUnits })}</p>
        <p className="font-medium text-foreground">
          {t("estimatedCost", { price: formatPrice(cost, locale) })}
        </p>
      </div>

      {upcomingInvoice ? (
        <div className="flex flex-col gap-2 rounded-lg border border-hairline-strong bg-surface-soft p-6 text-sm text-body">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-mute">{t("upcomingInvoiceTitle")}</p>
          <p className="font-medium text-foreground">
            {new Intl.NumberFormat(locale, { style: "currency", currency: upcomingInvoice.currency }).format(
              upcomingInvoice.amountDue
            )}
            {upcomingInvoice.dueDate ? ` · ${upcomingInvoice.dueDate.toLocaleDateString(locale)}` : ""}
          </p>
        </div>
      ) : null}

      {invoiceHistory.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-soft p-6 text-sm text-body">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-mute">{t("invoiceHistoryTitle")}</p>
          <ul className="flex flex-col divide-y divide-hairline">
            {invoiceHistory.map((invoice) => (
              <li key={invoice.id} className="flex items-center justify-between gap-4 py-2">
                <span>{invoice.date.toLocaleDateString(locale)}</span>
                <span>
                  {new Intl.NumberFormat(locale, { style: "currency", currency: invoice.currency }).format(
                    invoice.amount
                  )}
                </span>
                <span className="text-xs text-mute">{invoice.status}</span>
                {invoice.pdfUrl ? (
                  <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                    PDF
                  </a>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form action={hasSubscription ? openPortalAction.bind(null, locale) : startCheckoutAction.bind(null, locale)}>
        <button
          type="submit"
          className="w-fit rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {hasSubscription ? t("manageCta") : t("subscribeCta")}
        </button>
      </form>
    </div>
  );
}
