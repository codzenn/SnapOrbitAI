"use client";

import { useState } from "react";
import { CldImage } from "next-cloudinary";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Download,
  ImagePlus,
  Eraser,
  Sparkles,
  Crown,
  Wand2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AIBGRemoval() {
  const { user, isLoaded } = useUser();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const plan = user?.publicMetadata?.plan as string;
  const isPro = plan === "pro" || plan === "pro_plus";

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);
    setError(null);

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
    } catch (err: any) {
      setError(err.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDownload = () => {
    if (!uploadedImage) return;

    setIsTransforming(true);

    const url = `https://res.cloudinary.com/${
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    }/image/upload/e_background_removal/${uploadedImage}`;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `bg-removed-${fileName || "image"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(() => setError("Failed to download image."))
      .finally(() => setIsTransforming(false));
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          AI Background Removal
        </h1>
        <p className="mt-2 text-lg text-neutral-400">
          Instantly remove backgrounds from your images using advanced AI.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm relative">
            {uploadedImage ? (
              <div className="relative w-full h-full group">
                <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/demo/image/upload/v1312461204/transparent_pattern.png')] bg-repeat opacity-20" />
                <CldImage
                  src={uploadedImage}
                  alt="Original Image"
                  fill
                  className="object-contain p-4 z-10"
                  removeBackground
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <Eraser className="mx-auto mb-4 size-12 text-neutral-600" />
                <p className="text-lg font-medium text-neutral-500">
                  Upload an image to remove its background
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
            <CardContent className="p-6">
              {!isPro && isLoaded && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center mb-6">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-500">
                    <Wand2 className="size-5" />
                  </div>
                  <p className="text-sm font-bold text-white">Studio Plan Required</p>
                  <p className="mt-1 text-xs text-neutral-300">
                    Unlock AI Background Removal with the Studio plan.
                  </p>
                  <Button asChild size="sm" className="mt-3 bg-white text-black hover:bg-neutral-200">
                    <Link href="/pricing">Upgrade to Studio</Link>
                  </Button>
                </div>
              )}

              <div className={`space-y-6 ${!isPro ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <ImagePlus className="size-5" />
                    <h3 className="text-xl font-bold">Upload source image</h3>
                  </div>
                  <p className="text-sm leading-6 text-neutral-400">
                    Choose an image with a clear subject for best results.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-200">Image file</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="bg-white/5 border-white/10 text-white file:text-white file:bg-white/10 file:border-0 hover:file:bg-white/20 file:rounded-md file:px-2 file:py-1 file:mr-2 file:text-sm file:font-medium"
                  />
                </div>

                {fileName && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                    <p className="font-semibold text-neutral-200">Selected file</p>
                    <p className="mt-1 break-all text-neutral-400">{fileName}</p>
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-purple-400">
                    <Sparkles className="size-4" />
                    <p className="font-semibold text-white">AI Processing</p>
                  </div>
                  <p className="text-sm leading-6 text-neutral-400">
                    Cloudinary AI will automatically detect the main subject and strip away the background, returning a transparent PNG.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {isUploading && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-400 flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Uploading image to Cloudinary...
                  </div>
                )}

                <Button
                  onClick={handleImageDownload}
                  disabled={!uploadedImage || isTransforming || isUploading}
                  className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
                >
                  {isTransforming ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Processing AI...</>
                  ) : (
                    <><Download className="mr-2 size-4" /> Download transparent PNG</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}