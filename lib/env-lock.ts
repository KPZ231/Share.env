import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password gate + stateless unlock tokens for password-protected
 * environments. This is a UX/access-control gate on top of RLS, not a
 * cryptographic boundary  the .env blob itself stays server-side/at-rest
 * encrypted via Supabase Storage defaults (see CLAUDE.md's existing
 * client-side-encryption decision). Losing this password does NOT lose the
 * data; an editor+/owner can reset it.
 */

const SCRYPT_KEY_LENGTH = 64;
const UNLOCK_TTL_MS = 15 * 60 * 1000;
const PASSWORD_STEP_TTL_MS = 5 * 60 * 1000;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function getUnlockSecret(): string {
  const secret = process.env.ENV_UNLOCK_SECRET;
  if (!secret) throw new Error("ENV_UNLOCK_SECRET is not configured");
  return secret;
}

function sign(purpose: string, envFileId: string, userId: string, ttlMs: number): string {
  const exp = Date.now() + ttlMs;
  const payload = `${purpose}.${envFileId}.${userId}.${exp}`;
  const sig = createHmac("sha256", getUnlockSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verify(purpose: string, token: string, envFileId: string, userId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 5) return false;
  const [tokenPurpose, tokenEnvId, tokenUserId, expStr, sig] = parts;
  if (tokenPurpose !== purpose || tokenEnvId !== envFileId || tokenUserId !== userId) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const payload = `${tokenPurpose}.${tokenEnvId}.${tokenUserId}.${expStr}`;
  const expectedSig = createHmac("sha256", getUnlockSecret()).update(payload).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Issued once password + 2FA both succeed. Grants reading the environment's plaintext. */
export function signUnlockToken(envFileId: string, userId: string): string {
  return sign("unlock", envFileId, userId, UNLOCK_TTL_MS);
}
export function verifyUnlockToken(token: string, envFileId: string, userId: string): boolean {
  return verify("unlock", token, envFileId, userId);
}

/** Issued once the password step succeeds, consumed by the 2FA step. Cannot unlock on its own. */
export function signPasswordStepToken(envFileId: string, userId: string): string {
  return sign("pwstep", envFileId, userId, PASSWORD_STEP_TTL_MS);
}
export function verifyPasswordStepToken(token: string, envFileId: string, userId: string): boolean {
  return verify("pwstep", token, envFileId, userId);
}

/**
 * Issued once the 2FA step succeeds for a password_2fa_key file, consumed by
 * the Access Key step. Cannot unlock on its own  mirrors the password-step
 * pattern one factor further.
 */
export function signTwoFactorStepToken(envFileId: string, userId: string): string {
  return sign("2fastep", envFileId, userId, PASSWORD_STEP_TTL_MS);
}
export function verifyTwoFactorStepToken(token: string, envFileId: string, userId: string): boolean {
  return verify("2fastep", token, envFileId, userId);
}
export const TWO_FACTOR_STEP_COOKIE_MAX_AGE_SECONDS = PASSWORD_STEP_TTL_MS / 1000;
export function twoFactorStepCookieName(envFileId: string) {
  return `env_2fastep_${envFileId}`;
}

export const UNLOCK_COOKIE_MAX_AGE_SECONDS = UNLOCK_TTL_MS / 1000;
export const PASSWORD_STEP_COOKIE_MAX_AGE_SECONDS = PASSWORD_STEP_TTL_MS / 1000;
export function unlockCookieName(envFileId: string) {
  return `env_unlock_${envFileId}`;
}
export function passwordStepCookieName(envFileId: string) {
  return `env_pwstep_${envFileId}`;
}

/**
 * Account-level sign-in 2FA: verified once per browser/device, not
 * re-prompted on every request  same "remember this device for a while"
 * model as GitHub/Google. Cleared on sign-out (see lib/auth-actions.ts) so it
 * doesn't linger on a shared computer.
 */
const ACCOUNT_2FA_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const ACCOUNT_2FA_COOKIE = "account_2fa_verified";
export const ACCOUNT_2FA_COOKIE_MAX_AGE_SECONDS = ACCOUNT_2FA_TTL_MS / 1000;

export function signAccountTwoFactorToken(userId: string): string {
  return sign("account2fa", "account", userId, ACCOUNT_2FA_TTL_MS);
}
export function verifyAccountTwoFactorToken(token: string, userId: string): boolean {
  return verify("account2fa", token, "account", userId);
}

/** CSRF nonce for the GitHub OAuth connect/callback round trip  self-verifying, no server-side state store needed. */
const GITHUB_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export function signGithubOAuthState(userId: string): string {
  return sign("github_oauth", "github", userId, GITHUB_OAUTH_STATE_TTL_MS);
}
export function verifyGithubOAuthState(state: string, userId: string): boolean {
  return verify("github_oauth", state, "github", userId);
}

// Minimal self-check  run with `npx tsx lib/env-lock.ts`.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("lib/env-lock.ts")) {
  process.env.ENV_UNLOCK_SECRET ||= "self-check-secret-do-not-use-in-prod";

  const hash = hashPassword("correct horse battery staple");
  console.assert(verifyPassword("correct horse battery staple", hash), "correct password must verify");
  console.assert(!verifyPassword("wrong password", hash), "wrong password must not verify");
  console.assert(hash.includes(":"), "stored hash must include salt separator");

  const envId = "11111111-1111-1111-1111-111111111111";
  const userId = "22222222-2222-2222-2222-222222222222";

  const unlockToken = signUnlockToken(envId, userId);
  console.assert(verifyUnlockToken(unlockToken, envId, userId), "freshly signed unlock token must verify");
  console.assert(!verifyUnlockToken(unlockToken, envId, "other-user"), "token must not verify for another user");
  console.assert(!verifyUnlockToken(unlockToken, "other-env", userId), "token must not verify for another env");
  console.assert(
    !verifyPasswordStepToken(unlockToken, envId, userId),
    "an unlock token must not verify as a password-step token"
  );
  const accountToken = signAccountTwoFactorToken(userId);
  console.assert(verifyAccountTwoFactorToken(accountToken, userId), "freshly signed account 2FA token must verify");
  console.assert(!verifyAccountTwoFactorToken(accountToken, "other-user"), "account token must not verify for another user");
  console.assert(!verifyUnlockToken(accountToken, envId, userId), "an account token must not verify as an env unlock token");

  const twoFaStepToken = signTwoFactorStepToken(envId, userId);
  console.assert(verifyTwoFactorStepToken(twoFaStepToken, envId, userId), "freshly signed 2FA-step token must verify");
  console.assert(
    !verifyUnlockToken(twoFaStepToken, envId, userId),
    "a 2FA-step token must not verify as an unlock token"
  );

  const githubState = signGithubOAuthState(userId);
  console.assert(verifyGithubOAuthState(githubState, userId), "freshly signed github oauth state must verify");
  console.assert(!verifyGithubOAuthState(githubState, "other-user"), "github oauth state must not verify for another user");

  console.assert(
    !verifyUnlockToken(unlockToken.slice(0, -1) + "0", envId, userId),
    "a tampered signature must not verify"
  );

  console.log("lib/env-lock.ts self-check passed");
}
