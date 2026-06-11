import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050807] py-12 text-white md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <BrandMark className="size-10" />
              <span className="font-semibold">SnapOrbitAI</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#a7b8b4]">
              AI media tooling for creators, marketers, and teams who need
              finished assets faster.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-3">
              <p className="font-semibold text-white">Product</p>
              <a href="#features" className="block text-[#a7b8b4] hover:text-white">Features</a>
              <a href="#workflow" className="block text-[#a7b8b4] hover:text-white">Workflow</a>
              <a href="#pricing" className="block text-[#a7b8b4] hover:text-white">Pricing</a>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-white">Account</p>
              <Link href="/sign-in" className="block text-[#a7b8b4] hover:text-white">Sign in</Link>
              <Link href="/sign-up" className="block text-[#a7b8b4] hover:text-white">Sign up</Link>
              <Link href="/pricing" className="block text-[#a7b8b4] hover:text-white">Upgrade</Link>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-white">Stack</p>
              <span className="block text-[#a7b8b4]">Cloudinary</span>
              <span className="block text-[#a7b8b4]">Gemini</span>
              <span className="block text-[#a7b8b4]">Next.js</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-[#a7b8b4]">
          Copyright 2026 SnapOrbitAI. Powered by Gemini and Cloudinary.
        </div>
      </div>
    </footer>
  );
}
