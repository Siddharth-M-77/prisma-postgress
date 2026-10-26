-- AlterTable
ALTER TABLE "LevelIncome" ADD COLUMN     "level" INTEGER NOT NULL,
ADD COLUMN     "roiId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Roi" ADD COLUMN     "levelIncomeDone" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "sponsorId" UUID;

-- Purane users ko referral code do, phir NOT NULL lagao
UPDATE "User" SET "referralCode" = upper(substr(md5(random()::text || id::text), 1, 8));
ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LevelIncome_roiId_level_key" ON "LevelIncome"("roiId", "level");

-- CreateIndex
CREATE INDEX "Roi_levelIncomeDone_idx" ON "Roi"("levelIncomeDone");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_sponsorId_idx" ON "User"("sponsorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelIncome" ADD CONSTRAINT "LevelIncome_roiId_fkey" FOREIGN KEY ("roiId") REFERENCES "Roi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

