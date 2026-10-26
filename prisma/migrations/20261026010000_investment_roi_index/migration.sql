-- DropIndex
DROP INDEX "Investment_status_idx";

-- CreateIndex
CREATE INDEX "Investment_status_lastRoiAt_idx" ON "Investment"("status", "lastRoiAt");

