import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/cloudinary", () => ({
  getCloudinaryAssetUrl: vi.fn(),
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
  getWindowedUsageCount: vi.fn(),
  markTrialUsed: vi.fn(),
  markWindowedUsage: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getCloudinaryAssetUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import {
  getFeatureAccess,
  getUserPlan,
  getWindowedUsageCount,
  markTrialUsed,
  markWindowedUsage,
} from "@/lib/trial";
import { POST } from "@/app/api/video/convert/route";

describe("POST /api/video/convert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/video/convert", {
        method: "POST",
        body: JSON.stringify({ publicId: "video/public-id", operation: "compress" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns a compression URL and stores it on the video", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "video_123",
      publicId: "video/public-id",
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getCloudinaryAssetUrl)
      .mockReturnValueOnce("https://cdn.snaporbit.test/video/public-id/compressed.mp4")
      .mockReturnValueOnce(
        "https://cdn.snaporbit.test/video/public-id/compressed-download.mp4",
      );

    const response = await POST(
      new Request("http://localhost/api/video/convert", {
        method: "POST",
        body: JSON.stringify({
          publicId: "video/public-id",
          videoId: "video_123",
          operation: "compress",
          format: "mp4",
          quality: "auto",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://cdn.snaporbit.test/video/public-id/compressed.mp4",
      downloadUrl: "https://cdn.snaporbit.test/video/public-id/compressed-download.mp4",
    });
    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "video_123" },
      data: {
        videoCompressedUrl: "https://cdn.snaporbit.test/video/public-id/compressed.mp4",
      },
    });
  });

  it("returns 403 when the free aspect-ratio trial is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "video_123",
      publicId: "video/public-id",
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getUserPlan).mockResolvedValue("free");
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: false,
      plan: "free",
      remainingUses: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/video/convert", {
        method: "POST",
        body: JSON.stringify({
          publicId: "video/public-id",
          videoId: "video_123",
          operation: "aspect-ratio",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "TRIAL_EXHAUSTED",
      feature: "video-aspect",
    });
  });

  it("returns 403 when the Pro monthly aspect-ratio limit is reached", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "video_123",
      publicId: "video/public-id",
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getUserPlan).mockResolvedValue("pro");
    vi.mocked(getWindowedUsageCount).mockResolvedValue(50);

    const response = await POST(
      new Request("http://localhost/api/video/convert", {
        method: "POST",
        body: JSON.stringify({
          publicId: "video/public-id",
          videoId: "video_123",
          operation: "aspect-ratio",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "PLAN_LIMIT_REACHED",
      feature: "video-aspect",
      message:
        "Pro includes 50 aspect ratio conversions per month. Upgrade to Business for unlimited conversions.",
    });
  });

  it("creates an aspect-ratio URL and records free-plan usage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "video_123",
      publicId: "video/public-id",
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getUserPlan).mockResolvedValue("free");
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "free",
      remainingUses: 1,
    });
    vi.mocked(getCloudinaryAssetUrl)
      .mockReturnValueOnce("https://cdn.snaporbit.test/video/public-id/portrait.mp4")
      .mockReturnValueOnce(
        "https://cdn.snaporbit.test/video/public-id/portrait-download.mp4",
      );

    const response = await POST(
      new Request("http://localhost/api/video/convert", {
        method: "POST",
        body: JSON.stringify({
          publicId: "video/public-id",
          videoId: "video_123",
          operation: "aspect-ratio",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://cdn.snaporbit.test/video/public-id/portrait.mp4",
      downloadUrl: "https://cdn.snaporbit.test/video/public-id/portrait-download.mp4",
    });
    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "video_123" },
      data: {
        videoAspectRatioUrl: "https://cdn.snaporbit.test/video/public-id/portrait.mp4",
      },
    });
    expect(markTrialUsed).toHaveBeenCalledWith("user_123", "video-aspect");
    expect(markWindowedUsage).not.toHaveBeenCalled();
  });
});
