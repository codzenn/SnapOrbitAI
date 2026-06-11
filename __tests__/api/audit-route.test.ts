import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/media-ai", () => ({
  generateAuditFromImage: vi.fn(),
}));

vi.mock("@/lib/trial", () => ({
  getFeatureAccess: vi.fn(),
  markTrialUsed: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateAuditFromImage } from "@/lib/media-ai";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";
import { POST } from "@/app/api/ai/audit/route";

const auditPayload = {
  overallScore: 8,
  composition: 8,
  brightness: "good",
  blur: "sharp",
  platformSuitability: {
    instagram: true,
    linkedin: true,
    twitter: true,
  },
  topIssue: "Image looks great",
  tip: "Keep using soft, even lighting for consistency.",
} as const;

describe("POST /api/ai/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/ai/audit", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when imageUrl is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/ai/audit", {
        method: "POST",
        body: JSON.stringify({ assetId: "asset_123" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "imageUrl is required",
    });
  });

  it("returns the cached quality score when present", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "asset_123",
      qualityScore: 9,
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);

    const response = await POST(
      new Request("http://localhost/api/ai/audit", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: "https://example.com/image.jpg",
          assetId: "asset_123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ overallScore: 9 });
    expect(generateAuditFromImage).not.toHaveBeenCalled();
    expect(getFeatureAccess).not.toHaveBeenCalled();
  });

  it("returns 403 when the free audit trial is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: false,
      plan: "free",
      remainingUses: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/ai/audit", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "TRIAL_EXHAUSTED",
      feature: "audit",
    });
  });

  it("generates an audit, stores the score, and records free-plan usage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "asset_123",
      qualityScore: null,
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "free",
      remainingUses: 1,
    });
    vi.mocked(generateAuditFromImage).mockResolvedValue(auditPayload);

    const response = await POST(
      new Request("http://localhost/api/ai/audit", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: "https://example.com/image.jpg",
          assetId: "asset_123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(auditPayload);
    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "asset_123" },
      data: { qualityScore: 8 },
    });
    expect(markTrialUsed).toHaveBeenCalledWith("user_123", "audit");
  });

  it("returns 500 when audit generation fails", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "pro",
      remainingUses: null,
    });
    vi.mocked(generateAuditFromImage).mockRejectedValue(new Error("Gemini down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/ai/audit", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Quality audit failed. Please try again.",
    });

    consoleError.mockRestore();
  });

  it("returns 503 when the AI provider quota is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "pro",
      remainingUses: null,
    });
    vi.mocked(generateAuditFromImage).mockRejectedValue(
      new Error("429 Too Many Requests: quota exceeded"),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/ai/audit", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "AI_UNAVAILABLE",
      message:
        "Quality audit is temporarily unavailable because the AI provider is rate-limited. Please try again later.",
    });

    consoleError.mockRestore();
  });
});
