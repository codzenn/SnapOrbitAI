"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Captions,
  Check,
  Maximize2,
  Play,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export function Hero() {
  const workflowItems = [
    { label: "Upload", value: "12 assets", icon: UploadCloud },
    { label: "Clean", value: "BG removed", icon: Check },
    { label: "Caption", value: "5 variants", icon: Captions },
    { label: "Search", value: "ready", icon: Search },
  ];

  return (
    <section className="relative overflow-hidden bg-[#050807] pt-28 text-white md:pt-32">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#0f8f7a]/20 blur-[120px]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050807] to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:pb-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#64d6c1]/25 bg-white/5 px-3 py-1.5 text-sm font-medium text-[#9ff3e3] shadow-sm">
            <Sparkles className="size-4" />
            Gemini vision, Cloudinary AI, and Stripe billing in one workflow
          </div>

          <h1 className="mt-8 max-w-3xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            Turn raw media into publish-ready assets.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#a7b8b4] md:text-xl">
            SnapOrbitAI gives creators and teams a focused workspace for
            background removal, generative fill, captions, quality audits,
            video intelligence, and natural-language asset search.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#64d6c1] px-6 py-3 text-sm font-semibold text-[#04100e] shadow-lg shadow-[#64d6c1]/10 hover:bg-[#9ff3e3]"
            >
              Start free
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:border-white/20 hover:bg-white/10"
            >
              See workflow
              <Play className="size-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["6", "AI media tools"],
              ["1", "free trial per feature"],
              ["25", "images per batch"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-[#64d6c1]/30 pl-4">
                <p className="text-3xl font-semibold text-white">{value}</p>
                <p className="mt-1 text-sm text-[#a7b8b4]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#08100e] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#ff6b6b]" />
                <span className="size-2.5 rounded-full bg-[#f8c14a]" />
                <span className="size-2.5 rounded-full bg-[#20c997]" />
              </div>
              <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 sm:inline">
                snaporbitai.app/home
              </span>
              <BadgeCheck className="size-4 text-[#64d6c1]" />
            </div>

            <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[190px_1fr]">
              <aside className="hidden border-r border-white/10 bg-white/[0.03] p-4 lg:block">
                <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-white">
                  <CloudBadge />
                  SnapOrbitAI
                </div>
                <div className="space-y-2">
                  {["Asset Library", "Video Studio", "Gen Fill", "Batch Process"].map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-md px-3 py-2 text-xs ${
                        index === 0 ? "bg-[#64d6c1] text-[#04100e]" : "text-white/55"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-[#64d6c1]">Asset Library</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      Summer campaign assets
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm text-white/70">
                    <Search className="size-4" />
                    dark product shots
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <span className="text-sm font-medium text-white">AI transform</span>
                      <span className="rounded-full bg-[#64d6c1]/15 px-2.5 py-1 text-xs text-[#9ff3e3]">
                        ready
                      </span>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                      <div className="min-h-52 rounded-md border border-white/10 bg-[linear-gradient(135deg,#173f38_0%,#0b1815_45%,#050807_46%,#050807_100%)] p-3">
                        <span className="rounded-full bg-black/50 px-2 py-1 text-xs text-white/80">
                          before
                        </span>
                      </div>
                      <div className="min-h-52 rounded-md border border-[#64d6c1]/30 bg-[linear-gradient(135deg,#0b1815_0%,#0b1815_44%,#0f8f7a_45%,#0f8f7a_47%,#10231f_48%,#10231f_100%)] p-3">
                        <span className="rounded-full bg-[#0f8f7a] px-2 py-1 text-xs font-medium text-white">
                          after
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">Quality audit</span>
                        <span className="text-2xl font-semibold text-[#64d6c1]">8.7</span>
                      </div>
                      <div className="mt-4 space-y-2">
                        {["Composition", "Brightness", "Platform fit"].map((metric, index) => (
                          <div key={metric}>
                            <div className="flex justify-between text-xs text-white/55">
                              <span>{metric}</span>
                              <span>{index === 1 ? "82%" : "91%"}</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-[#64d6c1]"
                                style={{ width: index === 1 ? "82%" : "91%" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                        <Maximize2 className="size-4 text-[#ffd166]" />
                        Caption set
                      </div>
                      <p className="text-sm leading-6 text-white/65">
                        Launch day visuals with clean contrast, fast polish,
                        and a studio-ready finish.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {workflowItems.map((item) => (
                    <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <item.icon className="size-4 text-[#64d6c1]" />
                      <p className="mt-3 text-xs text-white/45">{item.label}</p>
                      <p className="text-sm font-medium text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CloudBadge() {
  return (
    <BrandMark className="size-8" />
  );
}
