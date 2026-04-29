"use client";

import { AlertTriangle } from "lucide-react";

export function AuthErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-2xl border border-error/25 bg-error/5 px-4 py-3 text-error"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <div className="text-sm leading-6">{message}</div>
    </div>
  );
}

