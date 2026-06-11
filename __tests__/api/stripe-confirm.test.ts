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

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { POST } from "@/app/api/stripe/confirm/route";

describe("POST /api/stripe/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({
      userId: null,
    } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/stripe/confirm", {
        method: "POST",
        body: JSON.stringify({ sessionId: "cs_test_123" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when sessionId is missing", async () => {
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/stripe/confirm", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "sessionId is required.",
    });
  });

  it("returns 403 when the session belongs to another user", async () => {
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      metadata: { userId: "user_456", plan: "pro" },
      customer: "cus_123",
      subscription: "sub_123",
    } as unknown as Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>);

    const response = await POST(
      new Request("http://localhost/api/stripe/confirm", {
        method: "POST",
        body: JSON.stringify({ sessionId: "cs_test_123" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("persists the paid plan from the checkout session", async () => {
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      metadata: { userId: "user_123", plan: "business" },
      customer: "cus_123",
      subscription: "sub_123",
    } as unknown as Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>);
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      status: "active",
      current_period_end: 1_800_000_000,
    } as unknown as Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>);

    const response = await POST(
      new Request("http://localhost/api/stripe/confirm", {
        method: "POST",
        body: JSON.stringify({ sessionId: "cs_test_123" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      plan: "business",
      status: "active",
    });
    expect(prisma.subscription.upsert).toHaveBeenCalledWith({
      where: { userId: "user_123" },
      create: {
        userId: "user_123",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        plan: "business",
        status: "active",
        currentPeriodEnd: new Date(1_800_000_000 * 1000),
      },
      update: {
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        plan: "business",
        status: "active",
        currentPeriodEnd: new Date(1_800_000_000 * 1000),
      },
    });
  });
});
