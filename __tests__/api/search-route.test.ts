import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/embeddings", () => ({
  generateEmbedding: vi.fn(),
  cosineSimilarity: vi.fn(),
}));

vi.mock("@/lib/trial", () => ({
  getFeatureAccess: vi.fn(),
  markTrialUsed: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { cosineSimilarity, generateEmbedding } from "@/lib/embeddings";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";
import { POST } from "@/app/api/search/route";

describe("POST /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/search", {
        method: "POST",
        body: JSON.stringify({ query: "product photos" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for a blank query", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/search", {
        method: "POST",
        body: JSON.stringify({ query: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "query is required" });
    expect(getFeatureAccess).not.toHaveBeenCalled();
  });

  it("returns 403 when the free search trial is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: false,
      plan: "free",
      remainingUses: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/search", {
        method: "POST",
        body: JSON.stringify({ query: "white background product photos" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "TRIAL_EXHAUSTED",
      feature: "search",
    });
  });

  it("returns ranked results and records free-plan usage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "free",
      remainingUses: 2,
    });
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
    vi.mocked(prisma.video.findMany).mockResolvedValue([
      {
        id: "asset-low",
        title: "Low score",
        description: null,
        publicId: "low",
        originalSize: "100",
        compressedSize: "80",
        duration: 0,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-01T00:00:00.000Z"),
        userId: "user_123",
        mediaType: "image",
        aiDescription: "Low match",
        embedding: JSON.stringify([1, 0, 0]),
        aiCaptions: null,
        qualityScore: 4,
      },
      {
        id: "asset-best",
        title: "Best score",
        description: null,
        publicId: "best",
        originalSize: "100",
        compressedSize: "80",
        duration: 0,
        createdAt: new Date("2026-06-02T00:00:00.000Z"),
        updatedAt: new Date("2026-06-02T00:00:00.000Z"),
        userId: "user_123",
        mediaType: "image",
        aiDescription: "Best match",
        embedding: JSON.stringify([0, 1, 0]),
        aiCaptions: null,
        qualityScore: 9,
      },
      {
        id: "asset-mid",
        title: "Mid score",
        description: null,
        publicId: "mid",
        originalSize: "100",
        compressedSize: "80",
        duration: 0,
        createdAt: new Date("2026-06-03T00:00:00.000Z"),
        updatedAt: new Date("2026-06-03T00:00:00.000Z"),
        userId: "user_123",
        mediaType: "image",
        aiDescription: "Mid match",
        embedding: JSON.stringify([0, 0, 1]),
        aiCaptions: null,
        qualityScore: 7,
      },
    ] as Awaited<ReturnType<typeof prisma.video.findMany>>);
    vi.mocked(cosineSimilarity)
      .mockReturnValueOnce(0.42)
      .mockReturnValueOnce(0.95)
      .mockReturnValueOnce(0.72);

    const response = await POST(
      new Request("http://localhost/api/search", {
        method: "POST",
        body: JSON.stringify({ query: "bright studio product shot" }),
      }),
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.results).toHaveLength(2);
    expect(data.results.map((result: { id: string }) => result.id)).toEqual([
      "asset-best",
      "asset-mid",
    ]);
    expect(markTrialUsed).toHaveBeenCalledWith("user_123", "search");
  });

  it("falls back to text search when embedding generation fails", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "pro",
      remainingUses: null,
    });
    vi.mocked(generateEmbedding).mockRejectedValue(new Error("Gemini down"));
    vi.mocked(prisma.video.findMany).mockResolvedValue([
      {
        id: "asset-bird",
        title: "Bird at sunset",
        description: "Nature shot",
        publicId: "bird",
        originalSize: "100",
        compressedSize: "80",
        duration: 0,
        createdAt: new Date("2026-06-03T00:00:00.000Z"),
        updatedAt: new Date("2026-06-03T00:00:00.000Z"),
        userId: "user_123",
        mediaType: "image",
        aiDescription: null,
        embedding: null,
        aiCaptions: null,
        qualityScore: 7,
      },
      {
        id: "asset-city",
        title: "City skyline",
        description: "Architecture shot",
        publicId: "city",
        originalSize: "100",
        compressedSize: "80",
        duration: 0,
        createdAt: new Date("2026-06-02T00:00:00.000Z"),
        updatedAt: new Date("2026-06-02T00:00:00.000Z"),
        userId: "user_123",
        mediaType: "image",
        aiDescription: null,
        embedding: null,
        aiCaptions: null,
        qualityScore: 6,
      },
    ] as Awaited<ReturnType<typeof prisma.video.findMany>>);
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/search", {
        method: "POST",
        body: JSON.stringify({ query: "bird" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      results: [
        expect.objectContaining({
          id: "asset-bird",
        }),
      ],
    });

    consoleWarn.mockRestore();
  });
});
