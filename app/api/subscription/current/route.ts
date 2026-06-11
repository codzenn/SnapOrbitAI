import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/trial";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ plan: "free" }, { status: 200 });
  }

  const plan = await getUserPlan(userId);
  return NextResponse.json({ plan }, { status: 200 });
}
