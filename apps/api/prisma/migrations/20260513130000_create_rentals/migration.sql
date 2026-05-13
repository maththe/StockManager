CREATE TYPE "RentalStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETURNED', 'CANCELLED');

CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "rentalCode" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedReturn" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "status" "RentalStatus" NOT NULL DEFAULT 'DRAFT',
    "tenantUuid" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rental_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "tenantUuid" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rentals_tenantUuid_rentalCode_key" ON "rentals"("tenantUuid", "rentalCode");
CREATE INDEX "rentals_clientId_idx" ON "rentals"("clientId");
CREATE INDEX "rentals_tenantUuid_idx" ON "rentals"("tenantUuid");
CREATE UNIQUE INDEX "rental_items_rentalId_itemId_key" ON "rental_items"("rentalId", "itemId");
CREATE INDEX "rental_items_rentalId_idx" ON "rental_items"("rentalId");
CREATE INDEX "rental_items_itemId_idx" ON "rental_items"("itemId");
CREATE INDEX "rental_items_tenantUuid_idx" ON "rental_items"("tenantUuid");

ALTER TABLE "rentals" ADD CONSTRAINT "rentals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_items" ADD CONSTRAINT "rental_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
