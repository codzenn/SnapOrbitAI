"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eraser, ImagePlus, Sparkles } from "lucide-react";
import BeforeAfterSlider from "@/components/media/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeModal from "@/components/ui/UpgradeModal";

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

export default function AIBGRemoval() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const [processedUrl, setProcessedUrl] = useState("");

  const preloadImage = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const previewImage = new window.Image();
      previewImage.onload = () => resolve();
      previewImage.onerror = () =>
        reject(
          new Error("Cloudinary could not finish the background removal preview."),
        );
      previewImage.src = src;
    });
  }, []);

  const loadRemovedBackgroundPreview = useCallback(async () => {
    if (!uploadedImage) {
      setProcessedUrl("");
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsTrialLocked(false);

    try {
      const response = await fetch("/api/transform/bg-remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId: uploadedImage,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error === "TRIAL_EXHAUSTED") {
          setProcessedUrl("");
          setIsTrialLocked(true);
          return;
        }

        throw new Error(data.error || "Background removal failed.");
      }

      const nextUrl = data.url || "";
      if (!nextUrl) {
        throw new Error("Background removal preview is unavailable.");
      }

      await preloadImage(nextUrl);
      setProcessedUrl(nextUrl);
    } catch (previewError) {
      setProcessedUrl("");
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Background removal failed.",
      );
    } finally {
      setIsProcessing(false);
    }
  }, [preloadImage, uploadedImage]);

  useEffect(() => {
    void loadRemovedBackgroundPreview();
  }, [loadRemovedBackgroundPreview]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name);
    setError(null);
    setUploadedImage(null);
    setProcessedUrl("");
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
    if (!processedUrl) {
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(processedUrl);
      if (!response.ok) {
        throw new Error("Failed to download the PNG result.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `bg-removed-${fileName || "image"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download the PNG result.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const showSkeleton = isUploading || isProcessing;

  return (
    <>
      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Background Removal
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-400">
              Remove backgrounds with Cloudinary AI, compare the original against
              the transparent result, and download the final PNG.
            </p>
          </div>

          <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
            <CardContent className="p-6">
              {showSkeleton ? (
                <div className="space-y-4">
                  <Skeleton className="h-[360px] w-full rounded-2xl bg-white/10" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-44 bg-white/10" />
                    <Skeleton className="h-4 w-72 bg-white/10" />
                  </div>
                  <p className="text-sm text-neutral-400">
                    Cloudinary is removing the background...
                  </p>
                </div>
              ) : uploadedImage && originalUrl && processedUrl ? (
                <BeforeAfterSlider
                  beforeSrc={originalUrl}
                  afterSrc={processedUrl}
                  beforeAlt="Original upload"
                  afterAlt="Background removed result"
                />
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 text-center">
                  <Eraser className="mb-4 size-12 text-neutral-600" />
                  <p className="text-lg font-semibold text-white">
                    Upload an image to remove its background
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
                    The result loads here with a draggable before and after
                    comparison slider.
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
                  <CardTitle className="text-xl">Upload source image</CardTitle>
                  <CardDescription className="mt-1 text-neutral-400">
                    Choose a clear subject for the best cutout quality.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bg-image" className="text-neutral-200">
                  Image file
                </Label>
                <Input
                  id="bg-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading || isDownloading || isProcessing}
                  className="border-white/10 bg-white/5 text-white file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
                />
              </div>

              {fileName ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  <p className="font-semibold text-white">Selected file</p>
                  <p className="mt-1 break-all text-neutral-400">{fileName}</p>
                </div>
              ) : null}

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-purple-400">
                  <Sparkles className="size-4" />
                  <p className="font-semibold text-white">What happens next</p>
                </div>
                <p className="text-sm leading-6 text-neutral-400">
                  The uploaded image stays intact, while the preview and download
                  use Cloudinary&apos;s background removal transformation.
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              ) : null}

              <Button
                onClick={handleDownload}
                disabled={!processedUrl || showSkeleton || isDownloading}
                className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
              >
                <Download className="mr-2 size-4" />
                {isDownloading ? "Preparing PNG..." : "Download PNG"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <UpgradeModal
        open={isTrialLocked}
        featureName="Background Removal"
        onOpenChange={setIsTrialLocked}
      />
    </>
  );
}
