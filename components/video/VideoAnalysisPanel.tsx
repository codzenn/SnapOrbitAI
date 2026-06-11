"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeModal from "@/components/ui/UpgradeModal";

interface Scene {
  timestamp: string;
  description: string;
}

export interface VideoAnalysisResult {
  summary: string;
  scenes: Scene[];
  mood: string;
  topics: string[];
  hasAudio: boolean;
  keyQuotes: string[];
}

interface VideoAnalysisPanelProps {
  videoUrl: string;
  videoId: string;
  mimeType?: string;
  cachedAnalysis?: VideoAnalysisResult | null;
  onSeek: (seconds: number) => void;
}

const LOADING_MESSAGES = [
  "Uploading video to Gemini...",
  "Gemini is watching your video...",
  "Almost done - generating scene breakdown...",
];

function timestampToSeconds(timestamp: string) {
  const [minutes = "0", seconds = "0"] = timestamp.split(":");
  return Number(minutes) * 60 + Number(seconds);
}

export default function VideoAnalysisPanel({
  videoUrl,
  videoId,
  mimeType = "video/mp4",
  cachedAnalysis = null,
  onSeek,
}: VideoAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(cachedAnalysis);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    setAnalysis(cachedAnalysis);
  }, [cachedAnalysis]);

  const loadingMessage = useMemo(
    () => LOADING_MESSAGES[messageIndex] ?? LOADING_MESSAGES[0],
    [messageIndex],
  );

  const analyze = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    setIsTrialLocked(false);

    if (forceRefresh) {
      setAnalysis(null);
    }

    try {
      const response = await fetch("/api/video/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          videoId,
          mimeType,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error === "TRIAL_EXHAUSTED") {
          setIsTrialLocked(true);
          return;
        }

        throw new Error(data.error || "Analysis failed. Please try again.");
      }

      setAnalysis(data);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Video Analysis</CardTitle>
          <CardDescription className="text-neutral-400">
            {loadingMessage} This takes 15-30 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-10 w-1/2 rounded-xl bg-white/10" />
          <Skeleton className="h-28 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-28 w-full rounded-2xl bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <>
        <Card className="border-white/10 bg-black/40 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Video Analysis</CardTitle>
            <CardDescription className="text-neutral-400">
              Gemini watches the full video, including speech and audio, then
              returns a summary, scene timeline, mood, and key topics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : null}
            {isTrialLocked ? (
              <p className="text-sm leading-6 text-neutral-400">
                You&apos;ve used your free trial for video analysis. Upgrade to
                keep generating scene breakdowns and summaries.
              </p>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-neutral-300">
                Scene timestamps are clickable and jump the player to the exact
                moment Gemini referenced.
              </div>
            )}
            <Button
              type="button"
              onClick={() => void analyze()}
              disabled={isTrialLocked}
              className="bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
            >
              <Sparkles className="mr-2 size-4" />
              Analyze Video
            </Button>
          </CardContent>
        </Card>
        <UpgradeModal
          open={isTrialLocked}
          featureName="Video Analysis"
          onOpenChange={setIsTrialLocked}
        />
      </>
    );
  }

  return (
    <>
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Video Analysis</CardTitle>
              <CardDescription className="mt-1 text-neutral-400">
                Cached for this video and reused on future visits.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void analyze(true)}
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
            >
              <RefreshCcw className="mr-2 size-4" />
              Re-run
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Summary
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-200">
              {analysis.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium capitalize text-white">
                {analysis.mood}
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                {analysis.hasAudio ? "Has audio" : "No speech detected"}
              </span>
            </div>
          </div>

          {analysis.topics.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Topics
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {analysis.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-neutral-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {analysis.keyQuotes.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Key Quotes
              </p>
              <div className="mt-3 space-y-2">
                {analysis.keyQuotes.map((quote) => (
                  <p key={quote} className="text-sm italic leading-6 text-neutral-300">
                    "{quote}"
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Scene Breakdown
            </p>
            <div className="mt-4 space-y-3">
              {analysis.scenes.map((scene) => (
                <button
                  key={`${scene.timestamp}-${scene.description}`}
                  type="button"
                  onClick={() => onSeek(timestampToSeconds(scene.timestamp))}
                  className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-left transition hover:bg-white/5"
                >
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                    {scene.timestamp}
                  </span>
                  <span className="text-sm leading-6 text-neutral-300">
                    {scene.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        open={isTrialLocked}
        featureName="Video Analysis"
        onOpenChange={setIsTrialLocked}
      />
    </>
  );
}
