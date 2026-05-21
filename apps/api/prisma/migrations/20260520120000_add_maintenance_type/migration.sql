-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('REPARO', 'LIMPEZA', 'PINTURA', 'COSTURA', 'ELETRICA', 'OUTRA');

-- AlterTable: add type to maintenances; default OUTRA backfilla manutenções existentes
ALTER TABLE "maintenances" ADD COLUMN "type" "MaintenanceType" NOT NULL DEFAULT 'OUTRA';
