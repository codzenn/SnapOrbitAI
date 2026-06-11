"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  featureName: string;
  onOpenChange: (open: boolean) => void;
}

export default function UpgradeModal({
  open,
  featureName,
  onOpenChange,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-white/10 bg-black text-white sm:max-w-3xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl text-white">
            You&apos;ve used your free trial for {featureName}.
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Upgrade to keep using this feature and unlock the full SnapOrbitAI
            workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Pro
            </p>
            <p className="mt-2 text-3xl font-bold text-white">$12/mo</p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li>Unlimited background removal</li>
              <li>Unlimited generative fill</li>
              <li>Unlimited captions and audits</li>
              <li>Batch processing up to 10 images</li>
              <li>Unlimited video analysis and video captions</li>
              <li>50 aspect ratio video conversions each month</li>
            </ul>
            <Button asChild className="mt-5 w-full bg-white text-black hover:bg-neutral-200">
              <Link href="/pricing?plan=pro">Upgrade to Pro</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Business
            </p>
            <p className="mt-2 text-3xl font-bold text-white">$29/mo</p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li>Everything in Pro</li>
              <li>Unlimited batch jobs up to 25 images</li>
              <li>Unlimited semantic search and video conversions</li>
              <li>Analytics dashboard and priority support</li>
            </ul>
            <Button
              asChild
              variant="outline"
              className="mt-5 w-full border-white/15 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/pricing?plan=business">Upgrade to Business</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
