"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeModal from "@/components/ui/UpgradeModal";

type CaptionTab = "instagram" | "linkedin" | "twitter";

interface CaptionPayload {
  instagram: string;
  linkedin: string;
  twitter: string;
  hashtags: {
    high: string[];
    medium: string[];
    niche: string[];
  };
}

interface CaptionPanelProps {
  assetId: string;
  imageUrl: string;
}

export default function CaptionPanel({ assetId, imageUrl }: CaptionPanelProps) {
  const [activeTab, setActiveTab] = useState<CaptionTab>("instagram");
  const [captions, setCaptions] = useState<CaptionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrialLocked, setIsTrialLocked] = useState(false);

  const activeCaption = useMemo(
    () => captions?.[activeTab] ?? "",
    [activeTab, captions],
  );

  const loadCaptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsTrialLocked(false);

    try {
      const response = await fetch("/api/ai/captions", {
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
          data.message || data.error || "Could not generate captions.",
        );
      }

      setCaptions(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not generate captions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [assetId, imageUrl]);

  useEffect(() => {
    void loadCaptions();
  }, [loadCaptions]);

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">AI Captions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  if (isTrialLocked) {
    return (
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">AI Captions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-neutral-400">
            You&apos;ve used your free trial for AI captions. Upgrade to keep
            generating platform-ready copy.
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
          featureName="AI Captions"
          onOpenChange={setIsTrialLocked}
        />
      </Card>
    );
  }

  if (error || !captions) {
    return (
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">AI Captions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-400">
            {error || "Could not generate captions."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCaptions()}
            className="border-white/15 bg-transparent text-white hover:bg-white/10"
          >
            <RefreshCcw className="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">AI Captions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {(["instagram", "linkedin", "twitter"] as CaptionTab[]).map((tab) => (
              <Button
                key={tab}
                type="button"
                variant={activeTab === tab ? "default" : "outline"}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "border-white/15 bg-transparent text-white hover:bg-white/10"
                }
              >
                {tab}
              </Button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold capitalize text-white">
                {activeTab} caption
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void copyText(activeCaption)}
                className="border-white/15 bg-transparent text-white hover:bg-white/10"
              >
                <Copy className="mr-2 size-4" />
                Copy
              </Button>
            </div>
            <p className="text-sm leading-6 text-neutral-300">{activeCaption}</p>
          </div>

          <div className="grid gap-3">
            {[
              { key: "high", label: "High Reach" },
              { key: "medium", label: "Medium" },
              { key: "niche", label: "Niche" },
            ].map((group) => {
              const tags = captions.hashtags[group.key as keyof CaptionPayload["hashtags"]];
              return (
                <div
                  key={group.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{group.label}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void copyText(tags.join(" "))}
                      className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    >
                      <Copy className="mr-2 size-4" />
                      Copy all
                    </Button>
                  </div>
                  <p className="text-sm leading-6 text-neutral-300">
                    {tags.join(" ")}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        open={isTrialLocked}
        featureName="AI Captions"
        onOpenChange={setIsTrialLocked}
      />
    </>
  );
}
