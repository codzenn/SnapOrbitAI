"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  FolderKanban,
  LogOutIcon,
  MenuIcon,
  Sparkles,
  UploadIcon,
  Eraser,
  Film,
  Maximize,
  UserCircle2,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const sidebarItems = [
  {
    href: "/home",
    icon: FolderKanban,
    label: "Asset Library",
    description: "Search and review your assets",
  },
  {
    href: "/video-studio",
    icon: Film,
    label: "Video Studio",
    description: "Analyze, caption, and convert videos",
  },
  {
    href: "/video-upload",
    icon: UploadIcon,
    label: "Upload Studio",
    description: "Upload one image and run AI",
  },
  {
    href: "/ai-gen-expand",
    icon: Maximize,
    label: "Gen Fill",
    description: "Generative fill missing pixels",
  },
  {
    href: "/ai-bg-removal",
    icon: Eraser,
    label: "BG Removal",
    description: "Instantly remove backgrounds",
  },
  {
    href: "/batch-process",
    icon: Boxes,
    label: "Batch Process",
    description: "Run the same AI ops on many images",
  },
  {
    href: "/analytics",
    icon: BarChart3,
    label: "Analytics",
    description: "Track Business plan usage",
  },
];

interface SidebarContentProps {
  pathname: string;
  setSidebarOpen: (open: boolean) => void;
  userPlan: unknown;
}

function SidebarContent({
  pathname,
  setSidebarOpen,
  userPlan,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-black/40 border-r border-white/10 backdrop-blur-xl">
      <div className="border-b border-white/10 px-6 py-5">
        <Link href="/home" className="flex items-center gap-4" onClick={() => setSidebarOpen(false)}>
          <BrandMark className="size-12" />
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
              {userPlan === "business" ? "BUSINESS" : userPlan === "pro" ? "PRO" : "FREE"}
            </p>
          </div>
          {userPlan !== "business" && (
            <Button asChild variant="default" size="sm" className="rounded-full text-xs bg-white text-black hover:bg-neutral-200" onClick={() => setSidebarOpen(false)}>
              <Link href="/pricing">Upgrade</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("free");
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  
  const currentItem = sidebarItems.find((item) => pathname === item.href) ?? null;
  const currentTitle = pathname === "/profile" ? "Profile" : currentItem?.label || "Workspace";
  const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Creator";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "No email added";
  const avatarFallback = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SO";

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  useEffect(() => {
    fetch("/api/subscription/current")
      .then((response) => response.json())
      .then((data) => setCurrentPlan(data.plan || "free"))
      .catch(() => setCurrentPlan("free"));
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const upgraded = params.get("upgraded");
    const plan = params.get("plan");

    if (upgraded !== "true") {
      return;
    }

    toast.success(
      plan === "business"
        ? "Business plan is active."
        : plan === "pro"
          ? "Pro plan is active."
          : "Plan updated successfully.",
      {
        description:
          "Razorpay subscription was verified and your workspace has been updated.",
      },
    );

    router.replace(pathname);
  }, [pathname, router]);

  return (
    <div className="flex min-h-screen w-full bg-black text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0">
        <SidebarContent
          pathname={pathname}
          setSidebarOpen={setSidebarOpen}
          userPlan={currentPlan}
        />
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
                    <SidebarContent
                      pathname={pathname}
                      setSidebarOpen={setSidebarOpen}
                      userPlan={currentPlan}
                    />
                  </SheetContent>
                </Sheet>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                  SnapOrbitAI
                </p>
                <h1 className="text-lg font-semibold md:text-xl text-white">
                  {currentTitle}
                </h1>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 lg:inline-flex lg:items-center lg:gap-2">
                <Sparkles className="size-3.5" />
                {currentPlan === "business" ? "Business" : currentPlan === "pro" ? "Pro" : "Free"}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-2.5 py-2 text-left text-white outline-hidden transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
                  aria-label="Open account menu"
                >
                  <Avatar size="default" className="ring-1 ring-white/10">
                    <AvatarImage src={user?.imageUrl} alt={displayName} />
                    <AvatarFallback className="bg-white/10 text-white">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden min-w-0 text-right sm:block">
                    <p className="truncate text-sm font-semibold leading-tight text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-[11px] leading-tight text-neutral-400">
                      {userEmail}
                    </p>
                  </div>
                  <ChevronDown className="size-4 text-neutral-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 rounded-2xl border border-white/10 bg-zinc-950 p-2 text-white shadow-2xl"
                >
                  <div className="px-2 py-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{displayName}</p>
                      <p className="truncate text-xs text-neutral-400">{userEmail}</p>
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                        {currentPlan === "business"
                          ? "Business plan"
                          : currentPlan === "pro"
                            ? "Pro plan"
                            : "Free plan"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl px-2 py-2 text-neutral-200 focus:bg-white/10 focus:text-white"
                    onClick={() => router.push("/profile")}
                  >
                    <UserCircle2 className="size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl px-2 py-2"
                    variant="destructive"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOutIcon className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
