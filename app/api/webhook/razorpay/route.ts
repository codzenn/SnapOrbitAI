import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function verifyWebhookSignature(payload: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const sigBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing RAZORPAY_WEBHOOK_SECRET" }, { status: 500 });
  }

  const signature = req.headers.get("x-razorpay-signature") || "";
  const bodyText = await req.text();

  if (!signature || !verifyWebhookSignature(bodyText, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(bodyText) as any;
  const eventType = event?.event as string;

  const entity = event?.payload?.subscription?.entity || event?.payload?.payment?.entity;
  const notes = entity?.notes || {};
  const userId = notes.userId as string | undefined;
  const plan = notes.plan as string | undefined;

  try {
    if (userId) {
      await prisma.paymentAuditLog.create({
        data: {
          userId,
          provider: "razorpay",
          razorpaySubscriptionId: entity?.id,
          event: eventType || "razorpay_webhook",
          plan: typeof plan === "string" ? plan : undefined,
          status: "received",
        },
      });
    }

    if (eventType === "subscription.activated" && userId && (plan === "pro" || plan === "pro_plus")) {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan,
        },
        privateMetadata: {
          razorpaySubscriptionId: entity?.id,
          razorpayCustomerId: entity?.customer_id,
        },
      });

      await prisma.paymentAuditLog.create({
        data: {
          userId,
          provider: "razorpay",
          razorpaySubscriptionId: entity?.id,
          razorpayCustomerId: entity?.customer_id,
          event: "subscription.activated",
          plan,
          status: "completed",
        },
      });
    }

    if (eventType === "subscription.cancelled" && userId) {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          plan: "free",
        },
      });

      await prisma.paymentAuditLog.create({
        data: {
          userId,
          provider: "razorpay",
          razorpaySubscriptionId: entity?.id,
          event: "subscription.cancelled",
          plan: "free",
          status: "updated",
        },
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

