-- Per-environment password protection.
ALTER TABLE "env_files" ADD COLUMN "password_hash" TEXT;

-- CreateTable
CREATE TABLE "totp_credentials" (
    "user_id" UUID NOT NULL,
    "secret_enc" TEXT NOT NULL,
    "secret_iv" TEXT NOT NULL,
    "secret_tag" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "totp_credentials_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "totp_credentials"
  ADD CONSTRAINT "totp_credentials_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "credential_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "public_key" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "device_label" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("credential_id")
);

ALTER TABLE "webauthn_credentials"
  ADD CONSTRAINT "webauthn_credentials_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX "webauthn_credentials_user_id_idx" ON "webauthn_credentials"("user_id");

-- Row Level Security: both credential tables are self-only, no exceptions
-- (not even editor/owner  a 2FA credential belongs to the person
-- authenticating, never to a workspace).
ALTER TABLE "totp_credentials" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "totp_credentials_select_self" ON "totp_credentials"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "totp_credentials_insert_self" ON "totp_credentials"
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "totp_credentials_update_self" ON "totp_credentials"
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "totp_credentials_delete_self" ON "totp_credentials"
  FOR DELETE USING (user_id = auth.uid());

ALTER TABLE "webauthn_credentials" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webauthn_credentials_select_self" ON "webauthn_credentials"
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "webauthn_credentials_insert_self" ON "webauthn_credentials"
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE is needed so a successful authentication ceremony can bump its own
-- replay-protection counter.
CREATE POLICY "webauthn_credentials_update_self" ON "webauthn_credentials"
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "webauthn_credentials_delete_self" ON "webauthn_credentials"
  FOR DELETE USING (user_id = auth.uid());
