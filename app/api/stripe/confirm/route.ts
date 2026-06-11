import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

function getPeriodEndDate(subscription: unknown) {
  const currentPeriodEnd = (
    subscription as { current_period_end?: number | null }
  ).current_period_end ?? null;

  return currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : new Date();
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 },
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionUserId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    const customerId =
      typeof session.customer === "string" ? session.customer : null;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;

    if (sessionUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!plan || !customerId || !subscriptionId) {
      return NextResponse.json(
        { error: "Stripe session is missing subscription metadata." },
        { status: 400 },
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: subscription.status,
        currentPeriodEnd: getPeriodEndDate(subscription),
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: subscription.status,
        currentPeriodEnd: getPeriodEndDate(subscription),
      },
    });

    return NextResponse.json({
      plan,
      status: subscription.status,
    });
  } catch (error) {
    console.error("[StripeConfirm] error:", error);
    return NextResponse.json(
      { error: "Could not confirm the Stripe checkout session." },
      { status: 500 },
    );
  }
}
