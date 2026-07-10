-- Integration system: workspace-owned connections to external secret stores
-- (GitHub Actions, GitLab, Vercel, Netlify) and chat webhooks (Slack, Discord),
-- plus a per-env-file sync target map and a secret-free audit log of pushes.

ALTER TABLE "env_files" ADD COLUMN "sync_targets" JSONB;

CREATE TABLE "integration_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT,
    "credential_enc" TEXT NOT NULL,
    "credential_iv" TEXT NOT NULL,
    "credential_tag" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_connections_workspace_id_provider_key"
  ON "integration_connections"("workspace_id", "provider");

ALTER TABLE "integration_connections"
  ADD CONSTRAINT "integration_connections_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;

CREATE TABLE "integration_sync_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "env_file_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "target_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "triggered_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "integration_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "integration_sync_logs_workspace_id_created_at_idx"
  ON "integration_sync_logs"("workspace_id", "created_at");

-- Row Level Security: same is_workspace_member() helper as every other
-- workspace-scoped table. Only owners may create/remove a connection or read
-- its row (the credential blob included, though it's ciphertext); any member
-- may read the sync log so a viewer can see what's been pushed without being
-- able to trigger a push themselves (enforced in the server action, not RLS,
-- since "editor" isn't expressible as a single is_workspace_member() call for
-- inserts coming from the service layer -- see lib/membership.ts assertEditor).
ALTER TABLE "integration_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "integration_sync_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_connections_select_members" ON "integration_connections"
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "integration_connections_insert_owner" ON "integration_connections"
  FOR INSERT WITH CHECK (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "integration_connections_update_owner" ON "integration_connections"
  FOR UPDATE USING (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "integration_connections_delete_owner" ON "integration_connections"
  FOR DELETE USING (is_workspace_member(workspace_id, 'owner'));

CREATE POLICY "integration_sync_logs_select_members" ON "integration_sync_logs"
  FOR SELECT USING (is_workspace_member(workspace_id));

-- Sync logs are only ever written by Prisma/server actions (service-role
-- trust level, see lib/integrations/sync.ts), never directly by a client, so
-- there is deliberately no INSERT policy for "authenticated" here.
