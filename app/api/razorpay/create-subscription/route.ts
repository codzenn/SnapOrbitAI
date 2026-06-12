import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  createRazorpaySubscription,
  formatInr,
  getPeriodEndDate,
  getRazorpayPlan,
} from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, cycle } = await request.json();
    const config = getRazorpayPlan(plan, cycle);

    if (!config) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 },
      );
    }

    const { keyId, planId, subscription } =
      await createRazorpaySubscription({
        userId,
        config,
      });

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        provider: "razorpay",
        razorpayPlanId: planId,
        razorpaySubscriptionId: subscription.id,
        razorpayCustomerId: subscription.customer_id ?? null,
        plan: config.plan,
        billingCycle: config.cycle,
        amount: config.amount,
        currency: config.currency,
        status: subscription.status,
        currentPeriodEnd: getPeriodEndDate(config),
      },
      update: {
        provider: "razorpay",
        razorpayPlanId: planId,
        razorpaySubscriptionId: subscription.id,
        razorpayCustomerId: subscription.customer_id ?? null,
        plan: config.plan,
        billingCycle: config.cycle,
        amount: config.amount,
        currency: config.currency,
        status: subscription.status,
        currentPeriodEnd: getPeriodEndDate(config),
      },
    });

    return NextResponse.json({
      keyId,
      subscriptionId: subscription.id,
      amount: config.amount,
      displayAmount: formatInr(config.amount),
      currency: config.currency,
      plan: config.plan,
      cycle: config.cycle,
      name: config.name,
      description: config.description,
    });
  } catch (error) {
    console.error("[RazorpayCreateSubscription] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Razorpay subscription.",
      },
      { status: 500 },
    );
  }
}
