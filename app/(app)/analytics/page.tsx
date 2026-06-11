import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/trial";
import UsageDashboard from "@/components/analytics/UsageDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FEATURE_LABELS: Record<string, string> = {
  "bg-remove": "Background Removal",
  "gen-fill": "Gen Fill",
  captions: "Captions",
  audit: "Audit",
  batch: "Batch",
  search: "Search",
};

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const plan = await getUserPlan(userId);

  if (plan !== "business") {
    return (
      <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Usage analytics</CardTitle>
          <CardDescription className="text-neutral-400">
            Usage analytics is available on the Business plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="bg-white text-black hover:bg-neutral-200">
            <Link href="/pricing">Upgrade to Business</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const [assets, usageRows, subscription] = await Promise.all([
    prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trialUsage.findMany({
      where: { userId },
    }),
    prisma.subscription.findUnique({
      where: { userId },
    }),
  ]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const assetsThisMonth = assets.filter((asset) => {
    const createdAt = new Date(asset.createdAt);
    return (
      createdAt.getMonth() === currentMonth &&
      createdAt.getFullYear() === currentYear
    );
  });

  const usageMap = new Map<string, number>();
  for (const usageRow of usageRows) {
    usageMap.set(usageRow.feature, (usageMap.get(usageRow.feature) ?? 0) + usageRow.count);
  }

  usageMap.set(
    "captions",
    Math.max(
      usageMap.get("captions") ?? 0,
      assetsThisMonth.filter((asset) => asset.aiCaptions !== null).length,
    ),
  );
  usageMap.set(
    "audit",
    Math.max(
      usageMap.get("audit") ?? 0,
      assetsThisMonth.filter((asset) => asset.qualityScore !== null).length,
    ),
  );

  const chartData = Object.entries(FEATURE_LABELS).map(([key, label]) => ({
    feature: label,
    count: usageMap.get(key) ?? 0,
  }));

  const totals = {
    totalAssets: assets.length,
    storageUsed: assets.reduce(
      (sum, asset) => sum + Number(asset.compressedSize || 0),
      0,
    ),
    captionsGenerated: assets.filter((asset) => asset.aiCaptions !== null).length,
    auditsRun: assets.filter((asset) => asset.qualityScore !== null).length,
  };

  return (
    <UsageDashboard
      totals={totals}
      chartData={chartData}
      currentPeriodEnd={subscription?.currentPeriodEnd.toISOString() ?? null}
    />
  );
}
