import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { generateDescriptionAndEmbedding } from "@/lib/media-ai";
import { isAIProviderUnavailableError } from "@/lib/ai-provider-errors";
import { getAssetLibraryLimit, getUserPlan } from "@/lib/trial";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported here." },
        { status: 400 },
      );
    }

    const plan = await getUserPlan(userId);
    const assetLimit = getAssetLibraryLimit(plan);

    if (assetLimit !== null) {
      const assetCount = await prisma.video.count({
        where: { userId },
      });

      if (assetCount >= assetLimit) {
        return NextResponse.json(
          {
            error:
              plan === "free"
                ? "Free plan users can store up to 5 assets. Upgrade to keep uploading."
                : "Pro plan users can store up to 500 assets. Upgrade to Business for unlimited storage.",
          },
          { status: 403 },
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "snaporbit-assets",
              resource_type: "image",
            },
            (error, result) => {
              if (error || !result) {
                reject(error ?? new Error("Cloudinary upload failed."));
                return;
              }

              resolve(result as CloudinaryUploadResult);
            },
          )
          .end(buffer);
      },
    );

    const title = file.name.replace(/\.[^.]+$/, "") || "Untitled asset";

    const asset = await prisma.video.create({
      data: {
        title,
        description: null,
        publicId: uploadResult.public_id,
        originalSize: String(file.size),
        compressedSize: String(uploadResult.bytes || file.size),
        duration: 0,
        userId,
        mediaType: "image",
      },
    });

    try {
      const aiResult = await generateDescriptionAndEmbedding(uploadResult.secure_url);

      await prisma.video.update({
        where: { id: asset.id },
        data: {
          aiDescription: aiResult.description,
          embedding: JSON.stringify(aiResult.embedding),
        },
      });
    } catch (indexingError) {
      if (isAIProviderUnavailableError(indexingError)) {
        console.warn("[ImageUpload] indexing skipped because AI provider is unavailable.");
      } else {
        console.error("[ImageUpload] indexing error:", indexingError);
      }
    }

    return NextResponse.json(
      {
        assetId: asset.id,
        public_id: uploadResult.public_id,
        imageUrl: uploadResult.secure_url,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[ImageUpload] error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload image",
      },
      { status: 500 },
    );
  }
}
