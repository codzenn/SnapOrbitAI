import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractCloudinaryPublicId, getCloudinaryAssetUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { generateAuditFromImage, generateCaptionsFromImage } from "@/lib/media-ai";
import {
  getAIProviderUnavailableMessage,
  isAIProviderUnavailableError,
} from "@/lib/ai-provider-errors";
import { getFeatureAccess, getUserPlan, markTrialUsed } from "@/lib/trial";

const VALID_OPERATIONS = ["bg-remove", "gen-fill", "audit", "captions"] as const;

function sanitizeFileName(name: string) {
  const sanitized = name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || "processed-image";
}

function getBatchLimit(plan: string) {
  if (plan === "business") {
    return 25;
  }

  if (plan === "pro") {
    return 10;
  }

  return 3;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrls, operations, aspectRatio = "1:1" } = await request.json();

    if (!Array.isArray(imageUrls) || imageUrls.length < 2 || imageUrls.length > 10) {
      return NextResponse.json(
        { error: "Upload between 2 and 10 images." },
        { status: 400 },
      );
    }

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: "Select at least one batch operation." },
        { status: 400 },
      );
    }

    if (operations.some((operation) => !VALID_OPERATIONS.includes(operation))) {
      return NextResponse.json(
        { error: "Unsupported batch operation selected." },
        { status: 400 },
      );
    }

    if (operations.includes("bg-remove") && operations.includes("gen-fill")) {
      return NextResponse.json(
        {
          error:
            "Background removal and Generative fill cannot be combined in one batch job. Run them as separate batches.",
        },
        { status: 400 },
      );
    }

    const plan = await getUserPlan(userId);
    const imageLimit = getBatchLimit(plan);

    if (imageUrls.length > imageLimit) {
      return NextResponse.json(
        {
          error:
            plan === "free"
              ? "Free batch trial supports up to 3 images."
              : `Your ${plan} plan supports up to ${imageLimit} images per batch job.`,
        },
        { status: 403 },
      );
    }

    if (plan === "free") {
      const access = await getFeatureAccess(userId, "batch");
      if (!access.allowed) {
        return NextResponse.json(
          { error: "TRIAL_EXHAUSTED", feature: "batch" },
          { status: 403 },
        );
      }
    }

    const results = [];

    for (const imageUrl of imageUrls as string[]) {
      const publicId = extractCloudinaryPublicId(imageUrl);
      if (!publicId) {
        throw new Error("Could not parse a Cloudinary public ID from one of the images.");
      }

      const asset = await prisma.video.findFirst({
        where: {
          userId,
          publicId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      const transformations: string[] = [];
      if (operations.includes("bg-remove")) {
        transformations.push("e_background_removal");
      }
      if (operations.includes("gen-fill")) {
        transformations.push(`c_pad,b_gen_fill,ar_${aspectRatio}`);
      }

      const finalImageUrl = getCloudinaryAssetUrl(publicId, {
        resourceType: "image",
        transformation: [...transformations, "q_auto,f_png"].join("/"),
      });
      const downloadUrl = finalImageUrl;
      const title = asset?.title || publicId.split("/").pop() || publicId;
      const fileName = `${sanitizeFileName(title)}.png`;

      const result: {
        sourceUrl: string;
        outputUrl: string;
        downloadUrl: string;
        publicId: string;
        title: string;
        fileName: string;
        audit?: Awaited<ReturnType<typeof generateAuditFromImage>>;
        captions?: Awaited<ReturnType<typeof generateCaptionsFromImage>>;
      } = {
        sourceUrl: imageUrl,
        outputUrl: finalImageUrl,
        downloadUrl,
        publicId,
        title,
        fileName,
      };

      if (operations.includes("audit")) {
        result.audit = await generateAuditFromImage(imageUrl);
      }

      if (operations.includes("captions")) {
        result.captions = await generateCaptionsFromImage(imageUrl);
      }

      if (asset?.id && (result.audit || result.captions)) {
        await prisma.video.update({
          where: {
            id: asset.id,
          },
          data: {
            ...(result.audit ? { qualityScore: result.audit.overallScore } : {}),
            ...(result.captions
              ? { aiCaptions: result.captions as unknown as Prisma.InputJsonValue }
              : {}),
          },
        });
      }

      results.push(result);
    }

    if (plan === "free") {
      await markTrialUsed(userId, "batch");
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[Batch] error:", error);

    if (isAIProviderUnavailableError(error)) {
      return NextResponse.json(
        {
          error: "AI_UNAVAILABLE",
          message: getAIProviderUnavailableMessage("Batch AI processing"),
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Batch processing failed. Please try again." },
      { status: 500 },
    );
  }
}
