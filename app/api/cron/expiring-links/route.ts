import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyWorkspace } from "@/lib/integrations/notify";

export const dynamic = "force-dynamic";

const EXPIRY_WINDOW_HOURS = 24;

/**
 * Scheduled by vercel.json's crons entry. Vercel Cron requests carry
 * `Authorization: Bearer $CRON_SECRET` automatically -- verifying it is what
 * stops anyone else from triggering this (and thus spamming every
 * workspace's Slack/Discord) by just hitting the public URL.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const windowEnd = new Date(Date.now() + EXPIRY_WINDOW_HOURS * 60 * 60 * 1000);
  const expiring = await prisma.shareLink.findMany({
    where: { revoked: false, expiresAt: { gt: new Date(), lte: windowEnd } },
    select: { id: true, expiresAt: true, envFile: { select: { name: true, workspaceId: true } } },
  });

  // ponytail: sequential per-link await, not batched -- expiring links per run
  // is expected to be small (24h window); switch to a bounded Promise.all if
  // a workspace's volume ever makes this run long.
  let notified = 0;
  for (const link of expiring) {
    await notifyWorkspace(link.envFile.workspaceId, {
      title: "Link do środowiska wkrótce wygaśnie",
      body: `Link do „${link.envFile.name}” wygasa ${link.expiresAt.toLocaleString("pl-PL")}.`,
    });
    notified++;
  }

  return NextResponse.json({ checked: expiring.length, notified });
}
