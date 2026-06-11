import Link from "next/link";
import {
  ArrowRight,
  Eraser,
  FolderKanban,
  Layers3,
  Sparkles,
  Wand2,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HeroBackground from "@/components/HeroBackground";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/AnimatedUI";

export default async function Home() {
  const { userId } = await auth();

  const featureCards = [
    {
      title: "Asset Library",
      description:
        "Upload, store, search, and review your image assets with AI metadata and a focused detail drawer.",
      icon: FolderKanban,
    },
    {
      title: "Background Removal",
      description:
        "Create transparent cutouts instantly with Cloudinary AI and compare before and after results side by side.",
      icon: Eraser,
    },
    {
      title: "AI Expand",
      description:
        "Use generative fill to extend images into new aspect ratios for every social or campaign format.",
      icon: Wand2,
    },
    {
      title: "Smart Batch Processor",
      description:
        "Run the same AI operations across multiple images, then export the processed set as a ZIP archive.",
      icon: Layers3,
    },
  ];

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <HeroBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="border-b border-white/10 bg-black/40 backdrop-blur-md px-4 md:px-8 sticky top-0 z-50">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              SnapOrbitAI
            </Link>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" className="text-neutral-300 hover:text-white hover:bg-white/10">
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild variant="ghost" className="text-neutral-300 hover:text-white hover:bg-white/10">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="bg-white text-black hover:bg-neutral-200">
                <Link href={userId ? "/home" : "/sign-up"}>Sign Up</Link>
              </Button>
            </div>
          </div>
        </nav>

        <section className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 py-20 md:py-28 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-neutral-300 mb-8 backdrop-blur-sm">
              <Sparkles className="size-4" />
              AI-powered image workflow for creators
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 mb-6">
              Edit, audit, caption, and organize images in one AI workflow.
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-neutral-400 mb-10">
              SnapOrbitAI combines Gemini + Cloudinary AI so you can
              remove backgrounds, expand images, generate captions, audit
              quality, and manage assets from one focused workspace.
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
              <Link href={userId ? "/home" : "/sign-up"}>
                Start free
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-base border-white/20 bg-black/50 text-white hover:bg-white/10 rounded-full w-full sm:w-auto backdrop-blur-sm"
            >
              <Link href={userId ? "/video-upload" : "/pricing"}>See pricing</Link>
            </Button>
          </FadeIn>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              "Gemini captions",
              "Cloudinary AI transforms",
              "Search-ready asset library",
              "Batch export workflow",
            ].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-300 backdrop-blur-sm"
              >
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-24">
          <FadeIn className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">
              SECTION 2
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              Feature Showcase
            </h2>
            <p className="max-w-3xl mx-auto text-lg leading-relaxed text-neutral-400">
              Four focused workflows cover the full image pipeline from upload
              to export.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature, idx) => (
              <StaggerItem key={idx}>
                <Card className="h-full bg-black/40 border-white/10 text-white backdrop-blur-md hover:bg-white/5 transition-all duration-300 group flex flex-col overflow-hidden">
                  <CardHeader className="pb-4 relative z-10">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white transition-transform duration-300 group-hover:scale-110">
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
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-24">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">
              SECTION 3
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              How free trial works
            </h2>
          </FadeIn>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Sign up and upload",
                text: "Create your account and upload your first image into the AI workflow.",
              },
              {
                step: "2",
                title: "Try every core feature once",
                text: "Use background removal, generative fill, captions, audit, and search on the free trial.",
              },
              {
                step: "3",
                title: "Upgrade when ready",
                text: "Move to Pro or Business for unlimited access and larger batch limits.",
              },
            ].map((item) => (
              <Card key={item.step} className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                    {item.step}
                  </div>
                  <CardTitle className="text-2xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-neutral-400">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-24">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-4">
              SECTION 4
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              Pricing preview
            </h2>
          </FadeIn>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "Free", price: "$0", desc: "Limited trial usage" },
              { name: "Pro", price: "$12/mo", desc: "Unlimited core workflows" },
              { name: "Business", price: "$29/mo", desc: "Unlimited workflows + analytics" },
            ].map((plan) => (
              <Card key={plan.name} className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-4xl font-extrabold">{plan.price}</p>
                  <p className="text-sm text-neutral-400">{plan.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button asChild className="bg-white text-black hover:bg-neutral-200">
              <Link href="/pricing">
                View full pricing
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-white/10 px-4 py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 text-sm text-neutral-400">
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/sign-in" className="hover:text-white">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-white">
              Sign Up
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
