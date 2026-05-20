-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('SAIDA_GALPAO', 'ENTRADA_GALPAO');

-- AlterTable: add type to tasks; default SAIDA_GALPAO backfilla tasks existentes
ALTER TABLE "tasks" ADD COLUMN "type" "TaskType" NOT NULL DEFAULT 'SAIDA_GALPAO';
