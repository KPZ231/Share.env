// ponytail: assert-based self-check, no test framework -- run with
// `npx tsx scripts/marketing-mail-selfcheck.ts`. Guards the consent-filter
// logic in lib/marketing-mail.ts's sendCampaign (mailing DB/SMTP aren't
// exercised here, only who gets picked).
import assert from "node:assert";

type CampaignKind = "marketing" | "product";
const profiles = [
  { userId: "u1", marketingConsent: true, productEmailsConsent: false },
  { userId: "u2", marketingConsent: false, productEmailsConsent: false },
  { userId: "u3", marketingConsent: false, productEmailsConsent: true },
];
const users = [
  { id: "u1", email: "a@test.dev" },
  { id: "u2", email: "b@test.dev" },
  { id: "u3", email: "c@test.dev" },
];

// Mirrors sendCampaign's where-clause + set-membership filter.
function recipients(kind: CampaignKind) {
  const consented = new Set(
    profiles.filter((p) => (kind === "marketing" ? p.marketingConsent : p.productEmailsConsent)).map((p) => p.userId)
  );
  return users.filter((u) => consented.has(u.id)).map((u) => u.email);
}

assert.deepEqual(recipients("marketing"), ["a@test.dev"]);
assert.deepEqual(recipients("product"), ["c@test.dev"]);

console.log("marketing-mail self-check passed");
