import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { POST } from "@/app/api/stripe/checkout/route";

describe("POST /api/stripe/checkout", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APP_URL: "https://snaporbit.test",
      STRIPE_PRO_MONTHLY_PRICE_ID: "price_pro_monthly",
      STRIPE_PRO_YEARLY_PRICE_ID: "price_pro_yearly",
      STRIPE_BUSINESS_MONTHLY_PRICE_ID: "price_business_monthly",
      STRIPE_BUSINESS_YEARLY_PRICE_ID: "price_business_yearly",
    };
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId: "pro_monthly" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for an invalid price id", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId: "enterprise" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid price selected.",
    });
  });

  it("returns 500 when the mapped Stripe price env var is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId: "pro_monthly" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Missing STRIPE_PRO_MONTHLY_PRICE_ID environment variable.",
    });
  });

  it("creates a Stripe Checkout session for a valid plan", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: "https://checkout.stripe.test/session_123",
    } as Awaited<ReturnType<typeof stripe.checkout.sessions.create>>);

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId: "business_yearly" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.stripe.test/session_123",
    });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: "subscription",
      line_items: [{ price: "price_business_yearly", quantity: 1 }],
      success_url:
        "https://snaporbit.test/home?upgraded=true&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://snaporbit.test/pricing",
      metadata: {
        userId: "user_123",
        plan: "business",
      },
      subscription_data: {
        metadata: {
          userId: "user_123",
          plan: "business",
        },
      },
    });
  });

  it("returns 500 when Stripe session creation fails", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(
      new Error("Stripe down"),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId: "pro_yearly" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to create Stripe checkout session.",
    });

    consoleError.mockRestore();
  });
});
