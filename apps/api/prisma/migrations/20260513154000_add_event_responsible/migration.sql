ALTER TABLE "events"
ADD COLUMN "responsibleId" TEXT;

CREATE INDEX "events_responsibleId_idx" ON "events"("responsibleId");

ALTER TABLE "events"
ADD CONSTRAINT "events_responsibleId_fkey"
FOREIGN KEY ("responsibleId") REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
