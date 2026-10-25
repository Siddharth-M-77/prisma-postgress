-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "mainWallet" DECIMAL(18,4) NOT NULL DEFAULT 0.0,
    "roiWallet" DECIMAL(18,4) NOT NULL DEFAULT 0.0,
    "levelWallet" DECIMAL(18,4) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralBonus" (
    "id" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "userId" UUID NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelIncome" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "receivedFromId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roi" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankReward" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LevelIncome_userId_idx" ON "LevelIncome"("userId");

-- CreateIndex
CREATE INDEX "LevelIncome_receivedFromId_idx" ON "LevelIncome"("receivedFromId");

-- AddForeignKey
ALTER TABLE "ReferralBonus" ADD CONSTRAINT "ReferralBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelIncome" ADD CONSTRAINT "LevelIncome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelIncome" ADD CONSTRAINT "LevelIncome_receivedFromId_fkey" FOREIGN KEY ("receivedFromId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roi" ADD CONSTRAINT "Roi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankReward" ADD CONSTRAINT "RankReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
