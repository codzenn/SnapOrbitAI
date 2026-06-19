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
import { POST } from "@/app/api/video/analyze/route";

const analysisPayload = {
  summary: "A product demo walks through a mobile dashboard and explains the main workflow.",
  scenes: [
    { timestamp: "00:05", description: "The product logo appears." },
    { timestamp: "00:15", description: "The dashboard is introduced." },
    { timestamp: "00:45", description: "The narrator explains time-saving features." },
  ],
  mood: "professional",
  topics: ["product demo", "mobile app", "workflow automation"],
  hasAudio: true,
  keyQuotes: ["This app saves you two hours every day."],
};

describe("POST /api/video/analyze", () => {
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
      new Request("http://localhost/api/video/analyze", {
        method: "POST",
        body: JSON.stringify({ videoUrl: "https://example.com/video.mp4" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns cached analysis when the video was already analyzed", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "video_123",
      videoSummary: analysisPayload.summary,
      videoScenes: analysisPayload.scenes,
      videoMood: analysisPayload.mood,
      videoTopics: analysisPayload.topics,
      videoHasAudio: true,
      videoTranscript: analysisPayload.keyQuotes.join(" | "),
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);

    const response = await POST(
      new Request("http://localhost/api/video/analyze", {
        method: "POST",
        body: JSON.stringify({
          videoId: "video_123",
          videoUrl: "https://example.com/video.mp4",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(analysisPayload);
    expect(buildVideoPart).not.toHaveBeenCalled();
    expect(videoModel.generateContent).not.toHaveBeenCalled();
  });

  it("bypasses cached analysis when forceRefresh is true", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "video_123",
      videoSummary: "Old cached summary.",
      videoScenes: analysisPayload.scenes,
      videoMood: analysisPayload.mood,
      videoTopics: analysisPayload.topics,
      videoHasAudio: true,
      videoTranscript: analysisPayload.keyQuotes.join(" | "),
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
        text: () => JSON.stringify(analysisPayload),
      },
    } as Awaited<ReturnType<typeof videoModel.generateContent>>);

    const response = await POST(
      new Request("http://localhost/api/video/analyze", {
        method: "POST",
        body: JSON.stringify({
          videoId: "video_123",
          videoUrl: "https://example.com/video.mp4",
          forceRefresh: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(analysisPayload);
    expect(buildVideoPart).toHaveBeenCalledWith(
      "https://example.com/video.mp4",
      "video/mp4",
    );
    expect(videoModel.generateContent).toHaveBeenCalled();
  });

  it("returns 403 when the free analysis trial is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: false,
      plan: "free",
      remainingUses: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/video/analyze", {
        method: "POST",
        body: JSON.stringify({ videoUrl: "https://example.com/video.mp4" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "TRIAL_EXHAUSTED",
      feature: "video-analyze",
    });
  });

  it("generates analysis, stores it, and records free-plan usage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "video_123",
      videoSummary: null,
      videoScenes: null,
      videoMood: null,
      videoTopics: null,
      videoHasAudio: null,
      videoTranscript: null,
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
        text: () => JSON.stringify(analysisPayload),
      },
    } as Awaited<ReturnType<typeof videoModel.generateContent>>);

    const response = await POST(
      new Request("http://localhost/api/video/analyze", {
        method: "POST",
        body: JSON.stringify({
          videoId: "video_123",
          videoUrl: "https://example.com/video.mp4",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(analysisPayload);
    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "video_123" },
      data: {
        videoSummary: analysisPayload.summary,
        videoScenes: analysisPayload.scenes,
        videoMood: analysisPayload.mood,
        videoTopics: analysisPayload.topics,
        videoHasAudio: true,
        videoTranscript: analysisPayload.keyQuotes.join(" | "),
      },
    });
    expect(markTrialUsed).toHaveBeenCalledWith("user_123", "video-analyze");
  });
});
