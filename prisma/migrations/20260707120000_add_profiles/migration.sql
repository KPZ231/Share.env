-- CreateTable
CREATE TABLE "profiles" (
    "user_id" UUID NOT NULL,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_path" TEXT,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "product_emails_consent" BOOLEAN NOT NULL DEFAULT true,
    "interested_integrations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- profiles.user_id is a Supabase auth user id, not a separate FK-tracked
-- entity  enforce the relationship without a formal foreign key (Prisma
-- doesn't manage auth.users), same pattern as created_by columns elsewhere.
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;

-- Row Level Security: deny-all by default; a user may only ever see/edit
-- their own profile row.
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_self" ON "profiles"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_self" ON "profiles"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_self" ON "profiles"
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "profiles_delete_self" ON "profiles"
  FOR DELETE USING (user_id = auth.uid());

-- Storage: create the "avatars" bucket manually in the Supabase dashboard
-- (private, no public access  served via signed URLs, same trust model as
-- "env-files"). Objects are stored at "{user_id}/{filename}" so ownership is
-- checkable from the path alone.
CREATE POLICY "avatars_bucket_select_self" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_bucket_write_self" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_bucket_update_self" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_bucket_delete_self" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
