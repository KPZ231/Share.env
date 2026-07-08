-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "description" TEXT;
ALTER TABLE "workspaces" ADD COLUMN "logo_path" TEXT;

-- Storage: create the "workspace-logos" bucket manually in the Supabase
-- dashboard (private, served via signed URLs, same trust model as
-- "avatars"). Objects are stored at "{workspace_id}/{filename}" so
-- membership/ownership is checkable from the path alone via
-- is_workspace_member(), same helper the table policies use.
CREATE POLICY "workspace_logos_bucket_select_member" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'workspace-logos'
    AND is_workspace_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "workspace_logos_bucket_write_owner" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'workspace-logos'
    AND is_workspace_member((storage.foldername(name))[1]::uuid, 'owner')
  );

CREATE POLICY "workspace_logos_bucket_update_owner" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'workspace-logos'
    AND is_workspace_member((storage.foldername(name))[1]::uuid, 'owner')
  );

CREATE POLICY "workspace_logos_bucket_delete_owner" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'workspace-logos'
    AND is_workspace_member((storage.foldername(name))[1]::uuid, 'owner')
  );
