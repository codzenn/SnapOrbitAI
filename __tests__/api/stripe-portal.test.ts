import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { POST } from "@/app/api/stripe/portal/route";

describe("POST /api/stripe/portal", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APP_URL: "https://snaporbit.test",
    };
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when the user has no subscription", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "No subscription found",
    });
  });

  it("creates a Stripe Billing Portal session for the active subscriber", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      userId: "user_123",
      stripeCustomerId: "cus_123",
    } as Awaited<ReturnType<typeof prisma.subscription.findUnique>>);
    vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue({
      url: "https://billing.stripe.test/session_123",
    } as Awaited<ReturnType<typeof stripe.billingPortal.sessions.create>>);

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://billing.stripe.test/session_123",
    });
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_123",
      return_url: "https://snaporbit.test/analytics",
    });
  });

  it("returns 500 when Stripe portal creation fails", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      userId: "user_123",
      stripeCustomerId: "cus_123",
    } as Awaited<ReturnType<typeof prisma.subscription.findUnique>>);
    vi.mocked(stripe.billingPortal.sessions.create).mockRejectedValue(
      new Error("Stripe down"),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Could not create a customer portal session.",
    });

    consoleError.mockRestore();
  });
});
