import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { getAssetLibraryLimit, getUserPlan } from "@/lib/trial";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryVideoUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  duration?: number;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestContentType = request.headers.get("content-type")?.trim() || "";
    const fileNameHeader = request.headers.get("x-file-name");
    const fileSizeHeader = request.headers.get("x-file-size");
    let fileName = "Untitled video";
    let fileSize = 0;
    let mimeType = requestContentType;
    let buffer: Buffer;

    if (requestContentType.startsWith("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      fileName = file.name || fileName;
      fileSize = file.size;
      mimeType = file.type || mimeType;
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      const arrayBuffer = await request.arrayBuffer();

      if (!arrayBuffer.byteLength) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      buffer = Buffer.from(arrayBuffer);
      fileName = fileNameHeader ? decodeURIComponent(fileNameHeader) : fileName;
      fileSize = Number(fileSizeHeader || buffer.length);
    }

    if (!mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video uploads are supported here." },
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

    const uploadResult = await new Promise<CloudinaryVideoUploadResult>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "snaporbit-assets",
              resource_type: "video",
            },
            (error, result) => {
              if (error || !result) {
                reject(error ?? new Error("Cloudinary upload failed."));
                return;
              }

              resolve(result as CloudinaryVideoUploadResult);
            },
          )
          .end(buffer);
      },
    );

    const title = fileName.replace(/\.[^.]+$/, "") || "Untitled video";
    const asset = await prisma.video.create({
      data: {
        title,
        description: null,
        publicId: uploadResult.public_id,
        originalSize: String(fileSize || buffer.length),
        compressedSize: String(uploadResult.bytes || fileSize || buffer.length),
        duration: uploadResult.duration ?? 0,
        userId,
        mediaType: "video",
      },
    });

    return NextResponse.json(
      {
        id: asset.id,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        duration: uploadResult.duration ?? 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[VideoUpload] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload video.",
      },
      { status: 500 },
    );
  }
}
