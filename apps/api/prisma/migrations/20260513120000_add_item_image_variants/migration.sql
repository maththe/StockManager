-- Add separate image URLs for the small catalog card and the larger quantity modal.
ALTER TABLE "items"
ADD COLUMN "thumbnail_image_url" TEXT,
ADD COLUMN "modal_image_url" TEXT;
