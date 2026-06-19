import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createRazorpaySubscription,
  formatInr,
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

    const { keyId, subscription } =
      await createRazorpaySubscription({
        userId,
        config,
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
