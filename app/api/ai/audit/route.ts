import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateAuditFromImage } from "@/lib/media-ai";
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

      if (cachedAsset.qualityScore !== null) {
        return NextResponse.json({
          overallScore: cachedAsset.qualityScore,
        });
      }
    }

    const access = await getFeatureAccess(userId, "audit");
    if (!access.allowed) {
      return NextResponse.json(
        { error: "TRIAL_EXHAUSTED", feature: "audit" },
        { status: 403 },
      );
    }

    const audit = await generateAuditFromImage(imageUrl);

    if (assetId) {
      await prisma.video.update({
        where: { id: assetId },
        data: { qualityScore: audit.overallScore },
      });
    }

    if (access.plan === "free") {
      await markTrialUsed(userId, "audit");
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error("[Audit] error:", error);

    if (isAIProviderUnavailableError(error)) {
      return NextResponse.json(
        {
          error: "AI_UNAVAILABLE",
          message: getAIProviderUnavailableMessage("Quality audit"),
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Quality audit failed. Please try again." },
      { status: 500 },
    );
  }
}
