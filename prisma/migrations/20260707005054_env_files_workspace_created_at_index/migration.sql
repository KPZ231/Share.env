-- DropIndex
DROP INDEX "env_files_workspace_id_idx";

-- CreateIndex
CREATE INDEX "env_files_workspace_id_created_at_idx" ON "env_files"("workspace_id", "created_at");
