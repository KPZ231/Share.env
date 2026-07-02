-- CreateEnum
CREATE TYPE "workspace_role" AS ENUM ('owner', 'editor', 'viewer');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "workspace_role" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspace_id","user_id")
);

-- CreateTable
CREATE TABLE "env_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "env_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "env_file_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspaces_owner_id_idx" ON "workspaces"("owner_id");

-- CreateIndex
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members"("user_id");

-- CreateIndex
CREATE INDEX "env_files_workspace_id_idx" ON "env_files"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_env_file_id_idx" ON "share_links"("env_file_id");

-- AddForeignKey (workspaces/members/env_files/share_links relations Prisma manages)
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "env_files" ADD CONSTRAINT "env_files_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_env_file_id_fkey" FOREIGN KEY ("env_file_id") REFERENCES "env_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Everything below this line is hand-written, not Prisma-generated.
-- Prisma has no concept of Supabase's auth.users table, Row Level Security,
-- SQL functions, or Storage policies, so they are maintained here directly.
-- Do not remove this section when regenerating migrations with `prisma migrate dev`.
-- ============================================================================

-- Foreign keys into Supabase's own auth.users table.
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES auth.users ("id") ON DELETE CASCADE;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users ("id") ON DELETE CASCADE;
ALTER TABLE "env_files" ADD CONSTRAINT "env_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES auth.users ("id") ON DELETE CASCADE;
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES auth.users ("id") ON DELETE CASCADE;

-- Helper: is the current user a member of this workspace, optionally with a
-- minimum role? Defined once, reused by every policy below instead of
-- repeating the join in each policy.
CREATE FUNCTION is_workspace_member(
  target_workspace_id uuid,
  min_role workspace_role DEFAULT 'viewer'
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members m
    WHERE m.workspace_id = target_workspace_id
      AND m.user_id = auth.uid()
      AND (
        min_role = 'viewer'
        OR (min_role = 'editor' AND m.role IN ('editor', 'owner'))
        OR (min_role = 'owner' AND m.role = 'owner')
      )
  );
$$;

-- Row Level Security: every table is enabled with deny-all as the starting
-- point; access is granted only through the explicit policies below.
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "env_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "share_links" ENABLE ROW LEVEL SECURITY;

-- workspaces: members can read; only the owner can update/delete; any
-- authenticated user can create one (they become its owner).
CREATE POLICY "workspaces_select_members" ON "workspaces"
  FOR SELECT USING (is_workspace_member(id));

CREATE POLICY "workspaces_insert_self" ON "workspaces"
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspaces_update_owner" ON "workspaces"
  FOR UPDATE USING (is_workspace_member(id, 'owner'));

CREATE POLICY "workspaces_delete_owner" ON "workspaces"
  FOR DELETE USING (is_workspace_member(id, 'owner'));

-- workspace_members: members can see the roster; only owners manage it.
CREATE POLICY "members_select_members" ON "workspace_members"
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "members_insert_owner" ON "workspace_members"
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "members_update_owner" ON "workspace_members"
  FOR UPDATE USING (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "members_delete_owner" ON "workspace_members"
  FOR DELETE USING (is_workspace_member(workspace_id, 'owner'));

-- env_files: viewers can read, editors+ can write/delete.
CREATE POLICY "env_files_select_members" ON "env_files"
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "env_files_insert_editor" ON "env_files"
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, 'editor'));

CREATE POLICY "env_files_update_editor" ON "env_files"
  FOR UPDATE USING (is_workspace_member(workspace_id, 'editor'));

CREATE POLICY "env_files_delete_editor" ON "env_files"
  FOR DELETE USING (is_workspace_member(workspace_id, 'editor'));

-- share_links: visible/manageable by members of the owning file's workspace.
-- Anonymous token resolution (no session) is NOT done through this policy —
-- it goes through lib/supabase/admin.ts, which must independently check
-- expires_at/revoked before returning the file.
CREATE POLICY "share_links_select_members" ON "share_links"
  FOR SELECT USING (
    is_workspace_member((SELECT workspace_id FROM env_files WHERE id = env_file_id))
  );

CREATE POLICY "share_links_insert_editor" ON "share_links"
  FOR INSERT WITH CHECK (
    is_workspace_member((SELECT workspace_id FROM env_files WHERE id = env_file_id), 'editor')
  );

CREATE POLICY "share_links_update_editor" ON "share_links"
  FOR UPDATE USING (
    is_workspace_member((SELECT workspace_id FROM env_files WHERE id = env_file_id), 'editor')
  );

CREATE POLICY "share_links_delete_editor" ON "share_links"
  FOR DELETE USING (
    is_workspace_member((SELECT workspace_id FROM env_files WHERE id = env_file_id), 'editor')
  );

-- Storage: create the "env-files" bucket manually in the Supabase dashboard
-- (private, no public access). Objects are stored at
-- "{workspace_id}/{env_file_id}" so the policy can check membership from the
-- path alone.
CREATE POLICY "env_files_bucket_select_members" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'env-files'
    AND is_workspace_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "env_files_bucket_write_editor" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'env-files'
    AND is_workspace_member((storage.foldername(name))[1]::uuid, 'editor')
  );

CREATE POLICY "env_files_bucket_delete_editor" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'env-files'
    AND is_workspace_member((storage.foldername(name))[1]::uuid, 'editor')
  );
