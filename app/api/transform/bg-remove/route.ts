import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCloudinaryAssetUrl } from "@/lib/cloudinary";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = await request.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "publicId is required" },
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

    const access = await getFeatureAccess(userId, "bg-remove");
    if (!access.allowed) {
      return NextResponse.json(
        { error: "TRIAL_EXHAUSTED", feature: "bg-remove" },
        { status: 403 },
      );
    }

    const transformedUrl = getCloudinaryAssetUrl(publicId, {
      resourceType: "image",
      transformation: "e_background_removal/f_png",
    });

    if (access.plan === "free") {
      await markTrialUsed(userId, "bg-remove");
    }

    return NextResponse.json({ url: transformedUrl });
  } catch (error) {
    console.error("[BGRemove] error:", error);
    return NextResponse.json(
      { error: "Background removal failed. Please try again." },
      { status: 500 },
    );
  }
}
