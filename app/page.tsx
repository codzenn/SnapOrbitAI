import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Share2,
  UploadCloud,
  Maximize,
  Eraser,
  Scissors,
  Wand2,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HeroBackground from "@/components/HeroBackground";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/AnimatedUI";

export default async function Home() {
  const { userId } = await auth();

  const coreFeatures = [
    {
      title: "Smart Social Formatting",
      description:
        "Resize and format images and videos for all major social media channels instantly with AI-powered intelligent cropping.",
      icon: Share2,
      link: "/social-share",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      colSpan: "col-span-1 md:col-span-1",
    },
    {
      title: "Media Vault",
      description:
        "Upload, store, and manage your video assets with advanced Cloudinary compression, saving bandwidth without losing quality.",
      icon: UploadCloud,
      link: "/video-upload",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      colSpan: "col-span-1 md:col-span-1",
    },
    {
      title: "Generative Fill & Expand",
      description:
        "Uncrop your images using AI to seamlessly generate missing pixels, allowing you to adapt to new aspect ratios naturally.",
      icon: Maximize,
      link: "/ai-gen-expand",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    },
    {
      title: "Pixel-Perfect BG Removal",
      description:
        "Instantly remove and replace backgrounds from your images with pixel-perfect precision using Cloudinary AI.",
      icon: Eraser,
      link: "/ai-bg-removal",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    },
    {
      title: "AI Reel Extraction",
      description:
        "Intelligent video clipping feature that automatically identifies and extracts key segments from uploaded videos for social media reel creation. Focus on the highlights and ship content faster.",
      icon: Scissors,
      link: "/ai-reel-extraction",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    },
  ];

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <HeroBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="border-b border-white/10 bg-black/40 backdrop-blur-md px-4 md:px-8 sticky top-0 z-50">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <Camera className="size-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">
                  SnapOrbitAI
                </p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                  Media workspace
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {userId ? (
                <Button
                  asChild
                  className="bg-white text-black hover:bg-neutral-200"
                >
                  <Link href="/home">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="text-neutral-300 hover:text-white hover:bg-white/10"
                  >
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-white text-black hover:bg-neutral-200"
                  >
                    <Link href="/sign-up">Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 py-20 md:py-32 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-neutral-300 mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              The all-in-one platform for modern creators
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 mb-6">
              Next-gen media <br /> workspace.
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-neutral-400 mb-10">
              Transform, optimize, and expand your digital assets with advanced
              AI integrations. Built for developers, creators, and modern teams
              shipping at scale.
            </p>
          </FadeIn>

          <FadeIn
            delay={0.3}
            className="flex flex-col gap-4 sm:flex-row items-center justify-center w-full"
          >
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-base bg-white text-black hover:bg-neutral-200 rounded-full w-full sm:w-auto shadow-[0_0_24px_rgba(255,255,255,0.15)]"
            >
              <Link href="/sign-up">
                Start creating for free
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-base border-white/20 bg-black/50 text-white hover:bg-white/10 rounded-full w-full sm:w-auto backdrop-blur-sm"
            >
              <Link href="/pricing">View pricing</Link>
            </Button>
          </FadeIn>
        </section>

        {/* Core Platform Capabilities Section */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-32">
          <FadeIn className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">
              PLATFORM OVERVIEW
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              Powerful tools to accelerate your workflow.
            </h2>
            <p className="max-w-3xl mx-auto text-lg leading-relaxed text-neutral-400">
              Stop switching between multiple apps. SnapOrbitAI brings
              everything you need to manage, edit, and export your media into
              one unified workspace.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreFeatures.map((feature, idx) => (
              <StaggerItem key={idx} className={feature.colSpan}>
                <Card className="h-full bg-black/40 border-white/10 text-white backdrop-blur-md hover:bg-white/5 transition-all duration-300 group flex flex-col overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                    <feature.icon className={`size-48 ${feature.color}`} />
                  </div>
                  <CardHeader className="pb-4 relative z-10">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${feature.bg} ${feature.color}`}
                    >
                      <feature.icon className="size-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-between flex-1 relative z-10">
                    <p className="text-base text-neutral-400 leading-relaxed mb-8">
                      {feature.description}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-fit border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full group-hover:border-white/40 transition-colors"
                    >
                      <Link href={feature.link}>
                        Try it out <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </div>
    </main>
  );
}
