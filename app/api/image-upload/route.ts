import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth, clerkClient } from "@clerk/nextjs/server";

//Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  [key: string]: unknown;
}

const GUEST_IMAGE_COOKIE = "guest_image_upload_count";
const GUEST_IMAGE_LIMIT = 3;

const PLAN_LIMITS = {
  free: 5,
  pro: 100,
  pro_plus: Infinity,
};

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const guestUploadCount = Number(
    request.cookies.get(GUEST_IMAGE_COOKIE)?.value ?? "0",
  );

  // Guest check
  if (!userId && guestUploadCount >= GUEST_IMAGE_LIMIT) {
    return NextResponse.json(
      {
        error: "Free guest image limit reached. Sign in to process more.",
      },
      { status: 403 },
    );
  }

  let client;
  let user;
  let plan = "free";

  // Authenticated user check
  if (userId) {
    client = await clerkClient();
    user = await client.users.getUser(userId);
    plan = (user.publicMetadata?.plan as string) || "free";

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. 2026-04
    const userMeta = user.privateMetadata || {};

    const quotaMonth = userMeta.quotaMonth as string;
    let imageCount = (userMeta.imageCount as number) || 0;

    if (quotaMonth !== currentMonth) {
      // Reset quota for new month
      imageCount = 0;
    }

    const limit =
      PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    if (imageCount >= limit) {
      return NextResponse.json(
        {
          error: `Monthly image limit (${limit}) reached for your ${plan} plan. Please upgrade.`,
        },
        { status: 403 },
      );
    }
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "next-cloudinary-uploads",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result as CloudinaryUploadResult);
              }
            },
          )
          .end(buffer);
      },
    );

    if (!userId) {
      const response = NextResponse.json(
        {
          public_id: result.public_id,
          guestUploadUsed: true,
        },
        { status: 200 },
      );

      response.cookies.set(
        GUEST_IMAGE_COOKIE,
        String(Math.min(guestUploadCount + 1, GUEST_IMAGE_LIMIT)),
        {
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
          path: "/",
        },
      );

      return response;
    }

    // Increment authenticated quota
    if (userId && client && user) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const userMeta = user.privateMetadata || {};
      const imageCount =
        userMeta.quotaMonth === currentMonth
          ? (userMeta.imageCount as number) || 0
          : 0;

      await client.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...userMeta,
          quotaMonth: currentMonth,
          imageCount: imageCount + 1,
        },
      });
    }

    return NextResponse.json({ public_id: result.public_id }, { status: 200 });
  } catch (error) {
    console.error(
      "Upload image failed:",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
