import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCloudinaryAssetUrl } from "@/lib/cloudinary";
import {
  getFeatureAccess,
  getUserPlan,
  getWindowedUsageCount,
  markTrialUsed,
  markWindowedUsage,
} from "@/lib/trial";

const PRO_ASPECT_FEATURE = "video-aspect-pro-monthly";
const PRO_ASPECT_LIMIT = 50;

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      publicId,
      videoId,
      operation,
      format = "mp4",
      quality = "auto",
    } = await request.json();

    if (!publicId || !operation) {
      return NextResponse.json(
        { error: "publicId and operation are required" },
        { status: 400 },
      );
    }

    const asset = await prisma.video.findFirst({
      where: {
        userId,
        mediaType: "video",
        ...(videoId ? { id: videoId } : { publicId }),
      },
      select: {
        id: true,
        publicId: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (operation !== "compress" && operation !== "aspect-ratio") {
      return NextResponse.json(
        { error: "Unsupported video operation." },
        { status: 400 },
      );
    }

    if (operation === "aspect-ratio") {
      const plan = await getUserPlan(userId);

      if (plan === "free") {
        const access = await getFeatureAccess(userId, "video-aspect");
        if (!access.allowed) {
          return NextResponse.json(
            { error: "TRIAL_EXHAUSTED", feature: "video-aspect" },
            { status: 403 },
          );
        }
      }

      if (plan === "pro") {
        const monthStart = getCurrentMonthStart();
        const currentUsage = await getWindowedUsageCount(
          userId,
          PRO_ASPECT_FEATURE,
          monthStart,
        );

        if (currentUsage >= PRO_ASPECT_LIMIT) {
          return NextResponse.json(
            {
              error: "PLAN_LIMIT_REACHED",
              feature: "video-aspect",
              message:
                "Pro includes 50 aspect ratio conversions per month. Upgrade to Business for unlimited conversions.",
            },
            { status: 403 },
          );
        }
      }
    }

    const normalizedQuality = quality === "auto" ? "auto" : String(quality).trim();
    const normalizedFormat = format === "webm" ? "webm" : "mp4";
    let resultUrl = "";
    let downloadUrl = "";

    if (operation === "compress") {
      const transformation = `q_${normalizedQuality},f_${normalizedFormat}`;
      resultUrl = getCloudinaryAssetUrl(asset.publicId, {
        resourceType: "video",
        transformation,
      });
      downloadUrl = getCloudinaryAssetUrl(asset.publicId, {
        resourceType: "video",
        transformation: `${transformation},fl_attachment`,
      });

      await prisma.video.update({
        where: { id: asset.id },
        data: {
          videoCompressedUrl: resultUrl,
        },
      });
    }

    if (operation === "aspect-ratio") {
      const transformation = "w_1080,h_1920,c_fill,g_auto,q_auto,f_mp4";
      resultUrl = getCloudinaryAssetUrl(asset.publicId, {
        resourceType: "video",
        transformation,
      });
      downloadUrl = getCloudinaryAssetUrl(asset.publicId, {
        resourceType: "video",
        transformation: `${transformation},fl_attachment`,
      });

      await prisma.video.update({
        where: { id: asset.id },
        data: {
          videoAspectRatioUrl: resultUrl,
        },
      });

      const plan = await getUserPlan(userId);
      if (plan === "free") {
        await markTrialUsed(userId, "video-aspect");
      } else if (plan === "pro") {
        await markWindowedUsage(
          userId,
          PRO_ASPECT_FEATURE,
          getCurrentMonthStart(),
        );
      }
    }

    return NextResponse.json({ url: resultUrl, downloadUrl });
  } catch (error) {
    console.error("[VideoConvert] error:", error);
    return NextResponse.json(
      { error: "Video conversion failed. Please try again." },
      { status: 500 },
    );
  }
}
