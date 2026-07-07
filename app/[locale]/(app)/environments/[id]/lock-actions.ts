"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaces } from "@/lib/dashboard";
import { hasAnyTwoFactorMethod, getTwoFactorStatus } from "@/lib/two-factor";
import { verifyTotpCode } from "@/lib/totp";
import { decryptTotpSecret } from "@/lib/totp-crypto";
import { buildAuthenticationOptions, checkAuthenticationResponse } from "@/lib/webauthn";
import {
  hashPassword,
  verifyPassword,
  signPasswordStepToken,
  verifyPasswordStepToken,
  signTwoFactorStepToken,
  verifyTwoFactorStepToken,
  signUnlockToken,
  unlockCookieName,
  passwordStepCookieName,
  twoFactorStepCookieName,
  UNLOCK_COOKIE_MAX_AGE_SECONDS,
  PASSWORD_STEP_COOKIE_MAX_AGE_SECONDS,
  TWO_FACTOR_STEP_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/env-lock";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MIN_PASSWORD_LENGTH = 8;
const AUTH_CHALLENGE_COOKIE = (envFileId: string) => `webauthn_auth_challenge_${envFileId}`;

async function requireEditorRole(workspaceId: string): Promise<{ ok: true; isOwner: boolean } | { ok: false; error: string }> {
  const workspaces = await getUserWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace || workspace.role === "viewer") {
    return { ok: false, error: "Nie masz uprawnień do zmiany ochrony tego środowiska." };
  }
  return { ok: true, isOwner: workspace.role === "owner" };
}

async function setCookie(name: string, value: string, maxAgeSeconds: number) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: maxAgeSeconds,
    path: "/",
  });
}

/** Step 1 of unlocking: checks the password, issues a short-lived token consumed by the 2FA step. */
export async function verifyEnvironmentPasswordAction(
  envFileId: string,
  password: string
): Promise<{ ok: true; hasTotp: boolean; hasPasskeys: boolean } | { ok: false; error: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: envFile } = await supabase
    .from("env_files")
    .select("id, password_hash")
    .eq("id", envFileId)
    .maybeSingle();
  if (!envFile) return { ok: false, error: "Nie znaleziono środowiska." };
  if (!envFile.password_hash) return { ok: false, error: "To środowisko nie jest chronione hasłem." };

  if (!verifyPassword(password, envFile.password_hash)) {
    return { ok: false, error: "Nieprawidłowe hasło." };
  }

  await setCookie(
    passwordStepCookieName(envFileId),
    signPasswordStepToken(envFileId, user.id),
    PASSWORD_STEP_COOKIE_MAX_AGE_SECONDS
  );

  const status = await getTwoFactorStatus();
  return { ok: true, hasTotp: status.hasTotp, hasPasskeys: status.passkeys.length > 0 };
}

async function requirePasswordStep(envFileId: string, userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(passwordStepCookieName(envFileId))?.value;
  return !!token && verifyPasswordStepToken(token, envFileId, userId);
}

async function grantUnlock(envFileId: string, userId: string) {
  const cookieStore = await cookies();
  cookieStore.delete(passwordStepCookieName(envFileId));
  cookieStore.delete(twoFactorStepCookieName(envFileId));
  cookieStore.set(unlockCookieName(envFileId), signUnlockToken(envFileId, userId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: UNLOCK_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

async function grantTwoFactorStep(envFileId: string, userId: string) {
  const cookieStore = await cookies();
  cookieStore.delete(passwordStepCookieName(envFileId));
  cookieStore.set(twoFactorStepCookieName(envFileId), signTwoFactorStepToken(envFileId, userId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: TWO_FACTOR_STEP_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export type TwoFactorStepResult =
  | { ok: true; requiresAccessKey: false }
  | { ok: true; requiresAccessKey: true }
  | { ok: false; error: string };

/**
 * Completes step 2 (TOTP or passkey): for protection_level = password_2fa
 * this grants the real unlock; for password_2fa_key it instead issues the
 * 2FA-step token consumed by the Access Key step (verifyEnvironmentAccessKeyAction).
 */
async function finishTwoFactorStep(envFileId: string, userId: string): Promise<TwoFactorStepResult> {
  const supabase = await createClient();
  const { data: envFile } = await supabase
    .from("env_files")
    .select("protection_level")
    .eq("id", envFileId)
    .maybeSingle();

  if (envFile?.protection_level === "password_2fa_key") {
    await grantTwoFactorStep(envFileId, userId);
    revalidatePath(`/environments/${envFileId}`);
    return { ok: true, requiresAccessKey: true };
  }

  await grantUnlock(envFileId, userId);
  revalidatePath(`/environments/${envFileId}`);
  return { ok: true, requiresAccessKey: false };
}

async function requireTwoFactorStep(envFileId: string, userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(twoFactorStepCookieName(envFileId))?.value;
  return !!token && verifyTwoFactorStepToken(token, envFileId, userId);
}

/** Step 3: the workspace-issued Access Key, for protection_level = password_2fa_key only. */
export async function verifyEnvironmentAccessKeyAction(envFileId: string, accessKey: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await requireTwoFactorStep(envFileId, user.id))) {
    return { ok: false, error: "Sesja weryfikacji wygasła. Zacznij od hasła ponownie." };
  }

  const supabase = await createClient();
  const { data: envFile } = await supabase.from("env_files").select("workspace_id").eq("id", envFileId).maybeSingle();
  if (!envFile) return { ok: false, error: "Nie znaleziono środowiska." };

  const { data: member } = await supabase
    .from("workspace_members")
    .select("access_key_hash")
    .eq("workspace_id", envFile.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member?.access_key_hash) {
    return { ok: false, error: "Nie masz jeszcze wygenerowanego klucza zabezpieczeń. Poproś ownera o jego wygenerowanie." };
  }
  if (!verifyPassword(accessKey, member.access_key_hash)) {
    return { ok: false, error: "Nieprawidłowy klucz zabezpieczeń." };
  }

  await grantUnlock(envFileId, user.id);
  revalidatePath(`/environments/${envFileId}`);
  return { ok: true };
}

/** Step 2 (TOTP option): consumes the password-step token, verifies the code, issues the next-step cookie. */
export async function verifyEnvironmentTotpAction(envFileId: string, code: string): Promise<TwoFactorStepResult> {
  const user = await requireUser();
  if (!(await requirePasswordStep(envFileId, user.id))) {
    return { ok: false, error: "Sesja weryfikacji wygasła. Wpisz hasło ponownie." };
  }

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

  return finishTwoFactorStep(envFileId, user.id);
}

/** Step 2 (passkey option), part A: issue a WebAuthn authentication challenge. */
export async function startEnvironmentPasskeyAuthAction(
  envFileId: string
): Promise<{ ok: true; options: Awaited<ReturnType<typeof buildAuthenticationOptions>> } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!(await requirePasswordStep(envFileId, user.id))) {
    return { ok: false, error: "Sesja weryfikacji wygasła. Wpisz hasło ponownie." };
  }

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

  await setCookie(AUTH_CHALLENGE_COOKIE(envFileId), options.challenge, 5 * 60);
  return { ok: true, options };
}

/** Step 2 (passkey option), part B: verify the ceremony response and issue the next-step cookie. */
export async function finishEnvironmentPasskeyAuthAction(
  envFileId: string,
  response: AuthenticationResponseJSON
): Promise<TwoFactorStepResult> {
  const user = await requireUser();
  if (!(await requirePasswordStep(envFileId, user.id))) {
    return { ok: false, error: "Sesja weryfikacji wygasła. Wpisz hasło ponownie." };
  }

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(AUTH_CHALLENGE_COOKIE(envFileId))?.value;
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
  cookieStore.delete(AUTH_CHALLENGE_COOKIE(envFileId));
  if (!verification.verified) return { ok: false, error: "Nie udało się zweryfikować klucza dostępu." };

  await supabase
    .from("webauthn_credentials")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("credential_id", credentialRow.credential_id);

  return finishTwoFactorStep(envFileId, user.id);
}

export type ProtectionLevel = "password_2fa" | "password_2fa_key";

export async function setEnvironmentPasswordAction(
  envFileId: string,
  password: string,
  protectionLevel: ProtectionLevel = "password_2fa"
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: envFile } = await supabase
    .from("env_files")
    .select("id, workspace_id")
    .eq("id", envFileId)
    .maybeSingle();
  if (!envFile) return { ok: false, error: "Nie znaleziono środowiska." };

  const roleCheck = await requireEditorRole(envFile.workspace_id);
  if (!roleCheck.ok) return roleCheck;

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.` };
  }
  if (!(await hasAnyTwoFactorMethod())) {
    return {
      ok: false,
      error: "Zanim ochronisz środowisko, dodaj metodę 2FA (klucz dostępu lub aplikację uwierzytelniającą) w swoim profilu.",
    };
  }

  const { error } = await supabase
    .from("env_files")
    .update({ password_hash: hashPassword(password), protection_level: protectionLevel })
    .eq("id", envFileId);
  if (error) return { ok: false, error: "Nie udało się ustawić hasła." };

  // The person who just set the password already proved it to themselves in
  // this same request  unlock immediately instead of locking them out of
  // their own action.
  await grantUnlock(envFileId, user.id);

  revalidatePath(`/environments/${envFileId}`);
  revalidatePath("/environments");
  return { ok: true };
}

export async function removeEnvironmentPasswordAction(
  envFileId: string,
  currentPassword: string
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { data: envFile } = await supabase
    .from("env_files")
    .select("id, workspace_id, password_hash")
    .eq("id", envFileId)
    .maybeSingle();
  if (!envFile) return { ok: false, error: "Nie znaleziono środowiska." };

  const roleCheck = await requireEditorRole(envFile.workspace_id);
  if (!roleCheck.ok) return roleCheck;

  // Owners are the recovery path if 2FA/password is unavailable; everyone
  // else must prove the current password again, even from an already
  // unlocked session (defends against a hijacked/idle unlocked tab).
  if (!roleCheck.isOwner) {
    if (!envFile.password_hash || !verifyPassword(currentPassword, envFile.password_hash)) {
      return { ok: false, error: "Nieprawidłowe hasło." };
    }
  }

  const { error } = await supabase
    .from("env_files")
    .update({ password_hash: null, protection_level: "none" })
    .eq("id", envFileId);
  if (error) return { ok: false, error: "Nie udało się usunąć ochrony." };

  revalidatePath(`/environments/${envFileId}`);
  revalidatePath("/environments");
  return { ok: true };
}
