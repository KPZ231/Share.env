"use server";

import { cookies } from "next/headers";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { verifyTotpCode } from "@/lib/totp";
import { decryptTotpSecret } from "@/lib/totp-crypto";
import { buildAuthenticationOptions, checkAuthenticationResponse } from "@/lib/webauthn";
import {
  signAccountTwoFactorToken,
  ACCOUNT_2FA_COOKIE,
  ACCOUNT_2FA_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/env-lock";

export type ActionResult = { ok: true } | { ok: false; error: string };

const AUTH_CHALLENGE_COOKIE = "webauthn_account_auth_challenge";

async function grantAccountVerified(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCOUNT_2FA_COOKIE, signAccountTwoFactorToken(userId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ACCOUNT_2FA_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function verifyAccountTotpAction(code: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: totp } = await supabase
    .from("totp_credentials")
    .select("secret_enc, secret_iv, secret_tag")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!totp) return { ok: false, error: "Nie masz skonfigurowanej aplikacji uwierzytelniającej." };

  const secret = decryptTotpSecret({
    ciphertext: totp.secret_enc,
    iv: totp.secret_iv,
    tag: totp.secret_tag,
  });
  if (!verifyTotpCode(secret, code)) return { ok: false, error: "Nieprawidłowy kod." };

  await grantAccountVerified(user.id);
  return { ok: true };
}

export async function startAccountPasskeyAuthAction(): Promise<
  { ok: true; options: Awaited<ReturnType<typeof buildAuthenticationOptions>> } | { ok: false; error: string }
> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: credentials } = await supabase
    .from("webauthn_credentials")
    .select("credential_id")
    .eq("user_id", user.id);
  if (!credentials || credentials.length === 0) {
    return { ok: false, error: "Nie masz zarejestrowanego klucza dostępu." };
  }

  const options = await buildAuthenticationOptions({
    allowCredentialIds: credentials.map((c) => c.credential_id),
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 5 * 60,
    path: "/",
  });

  return { ok: true, options };
}

export async function finishAccountPasskeyAuthAction(response: AuthenticationResponseJSON): Promise<ActionResult> {
  const user = await requireUser();
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(AUTH_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) return { ok: false, error: "Sesja weryfikacji wygasła. Spróbuj ponownie." };

  const supabase = await createClient();
  const { data: credentialRow } = await supabase
    .from("webauthn_credentials")
    .select("credential_id, public_key, counter, transports")
    .eq("credential_id", response.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!credentialRow) return { ok: false, error: "Nieznany klucz dostępu." };

  let verification;
  try {
    verification = await checkAuthenticationResponse({
      response,
      expectedChallenge,
      credential: {
        id: credentialRow.credential_id,
        publicKey: new Uint8Array(Buffer.from(credentialRow.public_key, "base64")),
        counter: credentialRow.counter,
        transports: credentialRow.transports,
      },
    });
  } catch {
    return { ok: false, error: "Nie udało się zweryfikować klucza dostępu." };
  }
  cookieStore.delete(AUTH_CHALLENGE_COOKIE);
  if (!verification.verified) return { ok: false, error: "Nie udało się zweryfikować klucza dostępu." };

  await supabase
    .from("webauthn_credentials")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("credential_id", credentialRow.credential_id);

  await grantAccountVerified(user.id);
  return { ok: true };
}
