"use client";

import { UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BatchDropzoneProps {
  files: File[];
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export default function BatchDropzone({
  files,
  disabled,
  onFilesSelected,
}: BatchDropzoneProps) {
  return (
    <div className="space-y-4">
      <label
        htmlFor="batch-files"
        className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center transition hover:border-white/25 hover:bg-white/[0.07]"
      >
        <UploadCloud className="mb-4 size-12 text-neutral-500" />
        <p className="text-lg font-semibold text-white">
          Upload 2 to 10 images
        </p>
        <p className="mt-2 max-w-md text-sm leading-6 text-neutral-400">
          Add multiple JPG, PNG, or WEBP files to process them together.
        </p>
      </label>

      <Input
        id="batch-files"
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={(event) =>
          onFilesSelected(Array.from(event.target.files ?? []))
        }
        className="border-white/10 bg-white/5 text-white file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
      />

      {files.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
          {files.length} file{files.length === 1 ? "" : "s"} selected
        </div>
      ) : null}
    </div>
  );
}
