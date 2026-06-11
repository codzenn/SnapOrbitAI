-- CreateTable
CREATE TABLE "PaymentAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "razorpayPaymentId" TEXT,
    "razorpayOrderId" TEXT,
    "razorpaySubscriptionId" TEXT,
    "razorpayCustomerId" TEXT,
    "event" TEXT NOT NULL,
    "plan" TEXT,
    "status" TEXT NOT NULL,
    "amount" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAuditLog_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Video"
ADD COLUMN     "aiCaptions" JSONB,
ADD COLUMN     "aiDescription" TEXT,
ADD COLUMN     "embedding" TEXT,
ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'video',
ADD COLUMN     "qualityScore" INTEGER,
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'legacy-user',
ADD COLUMN     "viralityScore" INTEGER;

-- Match the live schema after backfilling existing rows.
ALTER TABLE "Video" ALTER COLUMN "userId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Video_userId_createdAt_idx" ON "Video"("userId", "createdAt");
