import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/billing/create-checkout-session/route";
import { NextRequest } from "next/server";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(),
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentAuditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/billing", () => ({
  getUserPlan: vi.fn().mockResolvedValue("free"),
}));

vi.mock("@/lib/razorpay", () => ({
  getRazorpayPublicConfig: vi.fn(() => ({ keyId: "rzp_test_key" })),
  getRazorpayClient: vi.fn(),
}));

describe("Create Checkout Session API (Razorpay)", () => {
  let subscriptionsCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionsCreate = vi.fn();
    (getRazorpayClient as any).mockReturnValue({
      subscriptions: {
        create: subscriptionsCreate,
      },
    });
    process.env.RAZORPAY_PRO_PLAN_ID = "plan_pro_123";
    process.env.RAZORPAY_PRO_PLUS_PLAN_ID = "plan_pro_plus_123";
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";

    (auth as any).mockResolvedValue({ userId: "user_123" });

    (clerkClient as any).mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          fullName: "Test User",
          username: "testuser",
          primaryEmailAddress: { emailAddress: "test@example.com" },
          privateMetadata: {},
        }),
      },
    });

    (subscriptionsCreate as any).mockResolvedValue({
      id: "sub_test_123",
      status: "created",
    });
  });

  const createMockRequest = (body: any) => {
    return new NextRequest("http://localhost:3000/api/billing/create-checkout-session", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("returns 401 if unauthorized", async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const req = createMockRequest({ plan: "pro" });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid plan", async () => {
    const req = createMockRequest({ plan: "invalid" });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("creates a Razorpay subscription and returns checkout payload", async () => {
    const req = createMockRequest({ plan: "pro" });
    const response = await POST(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual(
      expect.objectContaining({
        keyId: "rzp_test_key",
        subscriptionId: "sub_test_123",
        email: "test@example.com",
      }),
    );

    expect(subscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: "plan_pro_123",
        total_count: 120,
        customer_notify: 1,
        notes: expect.objectContaining({
          userId: "user_123",
          plan: "pro",
        }),
      }),
    );

    expect(prisma.paymentAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_123",
        provider: "razorpay",
        razorpaySubscriptionId: "sub_test_123",
        event: "razorpay_subscription_created",
        plan: "pro",
        status: "pending",
      }),
    });
  });
});
