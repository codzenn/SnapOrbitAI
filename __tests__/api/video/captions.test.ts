import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  buildVideoPart: vi.fn(),
  videoModel: {
    generateContent: vi.fn(),
  },
}));

vi.mock("@/lib/media-ai", () => ({
  parseJsonResponse: vi.fn((value: string) => JSON.parse(value)),
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
  markTrialUsed: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { buildVideoPart, videoModel } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";
import { POST } from "@/app/api/video/captions/route";

const captionPayload = {
  instagram: "Behind the scenes of our new launch day setup.",
  linkedin: "A quick walkthrough of the product launch workflow featured in this video.",
  twitter: "Launch-day workflow in motion. Faster reviews, cleaner handoffs. #productivity #saas",
  hashtags: {
    high: ["#marketing", "#launch", "#video", "#creator", "#socialmedia"],
    medium: ["#workflow", "#productdemo", "#brandvideo", "#teamwork", "#growth"],
    niche: ["#saaslaunch", "#opsvideo", "#foundertools", "#creatorsuite", "#campaignops"],
  },
  audioUsed: true,
};

describe("POST /api/video/captions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(globalThis, "setTimeout").mockImplementation(
      ((callback: TimerHandler) => {
        if (typeof callback === "function") {
          callback();
        }

        return {} as unknown as ReturnType<typeof setTimeout>;
      }) as unknown as typeof setTimeout,
    );
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/video/captions", {
        method: "POST",
        body: JSON.stringify({ videoUrl: "https://example.com/video.mp4" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns cached captions when they already exist for the video", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      videoCaptions: captionPayload,
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);

    const response = await POST(
      new Request("http://localhost/api/video/captions", {
        method: "POST",
        body: JSON.stringify({
          videoId: "video_123",
          videoUrl: "https://example.com/video.mp4",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(captionPayload);
    expect(buildVideoPart).not.toHaveBeenCalled();
  });

  it("blocks forced caption refresh for free users", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      videoCaptions: captionPayload,
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "free",
      remainingUses: 1,
    });

    const response = await POST(
      new Request("http://localhost/api/video/captions", {
        method: "POST",
        body: JSON.stringify({
          videoId: "video_123",
          videoUrl: "https://example.com/video.mp4",
          forceRefresh: true,
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "PAID_PLAN_REQUIRED",
      feature: "video-captions",
      message: "Refreshing video captions is available on paid plans.",
    });
    expect(buildVideoPart).not.toHaveBeenCalled();
    expect(videoModel.generateContent).not.toHaveBeenCalled();
  });

  it("bypasses cached captions when a paid user forces refresh", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      videoCaptions: {
        ...captionPayload,
        instagram: "Old cached caption.",
      },
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "pro",
      remainingUses: null,
    });
    vi.mocked(buildVideoPart).mockResolvedValue({
      inlineData: { mimeType: "video/mp4", data: "base64-data" },
    });
    vi.mocked(videoModel.generateContent).mockResolvedValue({
      response: {
        text: () => JSON.stringify(captionPayload),
      },
    } as Awaited<ReturnType<typeof videoModel.generateContent>>);

    const response = await POST(
      new Request("http://localhost/api/video/captions", {
        method: "POST",
        body: JSON.stringify({
          videoId: "video_123",
          videoUrl: "https://example.com/video.mp4",
          forceRefresh: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(captionPayload);
    expect(buildVideoPart).toHaveBeenCalledWith(
      "https://example.com/video.mp4",
      "video/mp4",
    );
    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "video_123" },
      data: {
        videoCaptions: captionPayload,
      },
    });
    expect(markTrialUsed).not.toHaveBeenCalled();
  });

  it("returns 403 when the free captions trial is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: false,
      plan: "free",
      remainingUses: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/video/captions", {
        method: "POST",
        body: JSON.stringify({ videoUrl: "https://example.com/video.mp4" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "TRIAL_EXHAUSTED",
      feature: "video-captions",
    });
  });

  it("generates captions, stores them, and records free-plan usage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      videoCaptions: null,
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "free",
      remainingUses: 1,
    });
    vi.mocked(buildVideoPart).mockResolvedValue({
      inlineData: { mimeType: "video/mp4", data: "base64-data" },
    });
    vi.mocked(videoModel.generateContent).mockResolvedValue({
      response: {
        text: () => JSON.stringify(captionPayload),
      },
    } as Awaited<ReturnType<typeof videoModel.generateContent>>);

    const response = await POST(
      new Request("http://localhost/api/video/captions", {
        method: "POST",
        body: JSON.stringify({
          videoId: "video_123",
          videoUrl: "https://example.com/video.mp4",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(captionPayload);
    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "video_123" },
      data: {
        videoCaptions: captionPayload,
      },
    });
    expect(markTrialUsed).toHaveBeenCalledWith("user_123", "video-captions");
  });
});
