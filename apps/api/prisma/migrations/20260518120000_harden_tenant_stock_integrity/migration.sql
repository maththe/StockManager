-- Harden multi-tenant client isolation and core inventory invariants.

-- Password hashes are not business identifiers and should not be unique.
DROP INDEX IF EXISTS "users_password_key";

-- Clients now belong to a tenant. Existing rows are backfilled from one related
-- event/rental when possible; otherwise they are isolated under a legacy tenant.
ALTER TABLE "clients" ADD COLUMN "tenantUuid" TEXT;

UPDATE "clients" c
SET "tenantUuid" = COALESCE(
  (SELECT e."tenantUuid" FROM "events" e WHERE e."clientId" = c."id" ORDER BY e."createdAt" ASC LIMIT 1),
  (SELECT r."tenantUuid" FROM "rentals" r WHERE r."clientId" = c."id" ORDER BY r."createdAt" ASC LIMIT 1),
  'legacy-tenant'
);

ALTER TABLE "clients" ALTER COLUMN "tenantUuid" SET NOT NULL;

DROP INDEX IF EXISTS "clients_taxId_key";
CREATE UNIQUE INDEX "clients_tenantUuid_taxId_key" ON "clients"("tenantUuid", "taxId");
CREATE INDEX "clients_tenantUuid_idx" ON "clients"("tenantUuid");

-- Prevent duplicated item lines in the same event at the database layer.
CREATE UNIQUE INDEX "event_items_eventId_itemId_key" ON "event_items"("eventId", "itemId");

-- Stock and quantity invariants. NOT VALID avoids blocking deploys with legacy
-- inconsistent rows while enforcing the constraints for new/updated rows.
ALTER TABLE "items"
  ADD CONSTRAINT "items_totalQuantity_nonnegative" CHECK ("totalQuantity" >= 0) NOT VALID,
  ADD CONSTRAINT "items_availableQuantity_nonnegative" CHECK ("availableQuantity" >= 0) NOT VALID,
  ADD CONSTRAINT "items_availableQuantity_lte_totalQuantity" CHECK ("availableQuantity" <= "totalQuantity") NOT VALID,
  ADD CONSTRAINT "items_unitCost_nonnegative" CHECK ("unitCost" >= 0) NOT VALID;

ALTER TABLE "event_items"
  ADD CONSTRAINT "event_items_plannedQuantity_positive" CHECK ("plannedQuantity" > 0) NOT VALID,
  ADD CONSTRAINT "event_items_shippedQuantity_nonnegative" CHECK ("shippedQuantity" >= 0) NOT VALID,
  ADD CONSTRAINT "event_items_returnedQuantity_nonnegative" CHECK ("returnedQuantity" >= 0) NOT VALID,
  ADD CONSTRAINT "event_items_shippedQuantity_lte_plannedQuantity" CHECK ("shippedQuantity" <= "plannedQuantity") NOT VALID,
  ADD CONSTRAINT "event_items_returnedQuantity_lte_plannedQuantity" CHECK ("returnedQuantity" <= "plannedQuantity") NOT VALID;

ALTER TABLE "rental_items"
  ADD CONSTRAINT "rental_items_quantity_positive" CHECK ("quantity" > 0) NOT VALID,
  ADD CONSTRAINT "rental_items_returnedQuantity_nonnegative" CHECK ("returnedQuantity" >= 0) NOT VALID,
  ADD CONSTRAINT "rental_items_returnedQuantity_lte_quantity" CHECK ("returnedQuantity" <= "quantity") NOT VALID;

ALTER TABLE "divergence_items"
  ADD CONSTRAINT "divergence_items_quantity_positive" CHECK ("quantity" > 0) NOT VALID;

ALTER TABLE "maintenances"
  ADD CONSTRAINT "maintenances_quantity_positive" CHECK ("quantity" > 0) NOT VALID;
