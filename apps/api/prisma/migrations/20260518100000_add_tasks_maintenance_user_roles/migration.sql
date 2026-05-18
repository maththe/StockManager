-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DECORADOR', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- AlterTable: add role to users
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'FUNCIONARIO';

-- AlterTable: add resolution fields to divergences
ALTER TABLE "divergences" ADD COLUMN "resolvedById" TEXT,
                          ADD COLUMN "resolvedAt" TIMESTAMP(3);

-- AddForeignKey: divergences.resolvedById → users
ALTER TABLE "divergences" ADD CONSTRAINT "divergences_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: tasks
CREATE TABLE "tasks" (
  "id"           TEXT NOT NULL,
  "code"         TEXT NOT NULL,
  "status"       "TaskStatus" NOT NULL DEFAULT 'PENDENTE',
  "notes"        TEXT,
  "tenantUuid"   TEXT NOT NULL,
  "completedAt"  TIMESTAMP(3),
  "eventId"      TEXT NOT NULL,
  "assignedToId" TEXT,
  "createdById"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tasks_tenantUuid_code_key" ON "tasks"("tenantUuid", "code");
CREATE INDEX "tasks_tenantUuid_idx" ON "tasks"("tenantUuid");
CREATE INDEX "tasks_eventId_idx" ON "tasks"("eventId");

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: task_items
CREATE TABLE "task_items" (
  "id"                TEXT NOT NULL,
  "confirmedQuantity" INTEGER NOT NULL DEFAULT 0,
  "confirmed"         BOOLEAN NOT NULL DEFAULT false,
  "notes"             TEXT,
  "tenantUuid"        TEXT NOT NULL,
  "taskId"            TEXT NOT NULL,
  "eventItemId"       TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "task_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "task_items_taskId_idx" ON "task_items"("taskId");
CREATE INDEX "task_items_eventItemId_idx" ON "task_items"("eventItemId");

ALTER TABLE "task_items" ADD CONSTRAINT "task_items_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_items" ADD CONSTRAINT "task_items_eventItemId_fkey"
  FOREIGN KEY ("eventItemId") REFERENCES "event_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: maintenances
CREATE TABLE "maintenances" (
  "id"           TEXT NOT NULL,
  "code"         TEXT NOT NULL,
  "status"       "MaintenanceStatus" NOT NULL DEFAULT 'PENDENTE',
  "quantity"     INTEGER NOT NULL,
  "notes"        TEXT,
  "tenantUuid"   TEXT NOT NULL,
  "completedAt"  TIMESTAMP(3),
  "itemId"       TEXT NOT NULL,
  "divergenceId" TEXT,
  "assignedToId" TEXT,
  "createdById"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "maintenances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "maintenances_tenantUuid_code_key" ON "maintenances"("tenantUuid", "code");
CREATE INDEX "maintenances_tenantUuid_idx" ON "maintenances"("tenantUuid");
CREATE INDEX "maintenances_itemId_idx" ON "maintenances"("itemId");

ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_divergenceId_fkey"
  FOREIGN KEY ("divergenceId") REFERENCES "divergences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
