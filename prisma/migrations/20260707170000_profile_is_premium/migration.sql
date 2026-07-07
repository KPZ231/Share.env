-- Manual premium flag until a real subscription flow exists.
ALTER TABLE "profiles" ADD COLUMN "is_premium" BOOLEAN NOT NULL DEFAULT false;

-- profiles_update_self allows a user to update every column of their own
-- row, including this one  without this trigger a user could grant
-- themselves premium via a direct supabase-js call. Lock the column for the
-- "authenticated" Postgres role (the one RLS-scoped client requests run as);
-- Prisma (a different DB role, used server-side once a real billing flow
-- exists) and any future service_role write path are unaffected.
CREATE OR REPLACE FUNCTION lock_profiles_is_premium()
RETURNS trigger AS $$
BEGIN
  IF current_user = 'authenticated' AND NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    NEW.is_premium := OLD.is_premium;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER profiles_lock_is_premium
  BEFORE UPDATE ON "profiles"
  FOR EACH ROW EXECUTE FUNCTION lock_profiles_is_premium();
