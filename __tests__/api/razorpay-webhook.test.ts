import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/webhook/razorpay/route";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentAuditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(),
}));

describe("Razorpay Webhook API", () => {
  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
    (clerkClient as any).mockResolvedValue({
      users: {
        updateUser: mockUpdateUser,
      },
    });
  });

  const sign = (payload: string) =>
    crypto.createHmac("sha256", "whsec_test").update(payload).digest("hex");

  const createReq = (payload: any, signature?: string) => {
    const body = JSON.stringify(payload);
    return new NextRequest("http://localhost/api/webhook/razorpay", {
      method: "POST",
      body,
      headers: {
        "x-razorpay-signature": signature ?? sign(body),
      },
    });
  };

  it("returns 400 on invalid signature", async () => {
    const req = createReq({ event: "ping" }, "bad");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("updates user plan on subscription.activated", async () => {
    const payload = {
      event: "subscription.activated",
      payload: {
        subscription: {
          entity: {
            id: "sub_123",
            customer_id: "cust_123",
            notes: {
              userId: "user_123",
              plan: "pro",
            },
          },
        },
      },
    };

    const req = createReq(payload);
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUpdateUser).toHaveBeenCalledWith("user_123", {
      publicMetadata: { plan: "pro" },
      privateMetadata: {
        razorpaySubscriptionId: "sub_123",
        razorpayCustomerId: "cust_123",
      },
    });

    expect(prisma.paymentAuditLog.create).toHaveBeenCalled();
  });
});

