-- Free-text notes and an optional linked website URL, shown in the
-- environment detail sidebar. Both nullable  purely descriptive, not used in
-- any authorization or RLS decision.
ALTER TABLE "env_files" ADD COLUMN "description" TEXT;
ALTER TABLE "env_files" ADD COLUMN "website_url" TEXT;
