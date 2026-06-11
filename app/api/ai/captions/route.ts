import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { generateCaptionsFromImage } from "@/lib/media-ai";
import {
  getAIProviderUnavailableMessage,
  isAIProviderUnavailableError,
} from "@/lib/ai-provider-errors";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, assetId } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 },
      );
    }

    if (assetId) {
      const cachedAsset = await prisma.video.findFirst({
        where: {
          id: assetId,
          userId,
        },
      });

      if (!cachedAsset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      if (cachedAsset.aiCaptions) {
        return NextResponse.json(cachedAsset.aiCaptions);
      }
    }

    const access = await getFeatureAccess(userId, "captions");
    if (!access.allowed) {
      return NextResponse.json(
        { error: "TRIAL_EXHAUSTED", feature: "captions" },
        { status: 403 },
      );
    }

    const captions = await generateCaptionsFromImage(imageUrl);

    if (assetId) {
      await prisma.video.update({
        where: { id: assetId },
        data: { aiCaptions: captions as unknown as Prisma.InputJsonValue },
      });
    }

    if (access.plan === "free") {
      await markTrialUsed(userId, "captions");
    }

    return NextResponse.json(captions);
  } catch (error) {
    console.error("[Captions] error:", error);

    if (isAIProviderUnavailableError(error)) {
      return NextResponse.json(
        {
          error: "AI_UNAVAILABLE",
          message: getAIProviderUnavailableMessage("Caption generation"),
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Caption generation failed. Please try again." },
      { status: 500 },
    );
  }
}
