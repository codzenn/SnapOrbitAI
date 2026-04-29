"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { filesize } from "filesize";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  CircleAlert,
  CloudUpload,
  FileVideo,
  Sparkles,
  WandSparkles,
  Crown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const VideoUpload = () => {
  const { user, isLoaded } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");

  const router = useRouter();
  const plan = user?.publicMetadata?.plan as string;
  const isStarter = !plan || plan === "free";
  const isPro = plan === "pro" || plan === "pro_plus";

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const canSubmit = Boolean(file && title.trim() && !isUploading);
  
  const uploadSummary = useMemo(() => {
    if (!file) return null;
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
      setError("Please select a video file to upload.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size is too large. Maximum allowed size is 50MB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("originalSize", file.size.toString());

    try {
      const response = await axios.post("/api/video-upload", formData);
      if (response.status === 200) {
        router.push("/home");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "An error occurred while uploading the video. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-white">
            <CloudUpload className="size-4" />
            <span className="text-sm font-medium">Cloudinary uploader</span>
          </div>
          <CardTitle className="text-2xl font-semibold md:text-3xl">
            Upload a new video.
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6 text-neutral-400">
            This form keeps the same backend flow and sends your file, title, description, and size to the current upload endpoint.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 mb-6">
              <CircleAlert className="size-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {isStarter && isLoaded && (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6 text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                <Crown className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Creator Plan Limits Apply</h3>
              <p className="mt-2 text-sm text-neutral-300">
                You have 5 video uploads per month on the Creator plan. Upgrade to Studio for 100 uploads, or Production for unlimited access.
              </p>
              <Button asChild className="mt-4 bg-white text-black hover:bg-neutral-200">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="title" className="text-neutral-200">Video title</Label>
              <Input
                id="title"
                type="text"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isUploading}
                placeholder="Enter an engaging title"
                className="bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-neutral-200">Description</Label>
              <Textarea
                id="description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isUploading}
                placeholder="Tell viewers what this video is about"
                className="bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-white/20"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="file-upload" className="text-neutral-200">Video file</Label>
                <span className="text-xs text-neutral-500">
                  MP4, WebM, or OGG up to 50MB
                </span>
              </div>

              <Label 
                htmlFor="file-upload"
                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center transition-colors hover:border-white/40 hover:bg-white/10"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white">
                  <FileVideo className="size-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-white">Choose a source video</p>
                  <p className="text-sm text-neutral-400">
                    Select a file to upload and compress with Cloudinary.
                  </p>
                </div>
                <Input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  disabled={isUploading}
                />
              </Label>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading video...
                </>
              ) : (
                <>
                  <CloudUpload className="mr-2 size-4" />
                  Upload video
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-6">
        <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <Sparkles className="size-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Upload checklist</CardTitle>
                <CardDescription className="text-neutral-400 mt-1">Keep the media pipeline clean and predictable</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-300">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              Add a title for the upload.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              Include a description if you need dashboard context.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              Choose a supported file up to 50MB.
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-white">
                <WandSparkles className="size-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Selected media</CardTitle>
                <CardDescription className="text-neutral-400 mt-1">Real file details from the chosen upload</CardDescription>
              </div>
            </div>
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
                    <p className="mt-1 text-lg font-bold text-white">{uploadSummary.type}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-sm leading-6 text-neutral-500 text-center">
                Select a video file to show its real upload details here before you submit the form.
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};

export default VideoUpload;