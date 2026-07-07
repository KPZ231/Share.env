import "server-only";

import { headers } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  type WebAuthnCredential,
} from "@simplewebauthn/server";

const RP_NAME = "Share.env";

/**
 * Derives the WebAuthn relying-party ID + expected origin from the current
 * request instead of a fixed env var, so this works unchanged across
 * localhost/preview/production domains.
 */
export async function getRelyingParty(): Promise<{ rpID: string; origin: string }> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { rpID: host.split(":")[0], origin: `${proto}://${host}` };
}

export async function buildRegistrationOptions(params: {
  userId: string;
  userName: string;
  excludeCredentialIds: string[];
}): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const { rpID } = await getRelyingParty();
  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: params.userName,
    userID: new TextEncoder().encode(params.userId),
    attestationType: "none",
    excludeCredentials: params.excludeCredentialIds.map((id) => ({ id })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  });
}

export async function checkRegistrationResponse(params: {
  response: RegistrationResponseJSON;
  expectedChallenge: string;
}) {
  const { rpID, origin } = await getRelyingParty();
  return verifyRegistrationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
}

export async function buildAuthenticationOptions(params: {
  allowCredentialIds: string[];
}): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { rpID } = await getRelyingParty();
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: params.allowCredentialIds.map((id) => ({ id })),
    // "preferred" (not "discouraged")  the whole point of this feature is
    // requiring the platform unlock (Windows Hello PIN/biometric), not just
    // credential presence.
    userVerification: "preferred",
  });
}

export async function checkAuthenticationResponse(params: {
  response: AuthenticationResponseJSON;
  expectedChallenge: string;
  credential: WebAuthnCredential;
}) {
  const { rpID, origin } = await getRelyingParty();
  return verifyAuthenticationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: params.credential,
    requireUserVerification: true,
  });
}
