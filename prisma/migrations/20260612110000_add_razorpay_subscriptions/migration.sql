-- Add Razorpay subscription identifiers for recurring billing.
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "razorpayPlanId" TEXT,
  ADD COLUMN IF NOT EXISTS "razorpaySubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "razorpayCustomerId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_razorpaySubscriptionId_key"
  ON "Subscription"("razorpaySubscriptionId");
