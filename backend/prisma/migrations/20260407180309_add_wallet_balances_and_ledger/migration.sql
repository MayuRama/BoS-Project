-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN     "eDahabBalanceUSD" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "zaadBalanceUSD" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OMOBid" ADD COLUMN     "walletChoice" "WalletType";

-- CreateTable
CREATE TABLE "WalletLedger" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "walletType" "WalletType" NOT NULL,
    "entryType" TEXT NOT NULL,
    "amountUSD" DECIMAL(15,2) NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "balanceAfter" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletLedger_dealerId_idx" ON "WalletLedger"("dealerId");

-- CreateIndex
CREATE INDEX "WalletLedger_createdAt_idx" ON "WalletLedger"("createdAt");

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
