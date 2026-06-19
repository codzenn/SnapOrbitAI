import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/razorpay", () => ({
  findPlanByRazorpayPlanId: vi.fn(),
  getRazorpayPlan: vi.fn(),
  getSubscriptionPeriodEnd: vi.fn(),
  verifyRazorpayWebhookSignature: vi.fn(),
}));

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  findPlanByRazorpayPlanId,
  getRazorpayPlan,
  getSubscriptionPeriodEnd,
  verifyRazorpayWebhookSignature,
  type RazorpayPlanConfig,
} from "@/lib/razorpay";
import { POST } from "@/app/api/razorpay/webhook/route";

const proMonthlyConfig: RazorpayPlanConfig = {
  plan: "pro",
  cycle: "monthly",
  name: "Pro Monthly",
  description: "SnapOrbitAI Pro plan - monthly subscription",
  amount: 29900,
  currency: "INR",
  periodMonths: 1,
  totalCount: 120,
  envKey: "RAZORPAY_PRO_MONTHLY_PLAN_ID",
};

function webhookRequest(event = "subscription.charged") {
  return new Request("http://localhost/api/razorpay/webhook", {
    method: "POST",
    body: JSON.stringify({
      event,
      payload: {
        subscription: {
          entity: {
            id: "sub_123",
            entity: "subscription",
            plan_id: "plan_pro_monthly",
            customer_id: "cust_123",
            status: event === "subscription.cancelled" ? "cancelled" : "active",
            current_end: 1_782_950_400,
            notes: {
              userId: "user_123",
              plan: "pro",
              cycle: "monthly",
            },
          },
        },
        payment: {
          entity: {
            id: "pay_123",
            subscription_id: "sub_123",
            amount: 29900,
            currency: "INR",
            status: "captured",
          },
        },
      },
    }),
  });
}

describe("POST /api/razorpay/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSubscriptionPeriodEnd).mockReturnValue(
      new Date("2026-07-12T00:00:00.000Z"),
    );
  });

  it("returns 400 when the Razorpay signature is missing", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers());

    const response = await POST(webhookRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing signature.",
    });
  });

  it("returns 400 for an invalid signature", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "x-razorpay-signature": "sig_bad" }),
    );
    vi.mocked(verifyRazorpayWebhookSignature).mockReturnValue(false);

    const response = await POST(webhookRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature.",
    });
  });

  it("activates a subscription when Razorpay reports a charged subscription", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "x-razorpay-signature": "sig_good" }),
    );
    vi.mocked(verifyRazorpayWebhookSignature).mockReturnValue(true);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
    vi.mocked(findPlanByRazorpayPlanId).mockReturnValue(proMonthlyConfig);

    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(prisma.subscription.upsert).toHaveBeenCalledWith({
      where: { userId: "user_123" },
      create: expect.objectContaining({
        userId: "user_123",
        provider: "razorpay",
        razorpayPlanId: "plan_pro_monthly",
        razorpaySubscriptionId: "sub_123",
        razorpayCustomerId: "cust_123",
        razorpayPaymentId: "pay_123",
        plan: "pro",
        billingCycle: "monthly",
        amount: 29900,
        currency: "INR",
        status: "active",
      }),
      update: expect.objectContaining({
        provider: "razorpay",
        razorpayPlanId: "plan_pro_monthly",
        razorpaySubscriptionId: "sub_123",
        razorpayCustomerId: "cust_123",
        razorpayPaymentId: "pay_123",
        plan: "pro",
        billingCycle: "monthly",
        amount: 29900,
        currency: "INR",
        status: "active",
      }),
    });
  });

  it("marks a subscription inactive when Razorpay reports cancellation", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "x-razorpay-signature": "sig_good" }),
    );
    vi.mocked(verifyRazorpayWebhookSignature).mockReturnValue(true);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      userId: "user_123",
      plan: "pro",
      billingCycle: "monthly",
      razorpayPaymentId: "pay_old",
    } as never);
    vi.mocked(getRazorpayPlan).mockReturnValue(proMonthlyConfig);

    const response = await POST(webhookRequest("subscription.cancelled"));

    expect(response.status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: "cancelled",
        }),
      }),
    );
  });
});
