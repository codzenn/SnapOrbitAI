import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/razorpay", () => ({
  createRazorpaySubscription: vi.fn(),
  formatInr: vi.fn(),
  getRazorpayPlan: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  createRazorpaySubscription,
  formatInr,
  getRazorpayPlan,
  type RazorpayPlanConfig,
} from "@/lib/razorpay";
import { POST } from "@/app/api/razorpay/create-subscription/route";

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

describe("POST /api/razorpay/create-subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(formatInr).mockReturnValue("INR 299");
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/razorpay/create-subscription", {
        method: "POST",
        body: JSON.stringify({ plan: "pro", cycle: "monthly" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for an invalid plan", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getRazorpayPlan).mockReturnValue(null);

    const response = await POST(
      new Request("http://localhost/api/razorpay/create-subscription", {
        method: "POST",
        body: JSON.stringify({ plan: "enterprise", cycle: "monthly" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid plan selected.",
    });
  });

  it("creates a Razorpay subscription without mutating the active plan", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getRazorpayPlan).mockReturnValue(proMonthlyConfig);
    vi.mocked(createRazorpaySubscription).mockResolvedValue({
      keyId: "rzp_test_key",
      planId: "plan_pro_monthly",
      subscription: {
        id: "sub_123",
        entity: "subscription",
        plan_id: "plan_pro_monthly",
        customer_id: null,
        status: "created",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/razorpay/create-subscription", {
        method: "POST",
        body: JSON.stringify({ plan: "pro", cycle: "monthly" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      keyId: "rzp_test_key",
      subscriptionId: "sub_123",
      amount: 29900,
      displayAmount: "INR 299",
      currency: "INR",
      plan: "pro",
      cycle: "monthly",
      name: "Pro Monthly",
      description: "SnapOrbitAI Pro plan - monthly subscription",
    });
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });
});
