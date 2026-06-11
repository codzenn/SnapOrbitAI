import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

function getPeriodEndDate(subscription: unknown) {
  const currentPeriodEnd = (
    subscription as { current_period_end?: number | null }
  ).current_period_end ?? null;
  return currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000)
    : new Date();
}

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe webhook configuration." },
      { status: 400 },
    );
  }

  const payload = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[StripeWebhook] signature error:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!userId || !plan || !customerId || !subscriptionId) {
          break;
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

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const isDeletedEvent = event.type === "customer.subscription.deleted";

        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            plan: isDeletedEvent ? "free" : undefined,
            status: isDeletedEvent ? "canceled" : subscription.status,
            currentPeriodEnd: getPeriodEndDate(subscription),
          },
        });

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[StripeWebhook] handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }
}
