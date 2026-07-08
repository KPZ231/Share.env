// Fixed option ids for the onboarding analytics questions (see
// components/onboarding-form.tsx). Shared between the client select inputs
// and the server action's validation so the two can never drift.

export const REFERRAL_SOURCE_OPTIONS = [
  "search",
  "social_media",
  "friend_colleague",
  "github",
  "other",
] as const;
export type ReferralSource = (typeof REFERRAL_SOURCE_OPTIONS)[number];

export const ACCOUNT_TYPE_OPTIONS = ["company", "individual"] as const;
export type AccountType = (typeof ACCOUNT_TYPE_OPTIONS)[number];

export const COMPANY_SIZE_OPTIONS = ["1", "2_10", "11_50", "51_200", "200_plus"] as const;
export type CompanySize = (typeof COMPANY_SIZE_OPTIONS)[number];

export function isReferralSource(value: string): value is ReferralSource {
  return (REFERRAL_SOURCE_OPTIONS as readonly string[]).includes(value);
}

export function isAccountType(value: string): value is AccountType {
  return (ACCOUNT_TYPE_OPTIONS as readonly string[]).includes(value);
}

export function isCompanySize(value: string): value is CompanySize {
  return (COMPANY_SIZE_OPTIONS as readonly string[]).includes(value);
}
