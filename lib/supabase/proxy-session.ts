import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACCOUNT_2FA_COOKIE, verifyAccountTwoFactorToken } from "@/lib/env-lock";

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated users away from protected routes. This is an optimistic
 * check only (see Next.js auth guide)  RLS is the real authorization
 * boundary, this just avoids rendering protected pages for logged-out users.
 *
 * Also gates account-level sign-in 2FA: if the signed-in user has any 2FA
 * method enrolled (app_metadata.has2fa, kept in sync by
 * lib/two-factor.ts's syncHasTwoFactorMetadata via the service-role admin
 * client) and hasn't verified it on this device/cookie, every protected
 * route bounces to /verify-2fa first. This deliberately reads app_metadata,
 * not user_metadata  the latter is writable by the user's own session
 * (supabase.auth.updateUser()), so trusting it here would let anyone flip
 * their own has2fa flag off from the browser console.
 * Next.js 16's Proxy runs on the Node.js runtime (not Edge), so the
 * node:crypto-based token check in lib/env-lock.ts works here.
 *
 * Routes considered public: /, /signin, /signup, /privacy, /auth/callback, and any
 * public share-link resolver under /share. Everything else requires a session.
 */
const PUBLIC_PATHS = ["/", "/signin", "/signup", "/privacy", "/auth/callback"];
const VERIFY_2FA_PATH = "/verify-2fa";

// Locale prefix (e.g. /pl, /en) is always present  see i18n/routing.ts  so
// it must be stripped before matching against the public-path allowlist.
function stripLocale(pathname: string) {
  return pathname.replace(/^\/(pl|en)(?=\/|$)/, "") || "/";
}

function isPublicPath(pathname: string) {
  const path = stripLocale(pathname);
  return (
    PUBLIC_PATHS.includes(path) ||
    path.startsWith("/share/") // token-based access, not session-based
  );
}

export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Write onto the response the caller passed in (carries the i18n
        // routing rewrite/headers) instead of replacing it  replacing it
        // here would silently drop locale negotiation.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser  it
  // triggers a token refresh that must be forwarded via the response cookies above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = request.nextUrl.pathname.match(/^\/(pl|en)(?=\/|$)/)?.[1] ?? "pl";

  if (!user) {
    if (!isPublicPath(request.nextUrl.pathname)) {
      const loginUrl = new URL(`/${locale}/signin`, request.url);
      loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // /verify-2fa itself must stay reachable for a signed-in-but-not-yet-2FA-verified
  // user  it does its own has2fa check and redirects onward once passed.
  if (stripLocale(request.nextUrl.pathname) === VERIFY_2FA_PATH) {
    return response;
  }

  if (!isPublicPath(request.nextUrl.pathname) && user.app_metadata?.has2fa === true) {
    const token = request.cookies.get(ACCOUNT_2FA_COOKIE)?.value;
    const verified = !!token && verifyAccountTwoFactorToken(token, user.id);
    if (!verified) {
      const verifyUrl = new URL(`/${locale}/verify-2fa`, request.url);
      verifyUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(verifyUrl);
    }
  }

  return response;
}
