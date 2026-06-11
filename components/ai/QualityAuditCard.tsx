"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeModal from "@/components/ui/UpgradeModal";

interface AuditPayload {
  overallScore: number;
  composition?: number;
  brightness?: string;
  blur?: string;
  platformSuitability?: {
    instagram: boolean;
    linkedin: boolean;
    twitter: boolean;
  };
  topIssue?: string;
  tip?: string;
}

interface QualityAuditCardProps {
  assetId: string;
  imageUrl: string;
}

function getScoreClasses(score: number) {
  if (score >= 8) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  if (score >= 5) {
    return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  }

  return "bg-red-500/15 text-red-300 border-red-500/30";
}

export default function QualityAuditCard({
  assetId,
  imageUrl,
}: QualityAuditCardProps) {
  const [audit, setAudit] = useState<AuditPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrialLocked, setIsTrialLocked] = useState(false);

  const loadAudit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsTrialLocked(false);

    try {
      const response = await fetch("/api/ai/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId,
          imageUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error === "TRIAL_EXHAUSTED") {
          setIsTrialLocked(true);
          return;
        }

        throw new Error(
          data.message || data.error || "Could not audit the image.",
        );
      }

      setAudit(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not audit the image.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [assetId, imageUrl]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Quality Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-28 bg-white/10" />
          <Skeleton className="h-20 w-full bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  if (isTrialLocked) {
    return (
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Quality Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-neutral-400">
            You&apos;ve used your free trial for quality audits. Upgrade to keep
            scoring every upload.
          </p>
          <Button
            type="button"
            onClick={() => setIsTrialLocked(true)}
            className="bg-white text-black hover:bg-neutral-200"
          >
            View upgrade options
          </Button>
        </CardContent>
        <UpgradeModal
          open={isTrialLocked}
          featureName="Quality Audit"
          onOpenChange={setIsTrialLocked}
        />
      </Card>
    );
  }

  if (error || !audit) {
    return (
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Quality Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-400">
            {error || "Could not audit the image."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadAudit()}
            className="border-white/15 bg-transparent text-white hover:bg-white/10"
          >
            <RefreshCcw className="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const score = audit.overallScore ?? 0;

  return (
    <>
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Quality Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getScoreClasses(
              score,
            )}`}
          >
            Score {score}/10
          </div>

          {audit.platformSuitability ? (
            <div className="grid gap-2 text-sm text-neutral-300">
              <p>Instagram: {audit.platformSuitability.instagram ? "Yes" : "No"}</p>
              <p>LinkedIn: {audit.platformSuitability.linkedin ? "Yes" : "No"}</p>
              <p>Twitter: {audit.platformSuitability.twitter ? "Yes" : "No"}</p>
            </div>
          ) : null}

          {score < 8 && audit.topIssue ? (
            <p className="text-sm text-neutral-300">{audit.topIssue}</p>
          ) : null}

          {audit.tip ? (
            <p className="text-sm italic text-neutral-400">{audit.tip}</p>
          ) : null}
        </CardContent>
      </Card>

      <UpgradeModal
        open={isTrialLocked}
        featureName="Quality Audit"
        onOpenChange={setIsTrialLocked}
      />
    </>
  );
}
