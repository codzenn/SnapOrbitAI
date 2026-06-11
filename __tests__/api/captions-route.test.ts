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
  generateCaptionsFromImage: vi.fn(),
}));

vi.mock("@/lib/trial", () => ({
  getFeatureAccess: vi.fn(),
  markTrialUsed: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateCaptionsFromImage } from "@/lib/media-ai";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";
import { POST } from "@/app/api/ai/captions/route";

const captionPayload = {
  instagram: "A bright studio setup for your next product launch.",
  linkedin: "Clean product imagery ready for launch assets.",
  twitter: "Studio-ready product shot for your next drop. #ecommerce",
  hashtags: {
    high: ["#product", "#launch"],
    medium: ["#studio", "#content"],
    niche: ["#catalog", "#mockup"],
  },
};

describe("POST /api/ai/captions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/ai/captions", {
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
      new Request("http://localhost/api/ai/captions", {
        method: "POST",
        body: JSON.stringify({ assetId: "asset_123" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "imageUrl is required",
    });
  });

  it("returns cached captions when they already exist for the asset", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "asset_123",
      aiCaptions: captionPayload,
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);

    const response = await POST(
      new Request("http://localhost/api/ai/captions", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: "https://example.com/image.jpg",
          assetId: "asset_123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(captionPayload);
    expect(generateCaptionsFromImage).not.toHaveBeenCalled();
    expect(getFeatureAccess).not.toHaveBeenCalled();
  });

  it("returns 403 when the free captions trial is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: false,
      plan: "free",
      remainingUses: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/ai/captions", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "TRIAL_EXHAUSTED",
      feature: "captions",
    });
  });

  it("generates captions, stores them, and records free-plan usage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "asset_123",
      aiCaptions: null,
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "free",
      remainingUses: 1,
    });
    vi.mocked(generateCaptionsFromImage).mockResolvedValue(captionPayload);

    const response = await POST(
      new Request("http://localhost/api/ai/captions", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: "https://example.com/image.jpg",
          assetId: "asset_123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(captionPayload);
    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "asset_123" },
      data: { aiCaptions: captionPayload },
    });
    expect(markTrialUsed).toHaveBeenCalledWith("user_123", "captions");
  });

  it("returns 500 when caption generation fails", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "pro",
      remainingUses: null,
    });
    vi.mocked(generateCaptionsFromImage).mockRejectedValue(new Error("Gemini down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/ai/captions", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Caption generation failed. Please try again.",
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
    vi.mocked(generateCaptionsFromImage).mockRejectedValue(
      new Error("429 Too Many Requests: quota exceeded"),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/ai/captions", {
        method: "POST",
        body: JSON.stringify({ imageUrl: "https://example.com/image.jpg" }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "AI_UNAVAILABLE",
      message:
        "Caption generation is temporarily unavailable because the AI provider is rate-limited. Please try again later.",
    });

    consoleError.mockRestore();
  });
});
