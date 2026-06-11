import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

const PRICE_MAP = {
  pro_monthly: {
    envKey: "STRIPE_PRO_MONTHLY_PRICE_ID",
    plan: "pro",
  },
  pro_yearly: {
    envKey: "STRIPE_PRO_YEARLY_PRICE_ID",
    plan: "pro",
  },
  business_monthly: {
    envKey: "STRIPE_BUSINESS_MONTHLY_PRICE_ID",
    plan: "business",
  },
  business_yearly: {
    envKey: "STRIPE_BUSINESS_YEARLY_PRICE_ID",
    plan: "business",
  },
} as const;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await request.json();
    const config = PRICE_MAP[priceId as keyof typeof PRICE_MAP];

    if (!config) {
      return NextResponse.json({ error: "Invalid price selected." }, { status: 400 });
    }

    const stripePriceId = process.env[config.envKey];
    if (!stripePriceId) {
      return NextResponse.json(
        { error: `Missing ${config.envKey} environment variable.` },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/home?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId,
        plan: config.plan,
      },
      subscription_data: {
        metadata: {
          userId,
          plan: config.plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[StripeCheckout] error:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe checkout session." },
      { status: 500 },
    );
  }
}
