import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const { sessionId } = await auth();
    if (!sessionId) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

