-- AlterTable: add requestedQuantity to task_items
ALTER TABLE "task_items" ADD COLUMN "requestedQuantity" INTEGER NOT NULL DEFAULT 0;

-- Backfill: tasks já existentes assumem que pediam a quantidade total planejada do EventItem
UPDATE "task_items" ti
SET "requestedQuantity" = ei."plannedQuantity"
FROM "event_items" ei
WHERE ti."eventItemId" = ei."id";
