import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses the anon key + the caller's session cookies — every query goes through
 * RLS as the signed-in user. Never use this for cross-user/admin operations,
 * see lib/supabase/admin.ts for that.
 *
 * Server Components can't write cookies (Next.js restriction), so the
 * try/catch below is expected there — session refresh still happens in
 * proxy.ts on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore, proxy.ts refreshes the session.
          }
        },
      },
    }
  );
}
