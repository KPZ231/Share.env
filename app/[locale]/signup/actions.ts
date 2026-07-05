"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isEmailValid, isPasswordValid } from "@/lib/password";

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Shape posted by components/signup-form.tsx. `locale` isn't derivable
 * server-side from a Server Action call  the client already knows it via
 * useLocale(), so it must pass it through explicitly for emailRedirectTo.
 */
export type SignUpValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  company: string;
  locale: string;
};

export type SignUpResult = { ok: true } | { ok: false; error: string };

/**
 * Re-validates everything the client already checked  never trust a
 * Server Action's input just because a trusted-looking form sent it.
 * Fails fast (no Supabase call) on the first bad field to avoid spending
 * a signUp request on garbage input.
 */
export async function signUpAction(values: SignUpValues): Promise<SignUpResult> {
  // Honeypot: bots fill every field, humans never see this one. Reject
  // silently with the same generic message so a bot can't learn it tripped
  // a honeypot specifically.
  if (values.company.trim().length > 0) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const name = values.name.trim();
  const email = values.email.trim();

  if (name.length < 2) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!isEmailValid(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!isPasswordValid(values.password)) {
    return { ok: false, error: "Password doesn't meet the requirements." };
  }
  if (values.password !== values.confirmPassword) {
    return { ok: false, error: "Passwords don't match." };
  }
  if (values.terms !== true) {
    return { ok: false, error: "You must accept the terms to continue." };
  }

  // Prefer the env var already used for absolute URLs (see lib/metadata.ts's
  // sibling usages)  headers() Host/Origin are client-supplied and not a
  // trustworthy base for a redirect target, even inside a Server Action.
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await fallbackOrigin());

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: values.password,
    options: {
      emailRedirectTo: `${origin}/${values.locale}/auth/callback`,
      data: { full_name: name },
    },
  });

  // No user enumeration: Supabase returns a success-shaped response for
  // repeat signups in the common configuration, so we never introspect the
  // result to say "email already registered." Any real error is generic too
  // -- never echo Supabase's raw error text to the client.
  if (error) {
    if (error.status === 429) {
      return { ok: false, error: "Too many attempts, try again later." };
    }
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true };
}

/** Local-dev fallback when NEXT_PUBLIC_SITE_URL isn't configured. */
async function fallbackOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
