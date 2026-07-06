"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/workspace";
import { isEmailValid } from "@/lib/password";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const INVALID_CREDENTIALS_ERROR = "Invalid email or password.";

/**
 * Shape posted by components/signin-form.tsx. `remember` is intentionally
 * omitted  it's UX-only in the form (whether the client nudges the user to
 * stay signed in); Supabase's session/cookie TTL is controlled server-side
 * via project config, not per-request, so there's nothing for this action to
 * do with it.
 */
export type SignInValues = {
  email: string;
  password: string;
  company: string;
};

export type SignInResult = { ok: true } | { ok: false; error: string };

/**
 * Re-validates everything the client already checked  never trust a
 * Server Action's input just because a trusted-looking form sent it.
 * Fails fast (no Supabase call) on the first bad field to avoid spending
 * a signIn request on garbage input.
 */
export async function signInAction(values: SignInValues): Promise<SignInResult> {
  // Honeypot: bots fill every field, humans never see this one. Reject
  // silently with the same generic message so a bot can't learn it tripped
  // a honeypot specifically.
  if (values.company.trim().length > 0) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const email = values.email.trim();

  if (!isEmailValid(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  // No strength check here  login only needs "did they type something",
  // strength is a signup-time rule enforced when the password was created.
  if (values.password.length < 1) {
    return { ok: false, error: INVALID_CREDENTIALS_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: values.password,
  });

  // No user enumeration / no credential oracle: wrong password, no such
  // user, and unconfirmed email all normalize to the same generic message.
  // Supabase's raw error text differs across these cases  never echo it.
  if (error) {
    // ponytail: Supabase rate-limits auth endpoints natively; add Upstash/Arcjet if abuse appears.
    if (error.status === 429) {
      return { ok: false, error: "Too many attempts, try again later." };
    }
    return { ok: false, error: INVALID_CREDENTIALS_ERROR };
  }

  // The user is authenticated at this point regardless of what happens
  // below, so a bootstrap hiccup here must not surface as a failed login
  // that would make an already-successful signin look broken. Covers
  // accounts created before this bootstrap existed, or where workspace
  // creation somehow didn't happen at signup time.
  try {
    await ensureDefaultWorkspace(supabase);
  } catch (err) {
    // Swallow: session is valid, workspace bootstrap can be retried on next
    // signin (ensureDefaultWorkspace is idempotent). Log the error only
    // never the user's email/password/session data  for observability.
    console.error("ensureDefaultWorkspace failed:", err);
  }

  return { ok: true };
}
