import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCloudinaryAssetUrl } from "@/lib/cloudinary";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";

const VALID_RATIOS = new Set(["1:1", "16:9", "9:16", "4:5"]);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId, aspectRatio, consume = false } = await request.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 },
      );
    }

    if (!aspectRatio || typeof aspectRatio !== "string") {
      return NextResponse.json(
        { error: "aspectRatio is required" },
        { status: 400 },
      );
    }

    if (!VALID_RATIOS.has(aspectRatio)) {
      return NextResponse.json(
        { error: "Unsupported aspect ratio." },
        { status: 400 },
      );
    }

    if (typeof consume !== "boolean") {
      return NextResponse.json(
        { error: "consume must be a boolean." },
        { status: 400 },
      );
    }

    const asset = await prisma.video.findFirst({
      where: {
        publicId,
        userId,
        mediaType: "image",
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const access = await getFeatureAccess(userId, "gen-fill");
    if (!access.allowed) {
      return NextResponse.json(
        { error: "TRIAL_EXHAUSTED", feature: "gen-fill" },
        { status: 403 },
      );
    }

    const transformedUrl = getCloudinaryAssetUrl(publicId, {
      resourceType: "image",
      transformation: `c_pad,b_gen_fill,ar_${aspectRatio}`,
    });

    if (access.plan === "free" && consume) {
      await markTrialUsed(userId, "gen-fill");
    }

    return NextResponse.json({ url: transformedUrl });
  } catch (error) {
    console.error("[GenFill] error:", error);
    return NextResponse.json(
      { error: "Generative fill failed. Please try again." },
      { status: 500 },
    );
  }
}
