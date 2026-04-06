-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CBSuperAdmin', 'FXInterventionDesk', 'Supervisor', 'Auditor', 'DealerAdmin', 'DealerOperator');

-- CreateEnum
CREATE TYPE "DealerTier" AS ENUM ('Tier1', 'Tier2');

-- CreateEnum
CREATE TYPE "DealerStatus" AS ENUM ('Active', 'Suspended', 'Pending');

-- CreateEnum
CREATE TYPE "WalletProvider" AS ENUM ('Zaad', 'eDahab', 'Both');

-- CreateEnum
CREATE TYPE "TelcoOperator" AS ENUM ('Telesom', 'Somtel', 'Soltelco');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('Zaad', 'eDahab');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BuyUSD', 'SellUSD');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Completed', 'Pending', 'Failed', 'Cancelled');

-- CreateEnum
CREATE TYPE "OMOSessionType" AS ENUM ('Injection', 'Absorption');

-- CreateEnum
CREATE TYPE "OMOSessionStatus" AS ENUM ('Open', 'PendingAllocation', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "AllocationMethod" AS ENUM ('EqualDistribution', 'BestBidPriceWins');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('Submitted', 'Allocated', 'Partial', 'Rejected');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('Pending', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('ThresholdExceeded', 'UnusualFrequency', 'StructuringPattern', 'VelocityCheck');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('New', 'UnderReview', 'Resolved');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('OMO', 'Transaction', 'System', 'Rate', 'Settlement');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dealerId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "tier" "DealerTier" NOT NULL,
    "buyRate" DECIMAL(10,2) NOT NULL,
    "sellRate" DECIMAL(10,2) NOT NULL,
    "dailyLimit" DECIMAL(15,2) NOT NULL,
    "status" "DealerStatus" NOT NULL DEFAULT 'Active',
    "walletProvider" "WalletProvider" NOT NULL,
    "zaadWallet" TEXT,
    "eDahabWallet" TEXT,
    "registeredDate" TIMESTAMP(3) NOT NULL,
    "volume30d" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "txCount30d" INTEGER NOT NULL DEFAULT 0,
    "complianceScore" INTEGER NOT NULL DEFAULT 100,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OMOSession" (
    "id" TEXT NOT NULL,
    "type" "OMOSessionType" NOT NULL,
    "fixedRate" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "OMOSessionStatus" NOT NULL DEFAULT 'Open',
    "allocationMethod" "AllocationMethod" NOT NULL,
    "maxBidTier1" DECIMAL(15,2) NOT NULL,
    "maxBidTier2" DECIMAL(15,2) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OMOSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OMOBid" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "tier" "DealerTier" NOT NULL,
    "bidAmount" DECIMAL(15,2) NOT NULL,
    "allocatedAmount" DECIMAL(15,2),
    "status" "BidStatus" NOT NULL DEFAULT 'Submitted',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OMOBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "bidAmount" DECIMAL(15,2) NOT NULL,
    "allocatedAmount" DECIMAL(15,2) NOT NULL,
    "fixedRate" DECIMAL(10,2) NOT NULL,
    "slSettlement" DECIMAL(20,2) NOT NULL,
    "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllocationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "refNumber" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "dealerId" TEXT NOT NULL,
    "customerWallet" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "telcoOperator" "TelcoOperator" NOT NULL,
    "walletType" "WalletType" NOT NULL,
    "amountUSD" DECIMAL(15,2) NOT NULL,
    "amountSL" DECIMAL(20,2) NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'Pending',
    "source" TEXT NOT NULL DEFAULT 'portal',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AMLAlert" (
    "id" TEXT NOT NULL,
    "alertCode" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "dealerId" TEXT NOT NULL,
    "customerWallet" TEXT,
    "mobileNumber" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "triggerRule" TEXT NOT NULL,
    "priority" "AlertPriority" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'New',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AMLAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AMLAlertTransaction" (
    "alertId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "AMLAlertTransaction_pkey" PRIMARY KEY ("alertId","transactionId")
);

-- CreateTable
CREATE TABLE "RateControl" (
    "id" TEXT NOT NULL,
    "buyFloor" DECIMAL(10,2) NOT NULL,
    "buyCeiling" DECIMAL(10,2) NOT NULL,
    "sellFloor" DECIMAL(10,2) NOT NULL,
    "sellCeiling" DECIMAL(10,2) NOT NULL,
    "maxSpreadPct" DECIMAL(5,2) NOT NULL,
    "marketRef" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateHistory" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "buyRate" DECIMAL(10,2) NOT NULL,
    "sellRate" DECIMAL(10,2) NOT NULL,
    "marketRef" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "dealerId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_dealerId_idx" ON "User"("dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_licenseNumber_key" ON "Dealer"("licenseNumber");

-- CreateIndex
CREATE INDEX "Dealer_status_idx" ON "Dealer"("status");

-- CreateIndex
CREATE INDEX "Dealer_tier_idx" ON "Dealer"("tier");

-- CreateIndex
CREATE INDEX "OMOSession_status_idx" ON "OMOSession"("status");

-- CreateIndex
CREATE INDEX "OMOSession_startTime_idx" ON "OMOSession"("startTime");

-- CreateIndex
CREATE INDEX "OMOBid_sessionId_idx" ON "OMOBid"("sessionId");

-- CreateIndex
CREATE INDEX "OMOBid_dealerId_idx" ON "OMOBid"("dealerId");

-- CreateIndex
CREATE UNIQUE INDEX "OMOBid_sessionId_dealerId_key" ON "OMOBid"("sessionId", "dealerId");

-- CreateIndex
CREATE INDEX "AllocationResult_dealerId_idx" ON "AllocationResult"("dealerId");

-- CreateIndex
CREATE INDEX "AllocationResult_sessionId_idx" ON "AllocationResult"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_refNumber_key" ON "Transaction"("refNumber");

-- CreateIndex
CREATE INDEX "Transaction_dealerId_idx" ON "Transaction"("dealerId");

-- CreateIndex
CREATE INDEX "Transaction_timestamp_idx" ON "Transaction"("timestamp");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_mobileNumber_idx" ON "Transaction"("mobileNumber");

-- CreateIndex
CREATE INDEX "Transaction_telcoOperator_idx" ON "Transaction"("telcoOperator");

-- CreateIndex
CREATE UNIQUE INDEX "AMLAlert_alertCode_key" ON "AMLAlert"("alertCode");

-- CreateIndex
CREATE INDEX "AMLAlert_status_idx" ON "AMLAlert"("status");

-- CreateIndex
CREATE INDEX "AMLAlert_priority_idx" ON "AMLAlert"("priority");

-- CreateIndex
CREATE INDEX "AMLAlert_dealerId_idx" ON "AMLAlert"("dealerId");

-- CreateIndex
CREATE INDEX "RateHistory_date_idx" ON "RateHistory"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RateHistory_date_key" ON "RateHistory"("date");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "Notification_dealerId_idx" ON "Notification"("dealerId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMOBid" ADD CONSTRAINT "OMOBid_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OMOSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OMOBid" ADD CONSTRAINT "OMOBid_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationResult" ADD CONSTRAINT "AllocationResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OMOSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationResult" ADD CONSTRAINT "AllocationResult_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AMLAlert" ADD CONSTRAINT "AMLAlert_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AMLAlertTransaction" ADD CONSTRAINT "AMLAlertTransaction_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "AMLAlert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AMLAlertTransaction" ADD CONSTRAINT "AMLAlertTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OMOSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
