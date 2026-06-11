"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { filesize } from "filesize";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const renewalDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface UsageDashboardProps {
  totals: {
    totalAssets: number;
    storageUsed: number;
    captionsGenerated: number;
    auditsRun: number;
  };
  chartData: Array<{
    feature: string;
    count: number;
  }>;
  currentPeriodEnd: string | null;
}

export default function UsageDashboard({
  totals,
  chartData,
  currentPeriodEnd,
}: UsageDashboardProps) {
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const renewalDateLabel = currentPeriodEnd
    ? renewalDateFormatter.format(new Date(currentPeriodEnd))
    : "Unavailable";

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not open the customer portal.");
      }

      const newTab = window.open(data.url, "_blank", "noopener,noreferrer");

      if (!newTab) {
        throw new Error("Popup blocked. Please allow popups and try again.");
      }
    } catch (error) {
      console.error("[UsageDashboard] portal error:", error);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Your Usage
        </h1>
        <p className="text-sm text-neutral-400">
          This month&apos;s activity across all features
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Total Assets Uploaded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totals.totalAssets}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{filesize(totals.storageUsed || 0)}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle>AI Captions Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totals.captionsGenerated}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quality Audits Run</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totals.auditsRun}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Transformations this month</CardTitle>
          <CardDescription className="text-neutral-400">
            Usage split by feature
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="feature" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#09090b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "16px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#ffffff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Storage progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full rounded-full bg-white" />
            </div>
            <p className="text-sm text-neutral-400">
              {filesize(totals.storageUsed || 0)} used of infinity (Business)
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white">
              Business
            </div>
            <p className="text-sm text-neutral-400">
              Renewal date: {renewalDateLabel}
            </p>
            <Button
              type="button"
              onClick={() => void handleManageSubscription()}
              className="bg-white text-black hover:bg-neutral-200"
            >
              {isOpeningPortal ? "Opening portal..." : "Manage subscription"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
