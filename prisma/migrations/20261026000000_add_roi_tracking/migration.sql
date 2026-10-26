-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "dailyRoiPercent" DECIMAL(5,2) NOT NULL DEFAULT 1,
ADD COLUMN     "daysPaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastRoiAt" TIMESTAMP(3),
ADD COLUMN     "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "totalDays" INTEGER NOT NULL DEFAULT 180;

-- AlterTable
ALTER TABLE "ReferralBonus" DROP COLUMN "createAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Roi" ADD COLUMN     "day" INTEGER NOT NULL,
ADD COLUMN     "investmentId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Investment_userId_idx" ON "Investment"("userId");

-- CreateIndex
CREATE INDEX "Investment_status_idx" ON "Investment"("status");

-- CreateIndex
CREATE INDEX "RankReward_userId_idx" ON "RankReward"("userId");

-- CreateIndex
CREATE INDEX "ReferralBonus_userId_idx" ON "ReferralBonus"("userId");

-- CreateIndex
CREATE INDEX "Roi_userId_idx" ON "Roi"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Roi_investmentId_day_key" ON "Roi"("investmentId", "day");

-- CreateIndex
CREATE INDEX "Withdrawal_userId_idx" ON "Withdrawal"("userId");

-- AddForeignKey
ALTER TABLE "Roi" ADD CONSTRAINT "Roi_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

