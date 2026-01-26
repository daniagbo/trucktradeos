-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateIndex
CREATE INDEX "listings_brand_idx" ON "listings" USING GIN ("brand" gin_trgm_ops);

-- DropIndex (if exists from previous manual attempts or old schema)
DROP INDEX IF EXISTS "listings_brand_key";
