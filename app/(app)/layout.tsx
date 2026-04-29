"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  CloudCog,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  Share2Icon,
  UploadIcon,
  Eraser,
  Maximize,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const sidebarItems = [
  {
    href: "/home",
    icon: LayoutDashboardIcon,
    label: "Dashboard",
    description: "Review your uploaded library",
  },
  {
    href: "/social-share",
    icon: Share2Icon,
    label: "Social Share",
    description: "Resize images for each channel",
  },
  {
    href: "/video-upload",
    icon: UploadIcon,
    label: "Video Upload",
    description: "Add new videos to Cloudinary",
  },
  {
    href: "/ai-gen-expand",
    icon: Maximize,
    label: "AI Expand",
    description: "Generative fill missing pixels",
  },
  {
    href: "/ai-bg-removal",
    icon: Eraser,
    label: "AI BG Removal",
    description: "Instantly remove backgrounds",
  },
  {
    href: "/ai-reel-extraction",
    icon: Scissors,
    label: "AI Reel Extraction",
    description: "Auto-extract highlights",
  },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  
  const currentItem = sidebarItems.find((item) => pathname === item.href) ?? sidebarItems[0];
  const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Creator";

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  useEffect(() => {
    const sendAutoLogout = () => {
      try {
        const payload = new Blob(["{}"], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/auth/auto-logout", payload);
          return;
        }
      } catch {
        // ignore
      }

      fetch("/api/auth/auto-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener("pagehide", sendAutoLogout);
    window.addEventListener("beforeunload", sendAutoLogout);

    return () => {
      window.removeEventListener("pagehide", sendAutoLogout);
      window.removeEventListener("beforeunload", sendAutoLogout);
    };
  }, []);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-black/40 border-r border-white/10 backdrop-blur-xl">
      <div className="border-b border-white/10 px-6 py-5">
        <Link href="/home" className="flex items-center gap-4" onClick={() => setSidebarOpen(false)}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
            <CloudCog className="size-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">SnapOrbitAI</p>
            <p className="text-sm text-neutral-400">Media workspace</p>
          </div>
        </Link>
      </div>

      <ul className="flex-1 space-y-2 px-4 py-4 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors relative ${
                  isActive
                    ? "bg-white/10 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={`mt-0.5 rounded-lg p-2 transition-colors ${isActive ? "bg-white text-black shadow-sm" : "bg-white/5 text-neutral-400"}`}>
                  <item.icon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className={`font-semibold ${isActive ? "text-white" : "text-neutral-300"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-neutral-500 leading-tight">
                    {item.description}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto px-4 py-5">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/10 shadow-sm">
          <div>
            <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">Plan</p>
            <p className="text-sm font-bold text-white uppercase tracking-wide mt-0.5">
              {user?.publicMetadata?.plan === "pro_plus" ? "PRODUCTION" : user?.publicMetadata?.plan === "pro" ? "STUDIO" : "CREATOR"}
            </p>
          </div>
          {user?.publicMetadata?.plan !== "pro_plus" && (
            <Button asChild variant="default" size="sm" className="rounded-full text-xs bg-white text-black hover:bg-neutral-200" onClick={() => setSidebarOpen(false)}>
              <Link href="/pricing">Upgrade</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-black text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                      <MenuIcon className="size-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72 bg-black border-r border-white/10 text-white">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                  SnapOrbitAI
                </p>
                <h1 className="text-lg font-semibold md:text-xl text-white">
                  {currentItem.label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block mr-2">
                <p className="text-sm font-semibold leading-tight text-white">
                  {displayName}
                </p>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-neutral-400 hover:bg-red-500/10 hover:text-red-500"
                aria-label="Log out"
                title="Log out"
              >
                <LogOutIcon className="size-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
