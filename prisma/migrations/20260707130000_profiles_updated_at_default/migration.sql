-- profiles.updated_at was NOT NULL with no default. Prisma's @updatedAt only
-- rewrites the value when Prisma Client itself issues the write; every write
-- to this table actually goes through supabase-js (RLS-scoped), so the
-- column needs a real DB-level default and an update trigger instead.
ALTER TABLE "profiles" ALTER COLUMN "updated_at" SET DEFAULT now();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON "profiles"
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
