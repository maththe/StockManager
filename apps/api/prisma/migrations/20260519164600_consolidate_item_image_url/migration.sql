-- Consolidate item image columns: schema expects a single `image_url`.
-- Preserve any data by coalescing the existing variant columns before dropping them.
ALTER TABLE "items" ADD COLUMN "image_url" TEXT;

UPDATE "items"
SET "image_url" = COALESCE("modal_image_url", "thumbnail_image_url")
WHERE "image_url" IS NULL;

ALTER TABLE "items"
  DROP COLUMN "thumbnail_image_url",
  DROP COLUMN "modal_image_url";
