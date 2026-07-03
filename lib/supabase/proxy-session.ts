import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated users away from protected routes. This is an optimistic
 * check only (see Next.js auth guide) — RLS is the real authorization
 * boundary, this just avoids rendering protected pages for logged-out users.
 *
 * Routes considered public: /, /login, /signup, /auth/callback, and any
 * public share-link resolver under /share. Everything else requires a session.
 */
const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/callback"];

// Locale prefix (e.g. /pl, /en) is always present — see i18n/routing.ts — so
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
        // routing rewrite/headers) instead of replacing it — replacing it
        // here would silently drop locale negotiation.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser — it
  // triggers a token refresh that must be forwarded via the response cookies above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const locale = request.nextUrl.pathname.match(/^\/(pl|en)(?=\/|$)/)?.[1] ?? "pl";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
