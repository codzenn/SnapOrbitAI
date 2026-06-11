"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ImagePlus, Maximize, Sparkles } from "lucide-react";
import BeforeAfterSlider from "@/components/media/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeModal from "@/components/ui/UpgradeModal";

const PRESETS = [
  { label: "1:1 (Square)", ratio: "1:1" },
  { label: "16:9 (Landscape)", ratio: "16:9" },
  { label: "9:16 (Portrait)", ratio: "9:16" },
  { label: "4:5 (Instagram)", ratio: "4:5" },
];

function getCloudinaryImageUrl(publicId: string, transformation?: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return "";
  }

  const parts = ["https://res.cloudinary.com", cloudName, "image", "upload"];
  if (transformation) {
    parts.push(transformation);
  }
  parts.push(publicId);

  return parts.join("/");
}

export default function AIGenExpand() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTrialLocked, setIsTrialLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const originalUrl = useMemo(
    () =>
      uploadedImage
        ? getCloudinaryImageUrl(uploadedImage, "f_auto,q_auto")
        : "",
    [uploadedImage],
  );

  const [expandedUrl, setExpandedUrl] = useState("");

  const preloadImage = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const previewImage = new window.Image();
      previewImage.onload = () => resolve();
      previewImage.onerror = () =>
        reject(new Error("AI could not finish the image expansion preview."));
      previewImage.src = src;
    });
  }, []);

  const loadExpandedPreview = useCallback(async () => {
    if (!uploadedImage) {
      setExpandedUrl("");
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setIsTrialLocked(false);

    try {
      const response = await fetch("/api/transform/gen-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId: uploadedImage,
          aspectRatio: selectedRatio,
          consume: false,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error === "TRIAL_EXHAUSTED") {
          setExpandedUrl("");
          setIsTrialLocked(true);
          return;
        }

        throw new Error(data.error || "Generative fill failed.");
      }

      const nextUrl = data.url || "";
      if (!nextUrl) {
        throw new Error("Generative fill preview is unavailable.");
      }

      await preloadImage(nextUrl);
      setExpandedUrl(nextUrl);
    } catch (previewError) {
      setExpandedUrl("");
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Generative fill failed.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [preloadImage, selectedRatio, uploadedImage]);

  useEffect(() => {
    void loadExpandedPreview();
  }, [loadExpandedPreview]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);
    setError(null);
    setUploadedImage(null);
    setExpandedUrl("");
    setIsTrialLocked(false);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setUploadedImage(data.public_id);
      setSelectedRatio("16:9");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!uploadedImage || !expandedUrl) {
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const transformResponse = await fetch("/api/transform/gen-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId: uploadedImage,
          aspectRatio: selectedRatio,
          consume: true,
        }),
      });
      const transformData = await transformResponse.json();

      if (!transformResponse.ok) {
        if (transformData.error === "TRIAL_EXHAUSTED") {
          setExpandedUrl("");
          setIsTrialLocked(true);
          return;
        }

        throw new Error(
          transformData.error || "Failed to prepare the expanded image.",
        );
      }

      const response = await fetch(transformData.url);
      if (!response.ok) {
        throw new Error("Failed to download the expanded image.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `expanded-${selectedRatio.replace(":", "x")}-${fileName || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download the expanded image.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const showSkeleton = isUploading || isGenerating;

  return (
    <>
      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Generative Fill & Expand
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-400">
              Expand an image to a new aspect ratio, compare the original against
              the generated result, and download the finished asset.
            </p>
          </div>

          <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
            <CardContent className="p-6">
              {showSkeleton ? (
                <div className="space-y-4">
                  <Skeleton className="h-[360px] w-full rounded-2xl bg-white/10" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-52 bg-white/10" />
                    <Skeleton className="h-4 w-80 bg-white/10" />
                  </div>
                  <p className="text-sm text-neutral-400">
                    AI is expanding your image...
                  </p>
                </div>
              ) : uploadedImage && originalUrl && expandedUrl ? (
                <BeforeAfterSlider
                  beforeSrc={originalUrl}
                  afterSrc={expandedUrl}
                  beforeAlt="Original upload"
                  afterAlt="Expanded image result"
                />
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 text-center">
                  <Maximize className="mb-4 size-12 text-neutral-600" />
                  <p className="text-lg font-semibold text-white">
                    Upload an image to expand it
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
                    Pick one of the aspect ratio presets and the generated result
                    appears here with a before and after slider.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-white">
                  <ImagePlus className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Upload and expand</CardTitle>
                  <CardDescription className="mt-1 text-neutral-400">
                    Aspect ratio presets update the generated preview instantly.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="expand-image" className="text-neutral-200">
                  Image file
                </Label>
                <Input
                  id="expand-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading || isDownloading}
                  className="border-white/10 bg-white/5 text-white file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
                />
              </div>

              {fileName ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  <p className="font-semibold text-white">Selected file</p>
                  <p className="mt-1 break-all text-neutral-400">{fileName}</p>
                </div>
              ) : null}

              <div className="space-y-3">
                <Label className="text-neutral-200">Aspect ratio presets</Label>
                <div className="grid gap-2">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.ratio}
                      type="button"
                      variant={selectedRatio === preset.ratio ? "default" : "outline"}
                      onClick={() => setSelectedRatio(preset.ratio)}
                      disabled={!uploadedImage || isUploading || isGenerating}
                      className={
                        selectedRatio === preset.ratio
                          ? "justify-start bg-white text-black hover:bg-neutral-200"
                          : "justify-start border-white/15 bg-transparent text-white hover:bg-white/10"
                      }
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-green-400">
                  <Sparkles className="size-4" />
                  <p className="font-semibold text-white">What happens next</p>
                </div>
                <p className="text-sm leading-6 text-neutral-400">
                  Cloudinary generative fill extends the image edges to match the
                  selected ratio while keeping the main subject centered.
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              ) : null}

              <Button
                onClick={handleDownload}
                disabled={!expandedUrl || showSkeleton || isDownloading}
                className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
              >
                <Download className="mr-2 size-4" />
                {isDownloading ? "Preparing download..." : "Download expanded image"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <UpgradeModal
        open={isTrialLocked}
        featureName="Generative Fill"
        onOpenChange={setIsTrialLocked}
      />
    </>
  );
}
