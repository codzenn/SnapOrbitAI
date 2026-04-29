"use client";

import { useEffect, useMemo, useState } from "react";
import { CldImage, getCldImageUrl } from "next-cloudinary";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Download,
  ImagePlus,
  LayoutTemplate,
  Share2,
  Sparkles,
  Crown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const socialFormats = {
  "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
  "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
  "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },
  "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
  "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
};

type SocialFormat = keyof typeof socialFormats;

export default function SocialShare() {
  const { user } = useUser();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>("Instagram Square (1:1)");
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const plan = user?.publicMetadata?.plan as string;
  const isPro = plan === "pro" || plan === "pro_plus";

  useEffect(() => {
    if (uploadedImage) {
      setIsTransforming(true);
    }
  }, [selectedFormat, uploadedImage]);

  const selectedPreset = socialFormats[selectedFormat];
  const previewUrl = useMemo(() => {
    if (!uploadedImage) {
      return "";
    }

    return getCldImageUrl({
      src: uploadedImage,
      width: selectedPreset.width,
      height: selectedPreset.height,
      crop: "fill",
      gravity: "auto",
      format: "png",
      quality: "auto",
    });
  }, [selectedPreset.height, selectedPreset.width, uploadedImage]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
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
    } catch (err: any) {
      setError(err.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDownload = () => {
    if (!previewUrl) return;

    fetch(previewUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedFormat.replace(/\s+/g, "_").toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="space-y-8 text-white">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-purple-400">
            <Share2 className="size-4" />
            <span className="text-sm font-medium">Social formatter</span>
          </div>
          <h2 className="text-2xl font-semibold md:text-3xl">
            Prepare image exports for each social channel.
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-neutral-400">
            Upload a source image, choose the target format, and download the generated Cloudinary result.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm shadow-sm backdrop-blur-sm">
            <p className="text-neutral-500">Presets</p>
            <p className="mt-1 font-semibold text-white">5 formats</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm shadow-sm backdrop-blur-sm">
            <p className="text-neutral-500">Ratio</p>
            <p className="mt-1 font-semibold text-white">{selectedPreset.aspectRatio}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
            <CardContent className="p-6">
              {!isPro && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-center mb-6">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Crown className="size-5" />
                  </div>
                  <p className="text-sm font-bold text-white">Studio Plan Required</p>
                  <p className="mt-1 text-xs text-neutral-300">
                    Smart Social Formatting is available on the Studio plan.
                  </p>
                  <Button asChild size="sm" className="mt-3 bg-white text-black hover:bg-neutral-200">
                    <Link href="/pricing">Upgrade</Link>
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
                    Choose the original file you want Cloudinary to crop and format.
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

                <div className="space-y-2">
                  <Label className="text-neutral-200">Target format</Label>
                  <select
                    value={selectedFormat}
                    onChange={(event) => setSelectedFormat(event.target.value as SocialFormat)}
                    disabled={!uploadedImage}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Object.keys(socialFormats).map((format) => (
                      <option key={format} value={format} className="bg-black text-white">
                        {format}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-purple-400">
                      <LayoutTemplate className="size-4" />
                      <p className="font-semibold text-white">Export size</p>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {selectedPreset.width} × {selectedPreset.height}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-green-400">
                      <Sparkles className="size-4" />
                      <p className="font-semibold text-white">AI crop</p>
                    </div>
                    <p className="text-sm leading-6 text-neutral-400">
                      Auto gravity keeps the subject centered in the final export.
                    </p>
                  </div>
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
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Preparing export...</>
                  ) : (
                    <><Download className="mr-2 size-4" /> Download image</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="relative min-h-[540px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 shadow-sm md:p-6 backdrop-blur-sm">
          {uploadedImage ? (
            <div className="relative flex h-full min-h-[500px] items-center justify-center rounded-xl bg-white/5 p-4">
              {isTransforming && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/75 backdrop-blur-sm">
                  <Loader2 className="size-8 animate-spin text-white" />
                  <p className="text-sm font-medium text-neutral-300">
                    Applying crop and export format...
                  </p>
                </div>
              )}

              <CldImage
                src={uploadedImage}
                width={selectedPreset.width}
                height={selectedPreset.height}
                crop="fill"
                gravity="auto"
                format="png"
                quality="auto"
                alt={`Preview for ${selectedFormat}`}
                sizes="(max-width: 1280px) 100vw, 60vw"
                className="max-h-[540px] w-auto rounded-xl border border-white/10 object-contain shadow-md"
                onLoad={() => setIsTransforming(false)}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-white">
                <ImagePlus className="size-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Preview your next export</h3>
                <p className="max-w-md text-sm leading-7 text-neutral-400">
                  Upload a real image to see Cloudinary generate the selected social media crop and export.
                </p>
              </div>
            </div>
          )}

          {uploadedImage && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-neutral-400">Preset</p>
                <p className="mt-1 font-semibold text-white">{selectedFormat}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-neutral-400">Aspect ratio</p>
                <p className="mt-1 font-semibold text-white">{selectedPreset.aspectRatio}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-neutral-400">Download type</p>
                <p className="mt-1 font-semibold text-white">PNG export</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}