import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient, getRazorpayPublicConfig } from "@/lib/razorpay";

function getRazorpayPlanId(plan: "pro" | "pro_plus") {
  if (plan === "pro") {
    const planId = process.env.RAZORPAY_PRO_PLAN_ID;
    if (!planId) throw new Error("Missing RAZORPAY_PRO_PLAN_ID environment variable.");
    return planId;
  }

  const planId = process.env.RAZORPAY_PRO_PLUS_PLAN_ID;
  if (!planId) throw new Error("Missing RAZORPAY_PRO_PLUS_PLAN_ID environment variable.");
  return planId;
}

function getAppUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  );
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetPlan = body.plan as "pro" | "pro_plus";
    const coupon = typeof body.coupon === "string" ? body.coupon.trim() : undefined;

    if (!targetPlan || (targetPlan !== "pro" && targetPlan !== "pro_plus")) {
      return NextResponse.json(
        { error: "Invalid plan specified" },
        { status: 400 },
      );
    }

    const currentPlan = await getUserPlan(userId);

    if (currentPlan === targetPlan) {
      return NextResponse.json(
        { error: `User already has an active ${targetPlan} plan.` },
        { status: 400 },
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress;
    const planId = getRazorpayPlanId(targetPlan);

    const offerId =
      coupon && coupon.length > 0
        ? process.env[`RAZORPAY_OFFER_ID_${coupon.toUpperCase()}` as const]
        : undefined;

    const subscription = await getRazorpayClient().subscriptions.create({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId,
        plan: targetPlan,
        coupon: coupon || "",
      },
      ...(offerId ? { offer_id: offerId } : {}),
    });

    // Audit logging
    await prisma.paymentAuditLog.create({
      data: {
        userId,
        provider: "razorpay",
        razorpaySubscriptionId: subscription.id,
        event: "razorpay_subscription_created",
        plan: targetPlan,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        keyId: getRazorpayPublicConfig().keyId,
        subscriptionId: subscription.id,
        email,
        name: user.fullName || user.username || undefined,
        offerId: offerId || null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Checkout session creation error:", error);
    
    // Log failure
    try {
      const { userId } = await auth();
      if (userId) {
        await prisma.paymentAuditLog.create({
          data: {
            userId,
            provider: "razorpay",
            event: "razorpay_subscription_create_failed",
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    } catch (auditError) {
      console.error("Failed to write audit log:", auditError);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session.",
      },
      { status: 500 },
    );
  }
}
