-- DropTable
DROP TABLE "divergences" CASCADE;

-- CreateEnum
CREATE TYPE "DivergenceSource" AS ENUM ('EVENT', 'RENTAL', 'MANUAL', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "divergences" (
    "id" TEXT NOT NULL,
    "source" "DivergenceSource" NOT NULL,
    "sourceId" TEXT,
    "status" "DivergenceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantUuid" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divergences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divergence_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "DivergenceType" NOT NULL,
    "notes" TEXT,
    "tenantUuid" TEXT NOT NULL,
    "divergenceId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sourceItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divergence_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "divergences_tenantUuid_source_idx" ON "divergences"("tenantUuid", "source");

-- CreateIndex
CREATE INDEX "divergences_source_sourceId_idx" ON "divergences"("source", "sourceId");

-- CreateIndex
CREATE INDEX "divergence_items_divergenceId_idx" ON "divergence_items"("divergenceId");

-- CreateIndex
CREATE INDEX "divergence_items_itemId_idx" ON "divergence_items"("itemId");

-- CreateIndex
CREATE INDEX "divergence_items_sourceItemId_idx" ON "divergence_items"("sourceItemId");

-- AddForeignKey
ALTER TABLE "divergences" ADD CONSTRAINT "divergences_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divergence_items" ADD CONSTRAINT "divergence_items_divergenceId_fkey" FOREIGN KEY ("divergenceId") REFERENCES "divergences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divergence_items" ADD CONSTRAINT "divergence_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
