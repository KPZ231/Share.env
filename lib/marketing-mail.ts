import "server-only";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";

type CampaignKind = "marketing" | "product";

/**
 * Broadcasts a marketing or product email to every user who consented in
 * profile settings (Profile.marketingConsent / productEmailsConsent).
 * Pulls emails from Supabase auth (profiles has no email column), paginating
 * listUsers since the free plan can hold thousands of accounts.
 */
export async function sendCampaign(kind: CampaignKind, subject: string, html: string) {
  const consented = await prisma.profile.findMany({
    where: kind === "marketing" ? { marketingConsent: true } : { productEmailsConsent: true },
    select: { userId: true },
  });
  const consentedIds = new Set(consented.map((p) => p.userId));
  if (consentedIds.size === 0) return { sent: 0 };

  const admin = createAdminClient();
  let sent = 0;
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const user of data.users) {
      if (consentedIds.has(user.id) && user.email) {
        await sendMail(user.email, subject, html);
        sent++;
      }
    }

    if (data.users.length < perPage) break;
    page++;
  }

  return { sent };
}
