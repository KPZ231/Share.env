// ponytail: assert-based self-check, no test framework -- run with
// `npx tsx scripts/billing-selfcheck.ts`. Guards the pure math shared by
// lib/billing.ts and lib/env-billing.ts's gate/sync formulas.
import assert from "node:assert";
import { FREE_ENVIRONMENT_LIMIT, monthlyCost } from "../lib/billing";

// Mirrors the quantity formula in lib/env-billing.ts's syncSubscriptionQuantity.
const paidUnits = (envs: number) => Math.max(0, envs - FREE_ENVIRONMENT_LIMIT);

assert.equal(paidUnits(0), 0);
assert.equal(paidUnits(3), 0); // free tier boundary
assert.equal(paidUnits(4), 1); // first paid environment
assert.equal(paidUnits(10), 7);

assert.equal(monthlyCost(3), 0);
assert.equal(monthlyCost(4), 2);
assert.equal(monthlyCost(10), 14);

// Mirrors the decision table in checkCanAddEnvironment.
const decide = (count: number, subscriptionActive: boolean) =>
  count < FREE_ENVIRONMENT_LIMIT ? "ok" : subscriptionActive ? "ok" : "needs_checkout";

assert.equal(decide(2, false), "ok");
assert.equal(decide(3, false), "needs_checkout");
assert.equal(decide(3, true), "ok");
assert.equal(decide(4, true), "ok");

console.log("billing self-check passed");
