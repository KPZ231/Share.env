-- CreateEnum
CREATE TYPE "protection_level" AS ENUM ('none', 'password_2fa', 'password_2fa_key');
CREATE TYPE "invitation_kind" AS ENUM ('email', 'link');

-- Workspace-issued Access Key ("Klucz Zabezpieczeń"), third factor for
-- protection_level = password_2fa_key. Same hash shape as env_files.password_hash.
ALTER TABLE "workspace_members" ADD COLUMN "access_key_hash" TEXT;
ALTER TABLE "workspace_members" ADD COLUMN "access_key_updated_at" TIMESTAMPTZ;

-- Protection tier. Existing password-protected files keep working under the
-- password_2fa tier; unprotected files default to none.
ALTER TABLE "env_files" ADD COLUMN "protection_level" "protection_level" NOT NULL DEFAULT 'none';
UPDATE "env_files" SET "protection_level" = 'password_2fa' WHERE "password_hash" IS NOT NULL;

-- CreateTable
CREATE TABLE "env_file_hidden_members" (
    "env_file_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "env_file_hidden_members_pkey" PRIMARY KEY ("env_file_id", "user_id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "kind" "invitation_kind" NOT NULL,
    "email" TEXT,
    "role" "workspace_role" NOT NULL DEFAULT 'viewer',
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMPTZ,
    "invited_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "env_file_hidden_members_workspace_id_user_id_idx" ON "env_file_hidden_members"("workspace_id", "user_id");
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");
CREATE INDEX "invitations_workspace_id_idx" ON "invitations"("workspace_id");
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- AddForeignKey
ALTER TABLE "env_file_hidden_members" ADD CONSTRAINT "env_file_hidden_members_env_file_id_fkey" FOREIGN KEY ("env_file_id") REFERENCES "env_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Everything below this line is hand-written, not Prisma-generated. See the
-- note at the top of prisma/migrations/0001_init/migration.sql.
-- ============================================================================

-- Foreign keys into Supabase's own auth.users table.
ALTER TABLE "env_file_hidden_members" ADD CONSTRAINT "env_file_hidden_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users ("id") ON DELETE CASCADE;
-- invited_by: attribution only, not ownership  keep the invite, forget who sent it.
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES auth.users ("id") ON DELETE SET NULL;

-- CHECK: a protected file must actually carry a password hash; you cannot
-- raise the tier without also setting the password.
ALTER TABLE "env_files" ADD CONSTRAINT "env_files_protection_requires_password"
  CHECK (protection_level = 'none' OR password_hash IS NOT NULL);

-- CHECK: an already-expired invite makes no sense at creation.
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_expires_at_after_created_at"
  CHECK (expires_at > created_at);

-- CHECK: email invites need an address, link invites must not have one (so a
-- link token can't accidentally be resolved as if addressed to someone).
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_kind_email_shape"
  CHECK ((kind = 'email' AND email IS NOT NULL) OR (kind = 'link' AND email IS NULL));

-- Helper: does the current user share ANY workspace with target_user_id?
-- Used to let workspace members view each other's public profile (Profile
-- rows), without opening profiles up to everyone.
CREATE FUNCTION shares_workspace_with(target_user_id uuid) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members m1
    JOIN workspace_members m2 ON m1.workspace_id = m2.workspace_id
    WHERE m1.user_id = auth.uid()
      AND m2.user_id = target_user_id
  );
$$;

REVOKE ALL ON FUNCTION shares_workspace_with(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION shares_workspace_with(uuid) TO authenticated, anon;

-- profiles: add a second SELECT policy so co-members can view each other's
-- public profile (displayName/bio/avatar). Postgres OR's multiple permissive
-- policies together, so this only ever widens (never narrows) profiles_select_self.
CREATE POLICY "profiles_select_workspace_members" ON "profiles"
  FOR SELECT USING (shares_workspace_with(user_id));

-- Row Level Security: deny-all default, explicit policies below.
ALTER TABLE "env_file_hidden_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;

-- env_file_hidden_members: owner-only in every direction  visibility
-- exceptions are an ownership lever, not something a member manages for
-- themselves (that would let a member hide files from an audit).
CREATE POLICY "hidden_members_select_owner" ON "env_file_hidden_members"
  FOR SELECT USING (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "hidden_members_insert_owner" ON "env_file_hidden_members"
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "hidden_members_delete_owner" ON "env_file_hidden_members"
  FOR DELETE USING (is_workspace_member(workspace_id, 'owner'));

-- invitations: owner-only. Resolving a token to accept an invite does NOT go
-- through this policy (the invitee isn't a member yet, so is_workspace_member
-- is false)  it goes through lib/supabase/admin.ts, which independently
-- checks expires_at/revoked/accepted_at, same pattern as ShareLink resolution.
CREATE POLICY "invitations_select_owner" ON "invitations"
  FOR SELECT USING (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "invitations_insert_owner" ON "invitations"
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "invitations_update_owner" ON "invitations"
  FOR UPDATE USING (is_workspace_member(workspace_id, 'owner'));

-- env_files: SELECT now also excludes files an owner has explicitly hidden
-- from this member. Owners always see everything (they're the ones doing the
-- hiding). Replaces the 0001_init policy of the same name.
DROP POLICY "env_files_select_members" ON "env_files";
CREATE POLICY "env_files_select_members" ON "env_files"
  FOR SELECT USING (
    is_workspace_member(workspace_id)
    AND (
      is_workspace_member(workspace_id, 'owner')
      OR NOT EXISTS (
        SELECT 1 FROM env_file_hidden_members h
        WHERE h.env_file_id = env_files.id AND h.user_id = auth.uid()
      )
    )
  );

-- Storage: same hidden-file exclusion for the actual file bytes, otherwise a
-- hidden env_files row wouldn't stop a member downloading the object
-- directly from the "env-files" bucket by path. Objects live at
-- "{workspace_id}/{env_file_id}", so (storage.foldername(name))[2] is the
-- env_file_id. Replaces the 0001_init policy of the same name.
DROP POLICY "env_files_bucket_select_members" ON storage.objects;
CREATE POLICY "env_files_bucket_select_members" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'env-files'
    AND is_workspace_member((storage.foldername(name))[1]::uuid)
    AND (
      is_workspace_member((storage.foldername(name))[1]::uuid, 'owner')
      OR NOT EXISTS (
        SELECT 1 FROM env_file_hidden_members h
        WHERE h.env_file_id = (storage.foldername(name))[2]::uuid AND h.user_id = auth.uid()
      )
    )
  );
