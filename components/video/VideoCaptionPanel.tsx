"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeModal from "@/components/ui/UpgradeModal";

type CaptionTab = "instagram" | "linkedin" | "twitter";
type AppPlan = "free" | "pro" | "business";

interface VideoCaptionPayload {
  instagram: string;
  linkedin: string;
  twitter: string;
  hashtags: {
    high: string[];
    medium: string[];
    niche: string[];
  };
  audioUsed: boolean;
}

interface VideoCaptionPanelProps {
  videoUrl: string;
  videoId: string;
  mimeType?: string;
}

const LOADING_MESSAGES = [
  "Uploading video to Gemini...",
  "Gemini is watching your video...",
  "Almost done - writing platform-ready captions...",
];

export default function VideoCaptionPanel({
  videoUrl,
  videoId,
  mimeType = "video/mp4",
}: VideoCaptionPanelProps) {
  const [activeTab, setActiveTab] = useState<CaptionTab>("instagram");
  const [captions, setCaptions] = useState<VideoCaptionPayload | null>(null);
  const [currentPlan, setCurrentPlan] = useState<AppPlan>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrialLocked, setIsTrialLocked] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  const activeCaption = useMemo(
    () => captions?.[activeTab] ?? "",
    [activeTab, captions],
  );
  const canRefreshCaptions = currentPlan !== "free";

  useEffect(() => {
    let isMounted = true;

    fetch("/api/subscription/current")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { plan?: AppPlan } | null) => {
        if (!isMounted || !data?.plan) {
          return;
        }

        setCurrentPlan(data.plan);
      })
      .catch(() => {
        if (isMounted) {
          setCurrentPlan("free");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const loadCaptions = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    setIsTrialLocked(false);

    if (forceRefresh) {
      setCaptions(null);
    }

    try {
      const response = await fetch("/api/video/captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          videoId,
          mimeType,
          forceRefresh,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error === "TRIAL_EXHAUSTED" || data.error === "PAID_PLAN_REQUIRED") {
          setIsTrialLocked(true);
          return;
        }

        throw new Error(
          data.message || data.error || "Could not generate video captions.",
        );
      }

      setCaptions(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not generate video captions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [mimeType, videoId, videoUrl]);

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
          <CardTitle className="text-lg">Video Captions</CardTitle>
          <CardDescription className="text-neutral-400">
            {LOADING_MESSAGES[messageIndex]} This takes 15-30 seconds.
          </CardDescription>
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
      <>
        <Card className="border-white/10 bg-black/40 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Video Captions</CardTitle>
            <CardDescription className="text-neutral-400">
              Audio-aware captions are available on paid plans after the free
              video caption trial is used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-neutral-400">
              You&apos;ve used your free trial for video captions. Upgrade to
              keep generating platform-ready copy from full video context.
            </p>
            <Button
              type="button"
              onClick={() => setIsTrialLocked(true)}
              className="bg-white text-black hover:bg-neutral-200"
            >
              View upgrade options
            </Button>
          </CardContent>
        </Card>
        <UpgradeModal
          open={isTrialLocked}
          featureName="Video Captions"
          onOpenChange={setIsTrialLocked}
        />
      </>
    );
  }

  if (error || !captions) {
    return (
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Video Captions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-400">
            {error || "Could not generate video captions."}
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
          <CardTitle className="text-lg">Video Captions</CardTitle>
          <CardDescription className="text-neutral-400">
            Captions reference what Gemini sees and hears in the video, not a
            single thumbnail.
          </CardDescription>
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
            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-neutral-300">
              {captions.audioUsed
                ? "Based on video audio + visuals"
                : "Based on visuals only (no speech detected)"}
            </div>
          </div>

          <div className="grid gap-3">
            {[
              { key: "high", label: "High Reach" },
              { key: "medium", label: "Medium" },
              { key: "niche", label: "Niche" },
            ].map((group) => {
              const tags = captions.hashtags[group.key as keyof VideoCaptionPayload["hashtags"]];
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

          {canRefreshCaptions ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadCaptions(true)}
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
            >
              <RefreshCcw className="mr-2 size-4" />
              Refresh captions
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <UpgradeModal
        open={isTrialLocked}
        featureName="Video Captions"
        onOpenChange={setIsTrialLocked}
      />
    </>
  );
}
