import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { POST } from "@/app/api/stripe/webhook/route";

describe("POST /api/stripe/webhook", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_WEBHOOK_SECRET: "whsec_test",
    };
  });

  it("returns 400 when webhook configuration is missing", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers());

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "payload",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing Stripe webhook configuration.",
    });
  });

  it("returns 400 for an invalid signature", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "stripe-signature": "sig_bad" }),
    );
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("bad signature");
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "payload",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid signature" });

    consoleError.mockRestore();
  });

  it("upserts the subscription after checkout completion", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "stripe-signature": "sig_good" }),
    );
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {
            userId: "user_123",
            plan: "business",
          },
          customer: "cus_123",
          subscription: "sub_123",
        },
      },
    } as never);
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      status: "active",
      current_period_end: 1_800_000_000,
    } as unknown as Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>);

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "payload",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
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

  it("downgrades deleted subscriptions to free and canceled", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "stripe-signature": "sig_good" }),
    );
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          status: "canceled",
          current_period_end: 1_800_000_001,
        },
      },
    } as never);

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "payload",
      }),
    );

    expect(response.status).toBe(200);
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: "sub_123" },
      data: {
        plan: "free",
        status: "canceled",
        currentPeriodEnd: new Date(1_800_000_001 * 1000),
      },
    });
  });

  it("returns 500 when subscription persistence fails", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers({ "stripe-signature": "sig_good" }),
    );
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "past_due",
          current_period_end: 1_800_000_002,
        },
      },
    } as never);
    vi.mocked(prisma.subscription.updateMany).mockRejectedValue(
      new Error("Database down"),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "payload",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Webhook handler failed.",
    });

    consoleError.mockRestore();
  });
});
