import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  fetchRazorpaySubscription,
  getRazorpayPlan,
  getSubscriptionPeriodEnd,
  verifyRazorpaySubscriptionSignature,
} from "@/lib/razorpay";

export const runtime = "nodejs";

type VerifyPayload = {
  razorpay_subscription_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeVerifiedStatus(status: string) {
  if (status === "created") {
    return "active";
  }

  return status;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as VerifyPayload;
    const subscriptionId = getString(payload.razorpay_subscription_id);
    const paymentId = getString(payload.razorpay_payment_id);
    const signature = getString(payload.razorpay_signature);

    if (!subscriptionId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing Razorpay subscription payment details." },
        { status: 400 },
      );
    }

    const existingSubscription = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionId },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 },
      );
    }

    if (existingSubscription.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isAuthentic = verifyRazorpaySubscriptionSignature({
      subscriptionId,
      paymentId,
      signature,
    });

    if (!isAuthentic) {
      await prisma.subscription.update({
        where: { razorpaySubscriptionId: subscriptionId },
        data: {
          status: "signature_failed",
          razorpayPaymentId: paymentId,
        },
      });

      return NextResponse.json(
        { error: "Invalid Razorpay signature." },
        { status: 400 },
      );
    }

    const config = getRazorpayPlan(
      existingSubscription.plan,
      existingSubscription.billingCycle,
    );

    if (!config) {
      return NextResponse.json(
        { error: "Stored subscription plan is invalid." },
        { status: 400 },
      );
    }

    const razorpaySubscription =
      await fetchRazorpaySubscription(subscriptionId);
    const status = normalizeVerifiedStatus(razorpaySubscription.status);
    const currentPeriodEnd = getSubscriptionPeriodEnd(
      razorpaySubscription,
      config,
    );

    await prisma.subscription.update({
      where: { razorpaySubscriptionId: subscriptionId },
      data: {
        razorpayPaymentId: paymentId,
        razorpayCustomerId: razorpaySubscription.customer_id ?? null,
        status,
        currentPeriodEnd,
      },
    });

    return NextResponse.json({
      plan: config.plan,
      status,
      currentPeriodEnd,
    });
  } catch (error) {
    console.error("[RazorpayVerify] error:", error);
    return NextResponse.json(
      { error: "Could not verify Razorpay subscription payment." },
      { status: 500 },
    );
  }
}
