"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateTotpSecret, totpUri, verifyTotpCode } from "@/lib/totp";
import { encryptTotpSecret } from "@/lib/totp-crypto";
import { buildRegistrationOptions, checkRegistrationResponse } from "@/lib/webauthn";
import { syncHasTwoFactorMetadata } from "@/lib/two-factor";

export type ActionResult = { ok: true } | { ok: false; error: string };

const REG_CHALLENGE_COOKIE = "webauthn_reg_challenge";

export async function startTotpEnrollmentAction(): Promise<
  { ok: true; secret: string; uri: string; qr: string } | { ok: false; error: string }
> {
  const user = await requireUser();
  const secret = generateTotpSecret();
  const uri = totpUri(secret, user.email ?? user.id);
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
  return { ok: true, secret, uri, qr };
}

/**
 * Verifies one code against the not-yet-persisted secret before storing it
 * encrypted  proves the user actually scanned/entered it into a working
 * authenticator app rather than saving a secret nobody can produce codes for.
 */
export async function confirmTotpEnrollmentAction(secret: string, code: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!verifyTotpCode(secret, code)) {
    return { ok: false, error: "Nieprawidłowy kod. Spróbuj ponownie." };
  }

  const encrypted = encryptTotpSecret(secret);
  const supabase = await createClient();
  const { error } = await supabase.from("totp_credentials").upsert(
    {
      user_id: user.id,
      secret_enc: encrypted.ciphertext,
      secret_iv: encrypted.iv,
      secret_tag: encrypted.tag,
    },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false, error: "Nie udało się zapisać aplikacji uwierzytelniającej." };

  await syncHasTwoFactorMetadata();
  revalidatePath("/profile");
  return { ok: true };
}

export async function deleteTotpCredentialAction(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("totp_credentials").delete().eq("user_id", user.id);
  if (error) return { ok: false, error: "Nie udało się usunąć aplikacji uwierzytelniającej." };

  await syncHasTwoFactorMetadata();
  revalidatePath("/profile");
  return { ok: true };
}

export async function startPasskeyRegistrationAction(): Promise<
  { ok: true; options: Awaited<ReturnType<typeof buildRegistrationOptions>> } | { ok: false; error: string }
> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("webauthn_credentials")
    .select("credential_id")
    .eq("user_id", user.id);

  const options = await buildRegistrationOptions({
    userId: user.id,
    userName: user.email ?? user.id,
    excludeCredentialIds: (existing ?? []).map((c) => c.credential_id),
  });

  const cookieStore = await cookies();
  cookieStore.set(REG_CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 5 * 60,
    path: "/",
  });

  return { ok: true, options };
}

export async function finishPasskeyRegistrationAction(
  response: RegistrationResponseJSON,
  deviceLabel: string
): Promise<ActionResult> {
  const user = await requireUser();
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(REG_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) return { ok: false, error: "Sesja rejestracji wygasła. Spróbuj ponownie." };

  let verification;
  try {
    verification = await checkRegistrationResponse({ response, expectedChallenge });
  } catch {
    return { ok: false, error: "Nie udało się zweryfikować klucza dostępu." };
  }
  cookieStore.delete(REG_CHALLENGE_COOKIE);
  if (!verification.verified) return { ok: false, error: "Nie udało się zweryfikować klucza dostępu." };

  const { credential } = verification.registrationInfo;
  const supabase = await createClient();
  const { error } = await supabase.from("webauthn_credentials").insert({
    credential_id: credential.id,
    user_id: user.id,
    public_key: Buffer.from(credential.publicKey).toString("base64"),
    counter: credential.counter,
    transports: credential.transports ?? [],
    device_label: deviceLabel.trim().slice(0, 60) || null,
  });
  if (error) return { ok: false, error: "Nie udało się zapisać klucza dostępu." };

  await syncHasTwoFactorMetadata();
  revalidatePath("/profile");
  return { ok: true };
}

export async function deleteWebauthnCredentialAction(credentialId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("webauthn_credentials")
    .delete()
    .eq("credential_id", credentialId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Nie udało się usunąć klucza dostępu." };

  await syncHasTwoFactorMetadata();
  revalidatePath("/profile");
  return { ok: true };
}
