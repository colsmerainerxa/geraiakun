-- CreateEnum
CREATE TYPE "AccountTokenPurpose" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "AuthSecurityAction" AS ENUM ('LOGIN', 'REGISTER', 'PASSWORD_RESET', 'VERIFICATION_RESEND');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CustomerProfile"
ADD COLUMN "notifyOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyPromos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyTicketReplies" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyNewsletter" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AccountToken" (
    "id" TEXT NOT NULL,
    "purpose" "AccountTokenPurpose" NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSecurityEvent" (
    "id" TEXT NOT NULL,
    "action" "AuthSecurityAction" NOT NULL,
    "identityHash" TEXT NOT NULL,
    "ipHash" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountToken_email_purpose_createdAt_idx" ON "AccountToken"("email", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "AccountToken_expiresAt_idx" ON "AccountToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthSecurityEvent_action_identityHash_createdAt_idx" ON "AuthSecurityEvent"("action", "identityHash", "createdAt");

-- CreateIndex
CREATE INDEX "AuthSecurityEvent_action_ipHash_createdAt_idx" ON "AuthSecurityEvent"("action", "ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "AuthSecurityEvent_createdAt_idx" ON "AuthSecurityEvent"("createdAt");
