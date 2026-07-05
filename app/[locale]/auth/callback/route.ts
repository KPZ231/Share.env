import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/workspace";

/**
 * Validates that `redirectTo` is a same-origin, locale-prefixed internal
 * path before honoring it, to prevent open-redirect attacks. Anything that
 * doesn't clearly match `/{locale}` or `/{locale}/...` is rejected in favor
 * of the locale home  never trust this value enough to pass it through
 * unchecked into a redirect.
 */
function sanitizeRedirectTo(redirectTo: string | null, locale: string): string {
  const fallback = `/${locale}`;

  if (!redirectTo) return fallback;
  // Reject protocol-relative URLs (//evil.com) and any embedded scheme
  // (https://evil.com, javascript:, etc.) before doing anything else.
  if (redirectTo.startsWith("//")) return fallback;
  if (redirectTo.includes("://")) return fallback;
  // Must be a single leading-slash path, not e.g. "/\evil.com" tricks.
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("\\")) return fallback;

  const localePrefix = `/${locale}`;
  const isExactLocaleHome = redirectTo === localePrefix;
  const isLocalePrefixedPath = redirectTo.startsWith(`${localePrefix}/`);

  if (!isExactLocaleHome && !isLocalePrefixedPath) return fallback;

  return redirectTo;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const redirectTo = sanitizeRedirectTo(searchParams.get("redirectTo"), locale);

  const supabase = await createClient();

  let exchangeError: unknown = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    exchangeError = error;
  } else {
    exchangeError = new Error("missing exchange material");
  }

  if (exchangeError) {
    const failureUrl = new URL(`/${locale}/signin`, origin);
    failureUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(failureUrl);
  }

  await ensureDefaultWorkspace(supabase);

  return NextResponse.redirect(new URL(redirectTo, origin));
}
