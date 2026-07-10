-- Stripe pay-as-you-go billing: one subscription per workspace, quantity =
-- paid environments beyond the free tier (see lib/env-billing.ts).
ALTER TABLE "workspaces" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "workspaces" ADD COLUMN "stripe_subscription_id" TEXT;
ALTER TABLE "workspaces" ADD COLUMN "stripe_subscription_status" TEXT;

CREATE INDEX "workspaces_stripe_customer_id_idx" ON "workspaces"("stripe_customer_id");

-- workspaces_update_owner lets an owner update every column of their own
-- workspace, including these  without this trigger an owner could grant
-- themselves an unlimited free ride via a direct supabase-js call (e.g.
-- setting stripe_subscription_status = 'active'). Lock all three columns for
-- the "authenticated" role (mirrors lock_profiles_is_premium); Prisma (used by
-- the webhook and billing server actions) is a different DB role and is
-- unaffected.
CREATE OR REPLACE FUNCTION lock_workspaces_billing()
RETURNS trigger AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
      NEW.stripe_customer_id := OLD.stripe_customer_id;
    END IF;
    IF NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
      NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    END IF;
    IF NEW.stripe_subscription_status IS DISTINCT FROM OLD.stripe_subscription_status THEN
      NEW.stripe_subscription_status := OLD.stripe_subscription_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER workspaces_lock_billing
  BEFORE UPDATE ON "workspaces"
  FOR EACH ROW EXECUTE FUNCTION lock_workspaces_billing();
