"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { UserPlan } from "./plans";

function parsePlan(value: unknown): UserPlan {
  if (value === "pro") return "pro";
  if (value === "pro_plus") return "pro_plus";
  return "free";
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return parsePlan(user.publicMetadata?.plan);
}

export async function isUserPro(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === "pro" || plan === "pro_plus";
}

export async function isUserProPlus(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === "pro_plus";
}
