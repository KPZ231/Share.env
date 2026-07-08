-- CLI device-code auth (envshare login) + long-lived CLI bearer tokens.
-- Both tables are Prisma-only (same trust level as service_role)  RLS is
-- enabled with zero policies, so the only path in is the trusted Prisma
-- connection; there is no legitimate reason for supabase-js/anon/authenticated
-- to touch these directly.
CREATE TABLE "cli_device_auths" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_code_hash" TEXT NOT NULL,
    "user_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "user_id" UUID,
    "issued_token" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "cli_device_auths_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cli_device_auths_device_code_hash_key" ON "cli_device_auths"("device_code_hash");
CREATE UNIQUE INDEX "cli_device_auths_user_code_key" ON "cli_device_auths"("user_code");

CREATE TABLE "cli_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "cli_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cli_tokens_token_hash_key" ON "cli_tokens"("token_hash");
CREATE INDEX "cli_tokens_user_id_idx" ON "cli_tokens"("user_id");

ALTER TABLE "cli_device_auths" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cli_tokens" ENABLE ROW LEVEL SECURITY;
