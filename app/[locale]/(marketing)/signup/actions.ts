"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
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

  // ponytail: Supabase's own mailer only allows a couple of auth emails/hour
  // on the default project tier  swap in Gmail SMTP by using the admin API
  // to mint the confirmation link ourselves (generateLink never sends mail)
  // and deliver it via lib/mail.ts instead of relying on supabase.auth.signUp's
  // built-in email dispatch.
  const admin = createAdminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: values.password,
    options: {
      data: { full_name: name },
      redirectTo: `${origin}/${values.locale}/auth/callback`,
    },
  });

  // No user enumeration: an "already registered" error must look identical
  // to success. Any other real error is generic too -- never echo Supabase's
  // raw error text to the client.
  if (linkError) {
    if (linkError.status === 429) {
      return { ok: false, error: "Too many attempts, try again later." };
    }
    if (linkError.code === "email_exists" || linkError.code === "user_already_exists" || linkError.status === 422) {
      return { ok: true };
    }
    console.error("signUpAction failed (generateLink):", linkError.status, linkError.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const actionLink = linkData?.properties?.action_link;
  if (!actionLink) {
    console.error("signUpAction failed: generateLink returned no action_link");
    return { ok: false, error: GENERIC_ERROR };
  }

  try {
    await sendMail(
      email,
      "Potwierdź swoje konto - share.env",
      `<p>Cześć ${name},</p><p>Potwierdź swój adres e-mail, aby aktywować konto share.env:</p><p><a href="${actionLink}">Potwierdź konto</a></p>`
    );
  } catch (err) {
    console.error("signUpAction failed (sendMail):", err);
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true };
}

/**
 * Local-dev fallback when NEXT_PUBLIC_SITE_URL isn't configured.
 * The Host header is client-controlled, so in production we must never trust
 * it as a redirect base  fail loudly instead of risking a spoofed
 * emailRedirectTo (phishing/ATO vector).
 */
async function fallbackOrigin(): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  }
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
