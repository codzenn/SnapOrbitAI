import { prisma } from "@/lib/prisma";

export const FEATURE_TRIAL_LIMITS = {
  "bg-remove": 1,
  "gen-fill": 1,
  captions: 1,
  audit: 1,
  batch: 1,
  search: 3,
  "video-analyze": 1,
  "video-captions": 1,
  "video-aspect": 1,
} as const;

export type TrialFeature = keyof typeof FEATURE_TRIAL_LIMITS;
export type AppPlan = "free" | "pro" | "business";

export function getAssetLibraryLimit(plan: AppPlan): number | null {
  if (plan === "business") {
    return null;
  }

  if (plan === "pro") {
    return 500;
  }

  return 5;
}

function getTrialLimit(feature: string): number {
  return FEATURE_TRIAL_LIMITS[feature as TrialFeature] ?? 1;
}

export async function getTrialUsageCount(
  userId: string,
  feature: string,
): Promise<number> {
  const record = await prisma.trialUsage.findUnique({
    where: {
      userId_feature: {
        userId,
        feature,
      },
    },
  });

  return record?.count ?? 0;
}

export async function hasUsedTrial(
  userId: string,
  feature: string,
): Promise<boolean> {
  const usageCount = await getTrialUsageCount(userId, feature);
  return usageCount >= getTrialLimit(feature);
}

export async function markTrialUsed(
  userId: string,
  feature: string,
  amount = 1,
): Promise<void> {
  await prisma.trialUsage.upsert({
    where: {
      userId_feature: {
        userId,
        feature,
      },
    },
    create: {
      userId,
      feature,
      count: amount,
    },
    update: {
      count: {
        increment: amount,
      },
    },
  });
}

export async function getWindowedUsageCount(
  userId: string,
  feature: string,
  windowStart: Date,
): Promise<number> {
  const record = await prisma.trialUsage.findUnique({
    where: {
      userId_feature: {
        userId,
        feature,
      },
    },
  });

  if (!record || record.lastUsedAt < windowStart) {
    return 0;
  }

  return record.count;
}

export async function markWindowedUsage(
  userId: string,
  feature: string,
  windowStart: Date,
  amount = 1,
): Promise<void> {
  const existing = await prisma.trialUsage.findUnique({
    where: {
      userId_feature: {
        userId,
        feature,
      },
    },
  });

  if (!existing) {
    await prisma.trialUsage.create({
      data: {
        userId,
        feature,
        count: amount,
      },
    });
    return;
  }

  if (existing.lastUsedAt < windowStart) {
    await prisma.trialUsage.update({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
      data: {
        count: amount,
      },
    });
    return;
  }

  await prisma.trialUsage.update({
    where: {
      userId_feature: {
        userId,
        feature,
      },
    },
    data: {
      count: {
        increment: amount,
      },
    },
  });
}

export async function getUserPlan(userId: string): Promise<AppPlan> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return "free";
  }

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return "free";
  }

  return subscription.plan as AppPlan;
}

export async function getFeatureAccess(
  userId: string,
  feature: string,
): Promise<{
  allowed: boolean;
  plan: AppPlan;
  remainingUses: number | null;
}> {
  const plan = await getUserPlan(userId);

  if (plan !== "free") {
    return {
      allowed: true,
      plan,
      remainingUses: null,
    };
  }

  const limit = getTrialLimit(feature);
  const used = await getTrialUsageCount(userId, feature);

  return {
    allowed: used < limit,
    plan,
    remainingUses: Math.max(limit - used, 0),
  };
}
