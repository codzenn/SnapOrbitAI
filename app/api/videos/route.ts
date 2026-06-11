import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const videos = await prisma.video.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(videos);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}
