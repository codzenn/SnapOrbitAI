import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@/generated/prisma/client";
import { videoModel, buildVideoPart } from "@/lib/ai";
import { parseJsonResponse } from "@/lib/media-ai";
import { prisma } from "@/lib/prisma";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";

export const runtime = "nodejs";

const ANALYSIS_PROMPT = `
You are a video content analyst. Watch this entire video carefully,
including any audio or speech.

Return ONLY a valid JSON object in exactly this shape, no extra text:
{
  "summary": "<3 sentences describing what happens in this video. If there is speech, include what is actually being said or discussed - not just what is visually happening>",
  "scenes": [
    { "timestamp": "MM:SS", "description": "<one sentence - what happens at this moment>" }
  ],
  "mood": "<single word: energetic | calm | educational | entertaining | professional | dramatic | humorous>",
  "topics": ["<topic 1>", "<topic 2>", "<topic 3>"],
  "hasAudio": true,
  "keyQuotes": ["<important phrase said in the video if any>"]
}

Rules:
- scenes array must have at least 3 entries and at most 10
- timestamps must be in MM:SS format (for example "00:15" or "01:32")
- If the video has no audio or no speech, set hasAudio to false and keyQuotes to []
- topics should be specific, not generic like "video" or "content"
- summary must reference actual content, not just describe visuals generically
`;

interface Scene {
  timestamp: string;
  description: string;
}

interface VideoAnalysisPayload {
  summary: string;
  scenes: Scene[];
  mood: string;
  topics: string[];
  hasAudio: boolean;
  keyQuotes: string[];
}

function getCachedAnalysis(
  asset: {
    videoSummary: string | null;
    videoScenes: Prisma.JsonValue | null;
    videoMood: string | null;
    videoTopics: Prisma.JsonValue | null;
    videoHasAudio: boolean | null;
    videoTranscript: string | null;
  } | null,
): VideoAnalysisPayload | null {
  if (!asset?.videoSummary) {
    return null;
  }

  return {
    summary: asset.videoSummary,
    scenes: Array.isArray(asset.videoScenes)
      ? (asset.videoScenes as unknown as Scene[])
      : [],
    mood: asset.videoMood ?? "professional",
    topics: Array.isArray(asset.videoTopics) ? (asset.videoTopics as string[]) : [],
    hasAudio: asset.videoHasAudio ?? false,
    keyQuotes: asset.videoTranscript
      ? asset.videoTranscript
          .split(" | ")
          .map((quote) => quote.trim())
          .filter(Boolean)
      : [],
  };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      videoUrl,
      videoId,
      mimeType = "video/mp4",
      forceRefresh = false,
    } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: "videoUrl is required" },
        { status: 400 },
      );
    }

    let asset:
      | {
          id: string;
          videoSummary: string | null;
          videoScenes: Prisma.JsonValue | null;
          videoMood: string | null;
          videoTopics: Prisma.JsonValue | null;
          videoHasAudio: boolean | null;
          videoTranscript: string | null;
        }
      | null = null;

    if (videoId) {
      asset = await prisma.video.findFirst({
        where: {
          id: videoId,
          userId,
          mediaType: "video",
        },
        select: {
          id: true,
          videoSummary: true,
          videoScenes: true,
          videoMood: true,
          videoTopics: true,
          videoHasAudio: true,
          videoTranscript: true,
        },
      });

      if (!asset) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      const cached = forceRefresh === true ? null : getCachedAnalysis(asset);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const access = await getFeatureAccess(userId, "video-analyze");
    if (!access.allowed) {
      return NextResponse.json(
        { error: "TRIAL_EXHAUSTED", feature: "video-analyze" },
        { status: 403 },
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    const videoPart = await buildVideoPart(videoUrl, mimeType);
    const result = await videoModel.generateContent(
      [{ text: ANALYSIS_PROMPT }, videoPart],
      { timeout: 60_000 },
    );
    const parsed = parseJsonResponse<VideoAnalysisPayload>(result.response.text());

    if (videoId) {
      await prisma.video.update({
        where: { id: videoId },
        data: {
          videoSummary: parsed.summary,
          videoScenes: parsed.scenes as unknown as Prisma.InputJsonValue,
          videoMood: parsed.mood,
          videoTopics: parsed.topics as unknown as Prisma.InputJsonValue,
          videoHasAudio: parsed.hasAudio,
          videoTranscript: parsed.keyQuotes.join(" | ") || null,
        },
      });
    }

    if (access.plan === "free") {
      await markTrialUsed(userId, "video-analyze");
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[VideoAnalyze] error:", error);
    return NextResponse.json(
      { error: "Video analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
