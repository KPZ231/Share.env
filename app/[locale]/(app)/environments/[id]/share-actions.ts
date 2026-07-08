"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createShareLink, revokeShareLink } from "@/lib/share-links";

export type ShareActionResult = { ok: true; url: string } | { ok: false; error: string };

const ALLOWED_EXPIRY_DAYS = [1, 7, 30];

/** Mirrors members/actions.ts's siteOrigin  never trust the Host header in production. */
async function siteOrigin(locale: string): Promise<string> {
  let base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
    }
    const host = (await headers()).get("host") ?? "localhost:3000";
    base = `http://${host}`;
  }
  return `${base}/${locale}/s`;
}

export async function createEnvironmentShareLinkAction(
  workspaceId: string,
  envFileId: string,
  expiresInDays: number,
  locale: string
): Promise<ShareActionResult> {
  if (!ALLOWED_EXPIRY_DAYS.includes(expiresInDays)) {
    return { ok: false, error: "Nieprawidłowy okres ważności linku." };
  }

  const result = await createShareLink(workspaceId, envFileId, expiresInDays);
  if (!result.ok) return result;

  revalidatePath(`/environments/${envFileId}`);
  return { ok: true, url: `${await siteOrigin(locale)}/${result.token}` };
}

export async function revokeEnvironmentShareLinkAction(
  workspaceId: string,
  envFileId: string,
  shareLinkId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await revokeShareLink(workspaceId, shareLinkId);
  revalidatePath(`/environments/${envFileId}`);
  return { ok: true };
}
