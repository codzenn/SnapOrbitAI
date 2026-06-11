"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-white/10 bg-[#050807]/90 shadow-sm backdrop-blur-xl"
          : "bg-[#050807]/75 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-white">
          <BrandMark className="size-10" />
          <span className="text-base font-semibold">SnapOrbitAI</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/60 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/sign-in"
            className="rounded-full px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-[#64d6c1] px-5 py-2.5 text-sm font-semibold text-[#04100e] shadow-sm hover:bg-[#9ff3e3]"
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-white/10 bg-[#050807] px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-3 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="mt-2 rounded-full bg-[#64d6c1] px-4 py-3 text-center text-sm font-semibold text-[#04100e]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Start free
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
