import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/analytics`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[StripePortal] error:", error);
    return NextResponse.json(
      { error: "Could not create a customer portal session." },
      { status: 500 },
    );
  }
}
