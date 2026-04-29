import Razorpay from "razorpay";

declare global {
  // eslint-disable-next-line no-var
  var __razorpay__: Razorpay | undefined;
}

function getRazorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("Missing RAZORPAY_KEY_ID environment variable.");
  }
  return keyId;
}

function getRazorpayKeySecret() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("Missing RAZORPAY_KEY_SECRET environment variable.");
  }
  return keySecret;
}

export function getRazorpayPublicConfig() {
  return { keyId: getRazorpayKeyId() };
}

export function getRazorpayClient() {
  if (!global.__razorpay__) {
    global.__razorpay__ = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
  }
  return global.__razorpay__;
}
