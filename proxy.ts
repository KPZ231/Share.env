import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy-session";

const handleI18nRouting = createIntlMiddleware(routing);

// Next.js 16 renamed Middleware to Proxy  same runtime, new file/export name.
// Locale routing runs first (produces the response + locale-aware request),
// then the Supabase session refresh writes its cookies onto that response.
export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  return updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and Next internals, so both
     * locale negotiation and the session cookie stay fresh on every navigable route.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
