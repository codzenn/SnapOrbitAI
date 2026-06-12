-- Replace Stripe-specific subscription columns with Razorpay payment metadata.
ALTER TABLE "Subscription"
  DROP COLUMN IF EXISTS "stripeCustomerId",
  DROP COLUMN IF EXISTS "stripeSubscriptionId",
  ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'razorpay',
  ADD COLUMN "razorpayOrderId" TEXT,
  ADD COLUMN "razorpayPaymentId" TEXT,
  ADD COLUMN "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN "amount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR';

CREATE UNIQUE INDEX "Subscription_razorpayOrderId_key"
  ON "Subscription"("razorpayOrderId");

CREATE UNIQUE INDEX "Subscription_razorpayPaymentId_key"
  ON "Subscription"("razorpayPaymentId");

CREATE TABLE "PaymentOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "razorpayOrderId" TEXT NOT NULL,
  "razorpayPaymentId" TEXT,
  "plan" TEXT NOT NULL,
  "billingCycle" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL DEFAULT 'created',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),

  CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentOrder_razorpayOrderId_key"
  ON "PaymentOrder"("razorpayOrderId");

CREATE UNIQUE INDEX "PaymentOrder_razorpayPaymentId_key"
  ON "PaymentOrder"("razorpayPaymentId");

CREATE INDEX "PaymentOrder_userId_createdAt_idx"
  ON "PaymentOrder"("userId", "createdAt" DESC);
