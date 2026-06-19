import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@/generated/prisma/client";
import { videoModel, buildVideoPart } from "@/lib/ai";
import { parseJsonResponse } from "@/lib/media-ai";
import { prisma } from "@/lib/prisma";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";

export const runtime = "nodejs";

const VIDEO_CAPTION_PROMPT = `
You are a social media content expert. Watch this entire video carefully,
including listening to any speech or audio.

Generate platform-specific captions based on what actually happens and
what is actually said in the video, not generic descriptions.

Return ONLY a valid JSON object in exactly this shape, no extra text:
{
  "instagram": "<casual caption, relevant emojis, references actual video content, max 150 chars>",
  "linkedin": "<professional caption, no emojis, references actual content or key insight from video, max 200 chars>",
  "twitter": "<punchy caption under 260 chars, references something specific from the video, 1-2 inline hashtags>",
  "hashtags": {
    "high": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "medium": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "niche": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  },
  "audioUsed": true
}

If the video has no audio or speech, set audioUsed to false and base
captions on visuals only. Either way, be specific and avoid generic copy.
`;

interface VideoCaptionPayload {
  instagram: string;
  linkedin: string;
  twitter: string;
  hashtags: {
    high: string[];
    medium: string[];
    niche: string[];
  };
  audioUsed: boolean;
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

    if (videoId) {
      const asset = await prisma.video.findFirst({
        where: {
          id: videoId,
          userId,
          mediaType: "video",
        },
        select: {
          videoCaptions: true,
        },
      });

      if (!asset) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      if (asset.videoCaptions && forceRefresh !== true) {
        return NextResponse.json(asset.videoCaptions);
      }
    }

    const access = await getFeatureAccess(userId, "video-captions");
    if (forceRefresh === true && access.plan === "free") {
      return NextResponse.json(
        {
          error: "PAID_PLAN_REQUIRED",
          feature: "video-captions",
          message: "Refreshing video captions is available on paid plans.",
        },
        { status: 403 },
      );
    }

    if (!access.allowed) {
      return NextResponse.json(
        { error: "TRIAL_EXHAUSTED", feature: "video-captions" },
        { status: 403 },
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    const videoPart = await buildVideoPart(videoUrl, mimeType);
    const result = await videoModel.generateContent(
      [{ text: VIDEO_CAPTION_PROMPT }, videoPart],
      { timeout: 60_000 },
    );
    const parsed = parseJsonResponse<VideoCaptionPayload>(result.response.text());

    if (videoId) {
      await prisma.video.update({
        where: { id: videoId },
        data: {
          videoCaptions: parsed as unknown as Prisma.InputJsonValue,
        },
      });
    }

    if (access.plan === "free") {
      await markTrialUsed(userId, "video-captions");
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[VideoCaptions] error:", error);
    return NextResponse.json(
      { error: "Caption generation failed. Please try again." },
      { status: 500 },
    );
  }
}
