-- Drop the legacy one-time order audit table now that billing uses Razorpay Subscriptions.
DROP TABLE IF EXISTS "PaymentOrder";
