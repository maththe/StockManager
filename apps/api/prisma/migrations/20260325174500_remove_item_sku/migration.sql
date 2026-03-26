DROP INDEX IF EXISTS "items_skuCode_key";

ALTER TABLE "items"
DROP COLUMN IF EXISTS "skuCode";
