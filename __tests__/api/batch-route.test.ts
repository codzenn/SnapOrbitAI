import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/cloudinary", () => ({
  extractCloudinaryPublicId: vi.fn(),
  getCloudinaryAssetUrl: vi.fn(),
}));

vi.mock("@/lib/media-ai", () => ({
  generateAuditFromImage: vi.fn(),
  generateCaptionsFromImage: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/trial", () => ({
  getFeatureAccess: vi.fn(),
  getUserPlan: vi.fn(),
  markTrialUsed: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import {
  extractCloudinaryPublicId,
  getCloudinaryAssetUrl,
} from "@/lib/cloudinary";
import {
  generateAuditFromImage,
  generateCaptionsFromImage,
} from "@/lib/media-ai";
import { prisma } from "@/lib/prisma";
import { getFeatureAccess, getUserPlan, markTrialUsed } from "@/lib/trial";
import { POST } from "@/app/api/batch/route";

describe("POST /api/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/batch", {
        method: "POST",
        body: JSON.stringify({
          imageUrls: ["https://res.cloudinary.com/demo/image/upload/one.jpg"],
          operations: ["audit"],
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when fewer than 2 images are provided", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/batch", {
        method: "POST",
        body: JSON.stringify({
          imageUrls: ["https://res.cloudinary.com/demo/image/upload/one.jpg"],
          operations: ["audit"],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Upload between 2 and 10 images.",
    });
  });

  it("returns 403 when the free batch trial is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getUserPlan).mockResolvedValue("free");
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: false,
      plan: "free",
      remainingUses: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/batch", {
        method: "POST",
        body: JSON.stringify({
          imageUrls: [
            "https://res.cloudinary.com/demo/image/upload/one.jpg",
            "https://res.cloudinary.com/demo/image/upload/two.jpg",
          ],
          operations: ["audit"],
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "TRIAL_EXHAUSTED",
      feature: "batch",
    });
  });

  it("processes a free-plan batch job and records trial usage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getUserPlan).mockResolvedValue("free");
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "free",
      remainingUses: 1,
    });
    vi.mocked(extractCloudinaryPublicId).mockImplementation((url) =>
      typeof url === "string" ? url.split("/").pop()?.replace(".jpg", "") ?? null : null,
    );
    vi.mocked(getCloudinaryAssetUrl).mockImplementation(
      (publicId) => `https://cdn.snaporbit.test/${publicId}/processed.png`,
    );
    vi.mocked(prisma.video.findFirst)
      .mockResolvedValueOnce({
        id: "asset_1",
        title: "Car photo",
      } as Awaited<ReturnType<typeof prisma.video.findFirst>>)
      .mockResolvedValueOnce({
        id: "asset_2",
        title: "Tree photo",
      } as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(generateAuditFromImage).mockResolvedValue({
      overallScore: 8,
    } as Awaited<ReturnType<typeof generateAuditFromImage>>);
    vi.mocked(generateCaptionsFromImage).mockResolvedValue({
      instagram: "IG caption",
    } as Awaited<ReturnType<typeof generateCaptionsFromImage>>);

    const response = await POST(
      new Request("http://localhost/api/batch", {
        method: "POST",
        body: JSON.stringify({
          imageUrls: [
            "https://res.cloudinary.com/demo/image/upload/one.jpg",
            "https://res.cloudinary.com/demo/image/upload/two.jpg",
          ],
          operations: ["gen-fill", "audit", "captions"],
          aspectRatio: "16:9",
        }),
      }),
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.results).toHaveLength(2);
    expect(data.results[0]).toMatchObject({
      sourceUrl: "https://res.cloudinary.com/demo/image/upload/one.jpg",
      outputUrl: "https://cdn.snaporbit.test/one/processed.png",
      downloadUrl: "https://cdn.snaporbit.test/one/processed.png",
      publicId: "one",
      title: "Car photo",
      fileName: "Car photo.png",
      audit: { overallScore: 8 },
      captions: { instagram: "IG caption" },
    });
    expect(prisma.video.update).toHaveBeenCalledTimes(2);
    expect(prisma.video.update).toHaveBeenNthCalledWith(1, {
      where: { id: "asset_1" },
      data: {
        qualityScore: 8,
        aiCaptions: { instagram: "IG caption" },
      },
    });
    expect(markTrialUsed).toHaveBeenCalledWith("user_123", "batch");
  });

  it("returns 400 for the unsupported bg-remove and gen-fill combination", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getUserPlan).mockResolvedValue("pro");

    const response = await POST(
      new Request("http://localhost/api/batch", {
        method: "POST",
        body: JSON.stringify({
          imageUrls: [
            "https://res.cloudinary.com/demo/image/upload/one.jpg",
            "https://res.cloudinary.com/demo/image/upload/two.jpg",
          ],
          operations: ["bg-remove", "gen-fill"],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        "Background removal and Generative fill cannot be combined in one batch job. Run them as separate batches.",
    });
  });

  it("returns 500 when a source image cannot be parsed", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getUserPlan).mockResolvedValue("pro");
    vi.mocked(extractCloudinaryPublicId).mockReturnValue(null);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/batch", {
        method: "POST",
        body: JSON.stringify({
          imageUrls: [
            "https://example.com/one.jpg",
            "https://example.com/two.jpg",
          ],
          operations: ["captions"],
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Batch processing failed. Please try again.",
    });

    consoleError.mockRestore();
  });

  it("returns 503 when AI batch operations hit provider quota", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getUserPlan).mockResolvedValue("pro");
    vi.mocked(extractCloudinaryPublicId).mockImplementation((url) =>
      typeof url === "string" ? url.split("/").pop()?.replace(".jpg", "") ?? null : null,
    );
    vi.mocked(generateCaptionsFromImage).mockRejectedValue(
      new Error("429 Too Many Requests: quota exceeded"),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/batch", {
        method: "POST",
        body: JSON.stringify({
          imageUrls: [
            "https://res.cloudinary.com/demo/image/upload/one.jpg",
            "https://res.cloudinary.com/demo/image/upload/two.jpg",
          ],
          operations: ["captions"],
        }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "AI_UNAVAILABLE",
      message:
        "Batch AI processing is temporarily unavailable because the AI provider is rate-limited. Please try again later.",
    });

    consoleError.mockRestore();
  });
});
