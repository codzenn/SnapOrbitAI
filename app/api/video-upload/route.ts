import { NextResponse, NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateVideo, uploadToCloudinaryWithRetry, VideoProcessingError } from "@/lib/video-pipeline";

const GUEST_VIDEO_COOKIE = "guest_video_upload_count";
const GUEST_VIDEO_LIMIT = 3;

const PLAN_LIMITS = {
  free: 5,
  pro: 100,
  pro_plus: Infinity,
};

export async function POST(request: NextRequest) {
  const reqId = crypto.randomUUID();
  logger.info("Incoming video upload request", { reqId });

  try {
    // 1. IP-based Rate Limiting (Global DDOS protection)
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    const rlResult = checkRateLimit(`ip:${ip}`, 10, 60000); // 10 requests per minute
    if (!rlResult.success) {
      logger.warn("Rate limit exceeded", { reqId, ip });
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { userId } = await auth();
    const guestUploadCount = Number(request.cookies.get(GUEST_VIDEO_COOKIE)?.value ?? "0");

    // 2. Authorization & Quota Checks
    if (!userId && guestUploadCount >= GUEST_VIDEO_LIMIT) {
      logger.info("Guest limit reached", { reqId, guestUploadCount });
      return NextResponse.json({ error: "Free guest video limit reached. Sign in to process more." }, { status: 403 });
    }

    let client;
    let user;
    let plan = "free";

    if (userId) {
      client = await clerkClient();
      user = await client.users.getUser(userId);
      plan = (user.publicMetadata?.plan as string) || "free";

      const currentMonth = new Date().toISOString().slice(0, 7);
      const userMeta = user.privateMetadata || {};
      let videoCount = (userMeta.videoCount as number) || 0;

      if (userMeta.quotaMonth !== currentMonth) {
        videoCount = 0; // Reset quota for new month
      }

      const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

      if (videoCount >= limit) {
        logger.info("Monthly quota reached", { reqId, userId, plan, videoCount, limit });
        return NextResponse.json({ error: `Monthly video limit (${limit}) reached for your ${plan} plan. Please upgrade.` }, { status: 403 });
      }
    }

    // 3. Payload Parsing & Validation
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string || "Untitled Reel";
    const description = formData.get("description") as string || "";
    const isReel = formData.get("isReel") === "true";

    if (!file) {
      throw new VideoProcessingError("No video file provided in the request", 400);
    }

    logger.info("Validating video file", { reqId, fileName: file.name, fileSize: file.size, mimeType: file.type });
    await validateVideo(file);

    // 4. Processing & Cloudinary Upload (with Retries)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    logger.info("Starting robust Cloudinary pipeline", { reqId });
    const result = await uploadToCloudinaryWithRetry(buffer, 1, reqId, isReel);

    // 5. Database & Quota Updates
    // If eager transformations succeeded, grab the URL from the result
    let reelUrl = "";
    if (isReel) {
      reelUrl = result.eager?.[0]?.secure_url || `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/c_fill,e_preview:duration_15,f_mp4,g_auto,h_1280,q_auto:eco,w_720/${result.public_id}.mp4`;
    }

    if (!userId) {
      const response = NextResponse.json(
        {
          title,
          description,
          publicId: result.public_id,
          ...(isReel && { reelUrl }),
          originalSize: String(file.size),
          compressedSize: String(result.bytes),
          duration: result.duration || 0,
          guestUploadUsed: true,
        },
        { status: 200 }
      );

      response.cookies.set(GUEST_VIDEO_COOKIE, String(Math.min(guestUploadCount + 1, GUEST_VIDEO_LIMIT)), {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        path: "/",
      });

      logger.info("Guest upload processed successfully", { reqId, publicId: result.public_id });
      return response;
    }

    // Increment authenticated quota
    if (userId && client && user) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const userMeta = user.privateMetadata || {};
      const videoCount = userMeta.quotaMonth === currentMonth ? (userMeta.videoCount as number) || 0 : 0;

      await client.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...userMeta,
          quotaMonth: currentMonth,
          videoCount: videoCount + 1,
        },
      });
    }

    if (isReel) {
      logger.info("Reel extraction processed (not saved to library)", { reqId, publicId: result.public_id });

      return NextResponse.json({
        title,
        description,
        publicId: result.public_id,
        reelUrl,
        originalSize: String(file.size),
        compressedSize: String(result.bytes),
        duration: result.duration || 0,
      });
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        publicId: result.public_id,
        originalSize: String(file.size),
        compressedSize: String(result.bytes),
        duration: result.duration || 0,
      },
    });

    logger.info("Authenticated upload processed and recorded", { reqId, videoId: video.id, publicId: result.public_id });
    return NextResponse.json(video);

  } catch (error: any) {
    if (error instanceof VideoProcessingError) {
      logger.warn("Video processing validation failed", { reqId, error: error.message });
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    
    logger.error("Unexpected error during video upload pipeline", error, { reqId });
    return NextResponse.json({ error: "An unexpected internal server error occurred while processing the video." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
