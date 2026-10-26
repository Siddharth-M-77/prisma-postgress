-- AlterTable
ALTER TABLE "ReferralBonus" ADD COLUMN     "baseAmount" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "investmentId" UUID NOT NULL,
ADD COLUMN     "percent" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "receivedFromId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralWallet" DECIMAL(18,4) NOT NULL DEFAULT 0.0;

-- CreateIndex
CREATE UNIQUE INDEX "ReferralBonus_investmentId_key" ON "ReferralBonus"("investmentId");

-- CreateIndex
CREATE INDEX "ReferralBonus_receivedFromId_idx" ON "ReferralBonus"("receivedFromId");

-- AddForeignKey
ALTER TABLE "ReferralBonus" ADD CONSTRAINT "ReferralBonus_receivedFromId_fkey" FOREIGN KEY ("receivedFromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralBonus" ADD CONSTRAINT "ReferralBonus_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

