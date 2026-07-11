import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy-session";

const handleI18nRouting = createIntlMiddleware(routing);

/**
 * Per-request CSP with a nonce for script-src, replacing the old static
 * 'unsafe-inline' (which would let any injected <script> run). Next.js
 * auto-applies this nonce to its own framework/page bundles once it sees the
 * 'nonce-...' pattern in the response's CSP header  see the "Adding a nonce
 * with Proxy" guide in node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
 * style-src keeps 'unsafe-inline': a couple of components use React's inline
 * `style={{}}` attribute, which nonces can't cover, and unlike script
 * execution it isn't an XSS vector on its own.
 */
function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' http://localhost:8400`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSrc = isDev
    ? "'self' https://*.supabase.co http://localhost:8400 https://www.googletagmanager.com https://www.google-analytics.com"
    : "'self' https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com";
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com",
    `connect-src ${connectSrc}`,
    "frame-src https://www.googletagmanager.com",
    "frame-ancestors 'none'",
  ].join("; ");
}

/**
 * Adds extra request headers (nonce, CSP) to the page render, on top of
 * whatever `response` already forwards  next-intl's own rewrite already set
 * x-middleware-override-headers/x-middleware-request-* to carry the resolved
 * locale (x-next-intl-locale) plus a copy of every original request header
 * forward. Rebuilding that list from scratch (as this used to) silently
 * dropped the locale header: the URL would say /en but every Server/Client
 * Component reading `useTranslations`/`getRequestConfig` fell back to the
 * default locale (pl), since it never saw x-next-intl-locale=en.
 */
function forwardRequestHeaders(response: NextResponse, extra: Record<string, string>) {
  const existingKeys = (response.headers.get("x-middleware-override-headers") ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  const keys = new Set(existingKeys);
  for (const [key, value] of Object.entries(extra)) {
    response.headers.set(`x-middleware-request-${key}`, value);
    keys.add(key);
  }
  response.headers.set("x-middleware-override-headers", Array.from(keys).join(","));
}

// Next.js 16 renamed Middleware to Proxy  same runtime, new file/export name.
// Locale routing runs first (produces the response + locale-aware request),
// then the Supabase session refresh writes its cookies onto that response.
export async function proxy(request: NextRequest) {
  // API routes are locale-agnostic (JSON, not pages) and authenticate via
  // their own bearer-token/session checks  running locale routing on them
  // makes next-intl treat "/api" as an unmatched path and redirect to a
  // localized page instead of hitting the route handler. No nonce needed
  // here (JSON responses don't execute scripts), but keep a locked-down
  // static CSP as defense in depth in case a route ever reflects HTML.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const apiResponse = NextResponse.next();
    apiResponse.headers.set(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none';"
    );
    return apiResponse;
  }

  // ponytail: geo > accept-language for first visit. Vercel sets x-vercel-ip-country;
  // absent locally, so PL/EN split just falls back to next-intl's Accept-Language default.
  if (!request.cookies.has("NEXT_LOCALE")) {
    const country = request.headers.get("x-vercel-ip-country");
    if (country) {
      request.cookies.set("NEXT_LOCALE", country === "PL" ? "pl" : "en");
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCspHeader(nonce);

  const response = handleI18nRouting(request);
  response.headers.set("Content-Security-Policy", csp);

  // Forward the nonce (and CSP, so `headers().get('Content-Security-Policy')`
  // works too) to the page render itself, not just this response.
  forwardRequestHeaders(response, { "x-nonce": nonce, "Content-Security-Policy": csp });

  const finalResponse = await updateSession(request, response);
  // updateSession may swap in a fresh redirect response (unauthenticated /
  // 2FA gate)  make sure every response leaving this proxy still carries
  // the CSP header, not just the common "let it through" path above.
  finalResponse.headers.set("Content-Security-Policy", csp);
  return finalResponse;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, Next internals, and the
     * generated robots.txt/sitemap.xml metadata routes — those must bypass
     * locale negotiation and the auth gate so crawlers (Googlebot, GPTBot,
     * etc.) can fetch them unauthenticated.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
