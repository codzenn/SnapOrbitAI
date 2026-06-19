"use client";

import { useMemo, useState } from "react";
import { filesize } from "filesize";
import { ArrowRightLeft, Download, RefreshCcw, ScissorsSquareDashedBottom, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UpgradeModal from "@/components/ui/UpgradeModal";

interface VideoConverterPanelProps {
  videoUrl: string;
  videoId: string;
  cloudinaryPublicId: string;
  originalSizeBytes?: number;
}

interface VideoConversionResponse {
  url?: string;
  downloadUrl?: string;
  message?: string;
  error?: string;
}

async function getRemoteFileSize(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    return contentLength ? Number(contentLength) : null;
  } catch {
    return null;
  }
}

async function downloadRemoteFile(url: string, filename: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Download failed.");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export default function VideoConverterPanel({
  videoUrl,
  videoId,
  cloudinaryPublicId,
  originalSizeBytes,
}: VideoConverterPanelProps) {
  const [activeConverter, setActiveConverter] = useState<"compress" | "aspect">(
    "compress",
  );
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");
  const [quality, setQuality] = useState<"auto" | "80" | "60" | "40">("auto");
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedDownloadUrl, setCompressedDownloadUrl] = useState<string | null>(null);
  const [compressedSizeBytes, setCompressedSizeBytes] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [portraitDownloadUrl, setPortraitDownloadUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTrialLocked, setIsTrialLocked] = useState(false);

  const savingsLabel = useMemo(() => {
    if (!originalSizeBytes || !compressedSizeBytes || compressedSizeBytes >= originalSizeBytes) {
      return null;
    }

    const savedBytes = originalSizeBytes - compressedSizeBytes;
    const percent = Math.round((savedBytes / originalSizeBytes) * 100);
    return `${filesize(savedBytes)} saved (${percent}% smaller)`;
  }, [compressedSizeBytes, originalSizeBytes]);

  const runCompression = async () => {
    setIsCompressing(true);
    setError(null);
    setCompressedUrl(null);
    setCompressedDownloadUrl(null);
    setCompressedSizeBytes(null);

    try {
      const response = await fetch("/api/video/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId: cloudinaryPublicId,
          videoId,
          operation: "compress",
          format,
          quality,
        }),
      });
      const data = (await response.json()) as VideoConversionResponse;

      if (!response.ok) {
        throw new Error(data.message || data.error || "Compression failed.");
      }

      if (!data.url) {
        throw new Error("Compression finished without a playable video URL.");
      }

      setCompressedUrl(data.url);
      setCompressedDownloadUrl(data.downloadUrl ?? data.url);
      setCompressedSizeBytes(await getRemoteFileSize(data.url));
    } catch (compressionError) {
      setError(
        compressionError instanceof Error
          ? compressionError.message
          : "Compression failed.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const runAspectRatioConversion = async () => {
    setIsConverting(true);
    setError(null);
    setIsTrialLocked(false);
    setPortraitUrl(null);
    setPortraitDownloadUrl(null);

    try {
      const response = await fetch("/api/video/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId: cloudinaryPublicId,
          videoId,
          operation: "aspect-ratio",
        }),
      });
      const data = (await response.json()) as VideoConversionResponse;

      if (!response.ok) {
        if (data.error === "TRIAL_EXHAUSTED" || data.error === "PLAN_LIMIT_REACHED") {
          setError(data.message || null);
          setIsTrialLocked(true);
          return;
        }

        throw new Error(data.message || data.error || "Aspect ratio conversion failed.");
      }

      if (!data.url) {
        throw new Error("Conversion finished without a playable video URL.");
      }

      setPortraitUrl(data.url);
      setPortraitDownloadUrl(data.downloadUrl ?? data.url);
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "Aspect ratio conversion failed.",
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    setError(null);

    try {
      await downloadRemoteFile(url, filename);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Video Converter</CardTitle>
          <CardDescription className="text-neutral-400">
            Compress videos for delivery or convert landscape footage into a
            portrait version for Reels and TikTok.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={activeConverter === "compress" ? "default" : "outline"}
              onClick={() => setActiveConverter("compress")}
              className={
                activeConverter === "compress"
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "border-white/15 bg-transparent text-white hover:bg-white/10"
              }
            >
              <ScissorsSquareDashedBottom className="mr-2 size-4" />
              Compress
            </Button>
            <Button
              type="button"
              variant={activeConverter === "aspect" ? "default" : "outline"}
              onClick={() => setActiveConverter("aspect")}
              className={
                activeConverter === "aspect"
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "border-white/15 bg-transparent text-white hover:bg-white/10"
              }
            >
              <ArrowRightLeft className="mr-2 size-4" />
              Landscape to Portrait
            </Button>
          </div>

          {activeConverter === "compress" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-neutral-300">
                  <span className="block font-medium text-white">Format</span>
                  <select
                    value={format}
                    onChange={(event) => setFormat(event.target.value as "mp4" | "webm")}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="mp4" className="bg-zinc-950 text-white">
                      MP4
                    </option>
                    <option value="webm" className="bg-zinc-950 text-white">
                      WebM
                    </option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-neutral-300">
                  <span className="block font-medium text-white">Quality</span>
                  <select
                    value={quality}
                    onChange={(event) =>
                      setQuality(event.target.value as "auto" | "80" | "60" | "40")
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="auto" className="bg-zinc-950 text-white">
                      Auto
                    </option>
                    <option value="80" className="bg-zinc-950 text-white">
                      High
                    </option>
                    <option value="60" className="bg-zinc-950 text-white">
                      Medium
                    </option>
                    <option value="40" className="bg-zinc-950 text-white">
                      Low
                    </option>
                  </select>
                </label>
              </div>

              <Button
                type="button"
                onClick={() => void runCompression()}
                disabled={isCompressing}
                className="bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
              >
                {isCompressing ? "Compressing..." : "Compress Video"}
              </Button>

              {compressedUrl ? (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <video src={compressedUrl} controls className="w-full rounded-2xl bg-black" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Original
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {originalSizeBytes ? filesize(originalSizeBytes) : "Unavailable"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Compressed
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {compressedSizeBytes ? filesize(compressedSizeBytes) : "Preview ready"}
                      </p>
                      {savingsLabel ? (
                        <p className="mt-1 text-xs text-emerald-300">{savingsLabel}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      void handleDownload(
                        compressedDownloadUrl ?? compressedUrl,
                        `snaporbit-compressed.${format}`,
                      )
                    }
                    className="bg-white text-black hover:bg-neutral-200"
                  >
                    <Download className="mr-2 size-4" />
                    Download compressed video
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeConverter === "aspect" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-neutral-300">
                One free aspect-ratio conversion is included on Free. Pro gets
                50 per month, and Business is unlimited.
              </div>

              <Button
                type="button"
                onClick={() => void runAspectRatioConversion()}
                disabled={isConverting}
                className="bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
              >
                {isConverting ? "Converting..." : "Convert to 9:16 Portrait"}
              </Button>

              {portraitUrl ? (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-medium text-neutral-300">Original</p>
                      <video src={videoUrl} controls className="w-full rounded-2xl bg-black" />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium text-white">Portrait 9:16</p>
                      <video src={portraitUrl} controls className="w-full rounded-2xl bg-black" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={() =>
                        void handleDownload(
                          portraitDownloadUrl ?? portraitUrl,
                          "snaporbit-portrait.mp4",
                        )
                      }
                      className="bg-white text-black hover:bg-neutral-200"
                    >
                      <Download className="mr-2 size-4" />
                      Download portrait video
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void runAspectRatioConversion()}
                      className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    >
                      <RefreshCcw className="mr-2 size-4" />
                      Rebuild
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {!compressedUrl && !portraitUrl ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm leading-6 text-neutral-500">
              <div className="flex items-center gap-2 text-neutral-300">
                <Video className="size-4" />
                Cloudinary transformations render on demand, so conversion is
                fast and does not duplicate the original upload in your library.
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <UpgradeModal
        open={isTrialLocked}
        featureName="Video Aspect Ratio Conversion"
        onOpenChange={setIsTrialLocked}
      />
    </>
  );
}
