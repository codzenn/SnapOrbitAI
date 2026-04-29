"use client";

import { useState } from "react";
import { CldImage } from "next-cloudinary";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Download,
  ImagePlus,
  Sparkles,
  Wand2,
  Maximize,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AIGenExpand() {
  const { user, isLoaded } = useUser();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");

  const plan = user?.publicMetadata?.plan as string;
  const isEnterprise = plan === "pro_plus";

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
    }/image/upload/c_pad,b_gen_fill,ar_${aspectRatio}/${uploadedImage}`;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `expanded-${aspectRatio.replace(":", "x")}-${fileName || "image"}.jpg`;
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
          AI Generative Expand
        </h1>
        <p className="mt-2 text-lg text-neutral-400">
          Uncrop your images. AI seamlessly generates new pixels to change your aspect ratio without losing content.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm relative">
            {uploadedImage ? (
              <div className="relative w-full h-full group">
                <CldImage
                  src={uploadedImage}
                  alt="Expanded Image"
                  fill
                  className="object-contain p-4 z-10"
                  crop="pad"
                  aspectRatio={aspectRatio}
                  fillBackground={{
                    prompt: "natural seamless extension"
                  }}
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <Maximize className="mx-auto mb-4 size-12 text-neutral-600" />
                <p className="text-lg font-medium text-neutral-500">
                  Upload an image to magically expand it
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
            <CardContent className="p-6">
              {!isEnterprise && isLoaded && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-center mb-6">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Wand2 className="size-5" />
                  </div>
                  <p className="text-sm font-bold text-white">Production Plan Required</p>
                  <p className="mt-1 text-xs text-neutral-300">
                    Unlock AI Generative Fill (Expand) with the Production plan.
                  </p>
                  <Button asChild size="sm" className="mt-3 bg-white text-black hover:bg-neutral-200">
                    <Link href="/pricing">Upgrade to Production</Link>
                  </Button>
                </div>
              )}

              <div className={`space-y-6 ${!isEnterprise ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <ImagePlus className="size-5" />
                    <h3 className="text-xl font-bold">Upload source image</h3>
                  </div>
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

                <div className="space-y-2">
                  <Label className="text-neutral-200">Target Ratio</Label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!uploadedImage}
                  >
                    <option value="16:9" className="bg-black text-white">Landscape (16:9)</option>
                    <option value="1:1" className="bg-black text-white">Square (1:1)</option>
                    <option value="4:5" className="bg-black text-white">Portrait (4:5)</option>
                    <option value="9:16" className="bg-black text-white">Vertical (9:16)</option>
                  </select>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-green-400">
                    <Sparkles className="size-4" />
                    <p className="font-semibold text-white">AI Generative Fill</p>
                  </div>
                  <p className="text-sm leading-6 text-neutral-400">
                    The AI analyzes the content and context of your image to seamlessly paint in the missing edges.
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
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Generating pixels...</>
                  ) : (
                    <><Download className="mr-2 size-4" /> Download expanded image</>
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