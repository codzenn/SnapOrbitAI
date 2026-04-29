import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const plan = body.plan as "pro" | "pro_plus";
    const paymentId = body.razorpay_payment_id as string;
    const subscriptionId = body.razorpay_subscription_id as string;
    const signature = body.razorpay_signature as string;

    if (!plan || (plan !== "pro" && plan !== "pro_plus")) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!paymentId || !subscriptionId || !signature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    if (!timingSafeEqual(expected, signature)) {
      await prisma.paymentAuditLog.create({
        data: {
          userId,
          provider: "razorpay",
          razorpayPaymentId: paymentId,
          razorpaySubscriptionId: subscriptionId,
          event: "razorpay_payment_verify_failed",
          plan,
          status: "failed",
          errorMessage: "Signature verification failed",
        },
      });

      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const client = await clerkClient();

    let customerId: string | undefined;
    try {
      const sub = await getRazorpayClient().subscriptions.fetch(subscriptionId);
      if (sub && typeof (sub as any).customer_id === "string") {
        customerId = (sub as any).customer_id;
      }
    } catch {
      // ignore
    }

    await client.users.updateUser(userId, {
      publicMetadata: {
        plan,
      },
      privateMetadata: {
        razorpayCustomerId: customerId,
        razorpaySubscriptionId: subscriptionId,
      },
    });

    await prisma.paymentAuditLog.create({
      data: {
        userId,
        provider: "razorpay",
        razorpayPaymentId: paymentId,
        razorpaySubscriptionId: subscriptionId,
        razorpayCustomerId: customerId,
        event: "razorpay_payment_verified",
        plan,
        status: "completed",
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 },
    );
  }
}
