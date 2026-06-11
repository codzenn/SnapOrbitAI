"use client";

import { useMemo, useState } from "react";
import { CldImage } from "next-cloudinary";
import { filesize } from "filesize";
import { CircleAlert, CloudUpload, ImageIcon, Sparkles } from "lucide-react";
import CaptionPanel from "@/components/ai/CaptionPanel";
import QualityAuditCard from "@/components/ai/QualityAuditCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadSummary = useMemo(() => {
    if (!file) {
      return null;
    }

    return {
      name: file.name,
      sizeLabel: filesize(file.size),
      type: file.type || "Unknown format",
    };
  }, [file]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Please select an image to upload.");
      return;
    }

    setIsUploading(true);
    setAssetId(null);
    setPublicId(null);
    setImageUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image upload failed.");
      }

      setAssetId(data.assetId);
      setPublicId(data.public_id);
      setImageUrl(data.imageUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <CloudUpload className="size-4" />
              <span className="text-sm font-medium">SnapOrbit uploader</span>
            </div>
            <CardTitle className="text-2xl font-semibold md:text-3xl">
              Upload a single image
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-neutral-400">
              Upload an image once, then generate AI captions, run a quality
              audit, and prepare it for the rest of your asset library.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                <CircleAlert className="size-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="asset-upload" className="text-neutral-200">
                  Image file
                </Label>
                <Input
                  id="asset-upload"
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="border-white/10 bg-white/5 text-white file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
                />
              </div>

              <Button
                type="submit"
                disabled={!file || isUploading}
                className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
              >
                <CloudUpload className="mr-2 size-4" />
                {isUploading ? "Uploading image..." : "Upload image"}
              </Button>
            </form>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {isUploading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[280px] w-full rounded-2xl bg-white/10" />
                  <Skeleton className="h-4 w-48 bg-white/10" />
                </div>
              ) : publicId ? (
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <CldImage
                      src={publicId}
                      alt="Uploaded asset preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm text-neutral-400">
                    Upload complete. AI captions and audit load automatically
                    below.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 text-center">
                  <ImageIcon className="mb-4 size-12 text-neutral-600" />
                  <p className="text-lg font-semibold text-white">
                    Your uploaded asset preview appears here
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
                    Use JPG, PNG, or WEBP images to unlock captions, quality
                    audit, and search indexing.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {assetId && imageUrl ? (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <QualityAuditCard assetId={assetId} imageUrl={imageUrl} />
            <CaptionPanel assetId={assetId} imageUrl={imageUrl} />
          </div>
        ) : null}
      </section>

      <aside className="space-y-6">
        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <Sparkles className="size-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Upload checklist</CardTitle>
                <CardDescription className="mt-1 text-neutral-400">
                  Keep every upload ready for downstream AI workflows.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-300">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              Use a clear image with a visible subject.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              Wait for AI captions and quality audit to finish after upload.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              The upload route also indexes the asset for natural language
              search.
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Selected media</CardTitle>
            <CardDescription className="text-neutral-400">
              Real file details from your chosen upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadSummary ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-neutral-400">File name</p>
                  <p className="mt-1 break-all font-semibold text-white">
                    {uploadSummary.name}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-neutral-400">File size</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {uploadSummary.sizeLabel}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-neutral-400">MIME type</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {uploadSummary.type}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm leading-6 text-neutral-500">
                Select an image file to see its details before upload.
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
