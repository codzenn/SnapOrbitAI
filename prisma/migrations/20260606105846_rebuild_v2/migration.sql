/*
  Warnings:

  - You are about to drop the column `viralityScore` on the `Video` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicId]` on the table `Video` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Video_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "viralityScore",
ALTER COLUMN "mediaType" SET DEFAULT 'image';

-- CreateTable
CREATE TABLE "TrialUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialUsage_userId_feature_key" ON "TrialUsage"("userId", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_publicId_key" ON "Video"("publicId");

-- CreateIndex
CREATE INDEX "Video_userId_createdAt_idx" ON "Video"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Video_userId_mediaType_idx" ON "Video"("userId", "mediaType");
