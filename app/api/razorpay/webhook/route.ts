import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findPlanByRazorpayPlanId,
  getRazorpayPlan,
  getSubscriptionPeriodEnd,
  type RazorpayPayment,
  type RazorpaySubscription,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay";

export const runtime = "nodejs";

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscription;
    };
    payment?: {
      entity?: RazorpayPayment;
    };
  };
};

const ACTIVE_SUBSCRIPTION_EVENTS = new Set([
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.resumed",
]);

const INACTIVE_SUBSCRIPTION_EVENTS = new Set([
  "subscription.cancelled",
  "subscription.completed",
  "subscription.halted",
  "subscription.paused",
  "subscription.pending",
]);

async function syncSubscription(
  subscription: RazorpaySubscription,
  payment: RazorpayPayment | undefined,
  fallbackStatus?: string,
  allowCreate = false,
) {
  const existing = await prisma.subscription.findUnique({
    where: { razorpaySubscriptionId: subscription.id },
  });

  if (!existing && !allowCreate) {
    return;
  }

  const config =
    existing
      ? getRazorpayPlan(existing.plan, existing.billingCycle)
      : findPlanByRazorpayPlanId(subscription.plan_id);

  if (!config) {
    return;
  }

  const userId = existing?.userId || subscription.notes?.userId;

  if (!userId) {
    return;
  }

  const status = fallbackStatus || subscription.status;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      provider: "razorpay",
      razorpayPlanId: subscription.plan_id,
      razorpaySubscriptionId: subscription.id,
      razorpayCustomerId: subscription.customer_id ?? null,
      razorpayPaymentId: payment?.id ?? null,
      plan: config.plan,
      billingCycle: config.cycle,
      amount: config.amount,
      currency: config.currency,
      status,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription, config),
    },
    update: {
      provider: "razorpay",
      razorpayPlanId: subscription.plan_id,
      razorpaySubscriptionId: subscription.id,
      razorpayCustomerId: subscription.customer_id ?? null,
      razorpayPaymentId: payment?.id ?? existing?.razorpayPaymentId ?? null,
      plan: config.plan,
      billingCycle: config.cycle,
      amount: config.amount,
      currency: config.currency,
      status,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription, config),
    },
  });
}

export async function POST(request: Request) {
  const signature = (await headers()).get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const isAuthentic = verifyRazorpayWebhookSignature({
      payload,
      signature,
    });

    if (!isAuthentic) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }
  } catch (error) {
    console.error("[RazorpayWebhook] signature error:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 },
    );
  }

  try {
    const event = JSON.parse(payload) as RazorpayWebhookEvent;
    const subscription = event.payload?.subscription?.entity;
    const payment = event.payload?.payment?.entity;

    if (subscription && ACTIVE_SUBSCRIPTION_EVENTS.has(event.event || "")) {
      await syncSubscription(subscription, payment, undefined, true);
    }

    if (subscription && INACTIVE_SUBSCRIPTION_EVENTS.has(event.event || "")) {
      await syncSubscription(subscription, payment, subscription.status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[RazorpayWebhook] handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }
}
