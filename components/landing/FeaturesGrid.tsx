import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Boxes,
  Captions,
  Eraser,
  FileSearch,
  Film,
  Maximize2,
  WandSparkles,
} from "lucide-react";

type Feature = {
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
};

const features: Feature[] = [
  {
    title: "Background removal",
    description:
      "Remove distracting backgrounds, preview the result, and keep the polished version with the original asset.",
    detail: "Cloudinary AI",
    icon: Eraser,
    accent: "bg-[#0f8f7a]",
  },
  {
    title: "Generative fill",
    description:
      "Expand images into square, vertical, and widescreen formats without rebuilding the creative from scratch.",
    detail: "1:1, 4:5, 9:16, 16:9",
    icon: Maximize2,
    accent: "bg-[#2563eb]",
  },
  {
    title: "AI captions",
    description:
      "Generate platform-ready captions, hooks, and hashtag ideas from the actual content in every image.",
    detail: "Gemini vision",
    icon: Captions,
    accent: "bg-[#e0a800]",
  },
  {
    title: "Quality audit",
    description:
      "Score composition, brightness, blur, and platform fit before a client or audience ever sees the asset.",
    detail: "Actionable review",
    icon: BadgeCheck,
    accent: "bg-[#16a34a]",
  },
  {
    title: "Batch processing",
    description:
      "Run the same AI operation across a whole drop of campaign images and download the outputs together.",
    detail: "ZIP export",
    icon: Boxes,
    accent: "bg-[#ef4444]",
  },
  {
    title: "Semantic search",
    description:
      "Find assets by mood, subject, color, or intent with natural-language search powered by embeddings.",
    detail: "Vector matching",
    icon: FileSearch,
    accent: "bg-[#0891b2]",
  },
  {
    title: "Video intelligence",
    description:
      "Analyze videos, generate captions, and convert aspect ratios inside the same workspace as your images.",
    detail: "Video Studio",
    icon: Film,
    accent: "bg-[#111827]",
  },
  {
    title: "Creator workspace",
    description:
      "Keep uploads, AI metadata, usage, and subscription controls together instead of managing scattered tools.",
    detail: "One dashboard",
    icon: WandSparkles,
    accent: "bg-[#0f766e]",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="bg-[#050807] py-20 text-white md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[#64d6c1]">Feature suite</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
              Everything you need to prepare media for launch.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-[#a7b8b4] lg:justify-self-end">
            A single flow for cleanup, expansion, metadata, search, and billing.
            It is intentionally focused: less tab hopping, more finished assets.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-lg border border-white/10 bg-[#0b1110] p-5 transition hover:-translate-y-1 hover:border-[#64d6c1]/30 hover:bg-[#101816] hover:shadow-xl hover:shadow-black/20"
            >
              <div className={`flex size-11 items-center justify-center rounded-md text-white ${feature.accent}`}>
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#a7b8b4]">{feature.description}</p>
              <div className="mt-6 border-t border-white/10 pt-4 text-xs font-semibold text-[#64d6c1]">
                {feature.detail}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
