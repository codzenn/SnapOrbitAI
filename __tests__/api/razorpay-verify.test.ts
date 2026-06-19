import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/razorpay", () => ({
  fetchRazorpaySubscription: vi.fn(),
  getRazorpayPlan: vi.fn(),
  getSubscriptionPeriodEnd: vi.fn(),
  verifyRazorpaySubscriptionSignature: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  fetchRazorpaySubscription,
  getRazorpayPlan,
  getSubscriptionPeriodEnd,
  verifyRazorpaySubscriptionSignature,
  type RazorpayPlanConfig,
} from "@/lib/razorpay";
import { POST } from "@/app/api/razorpay/verify/route";

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

const subscriptionRecord = {
  userId: "user_123",
  razorpaySubscriptionId: "sub_123",
  plan: "pro",
  billingCycle: "monthly",
};

function verifyRequest() {
  return new Request("http://localhost/api/razorpay/verify", {
    method: "POST",
    body: JSON.stringify({
      razorpay_subscription_id: "sub_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "sig_123",
    }),
  });
}

describe("POST /api/razorpay/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSubscriptionPeriodEnd).mockReturnValue(
      new Date("2026-07-12T00:00:00.000Z"),
    );
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(verifyRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when the subscription was not created by the app", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

    const response = await POST(verifyRequest());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Subscription not found.",
    });
  });

  it("returns 403 when the subscription belongs to another user", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_999" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(subscriptionRecord as never);

    const response = await POST(verifyRequest());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("rejects an invalid Razorpay signature", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(subscriptionRecord as never);
    vi.mocked(verifyRazorpaySubscriptionSignature).mockReturnValue(false);

    const response = await POST(verifyRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid Razorpay signature.",
    });
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { razorpaySubscriptionId: "sub_123" },
      data: {
        status: "signature_failed",
        razorpayPaymentId: "pay_123",
      },
    });
  });

  it("activates the plan after a verified subscription payment", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(subscriptionRecord as never);
    vi.mocked(verifyRazorpaySubscriptionSignature).mockReturnValue(true);
    vi.mocked(fetchRazorpaySubscription).mockResolvedValue({
      id: "sub_123",
      entity: "subscription",
      plan_id: "plan_pro_monthly",
      customer_id: "cust_123",
      status: "authenticated",
      current_end: 1_782_950_400,
    });
    vi.mocked(getRazorpayPlan).mockReturnValue(proMonthlyConfig);

    const response = await POST(verifyRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      plan: "pro",
      status: "authenticated",
      currentPeriodEnd: "2026-07-12T00:00:00.000Z",
    });
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { razorpaySubscriptionId: "sub_123" },
      data: {
        razorpayPaymentId: "pay_123",
        razorpayCustomerId: "cust_123",
        status: "authenticated",
        currentPeriodEnd: new Date("2026-07-12T00:00:00.000Z"),
      },
    });
  });
});
