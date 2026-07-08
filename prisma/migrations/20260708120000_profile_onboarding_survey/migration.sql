-- Onboarding analytics: asked once on the onboarding form (see
-- components/onboarding-form.tsx), never re-asked. Nullable -- existing
-- rows and anyone who lands on /onboarding via an edge case predate these.
ALTER TABLE "profiles" ADD COLUMN "referral_source" TEXT;
ALTER TABLE "profiles" ADD COLUMN "account_type" TEXT;
ALTER TABLE "profiles" ADD COLUMN "company_size" TEXT;
