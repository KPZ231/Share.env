-- Per-environment linked GitHub repo (metadata only, no access granted by linking).
ALTER TABLE "env_files" ADD COLUMN "github_owner" TEXT;
ALTER TABLE "env_files" ADD COLUMN "github_repo" TEXT;

-- CreateTable
CREATE TABLE "github_connections" (
    "user_id" UUID NOT NULL,
    "github_user_id" INTEGER NOT NULL,
    "github_login" TEXT NOT NULL,
    "github_avatar_url" TEXT,
    "access_token_enc" TEXT NOT NULL,
    "access_token_iv" TEXT NOT NULL,
    "access_token_tag" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "github_connections_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "github_connections"
  ADD CONSTRAINT "github_connections_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;

-- Row Level Security: self-only, no exceptions  a GitHub token belongs to
-- the person who authorized it, never to a workspace.
ALTER TABLE "github_connections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "github_connections_select_self" ON "github_connections"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "github_connections_insert_self" ON "github_connections"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "github_connections_update_self" ON "github_connections"
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "github_connections_delete_self" ON "github_connections"
  FOR DELETE USING (user_id = auth.uid());
