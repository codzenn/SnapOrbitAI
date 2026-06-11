"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

type PricingTier = {
  id: "free" | "pro" | "business";
  name: string;
  description: string;
  monthly: string;
  yearly: string;
  period: string;
  highlight?: boolean;
  features: string[];
  cta: string;
};

const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    description: "For testing the full workflow before you commit.",
    monthly: "$0",
    yearly: "$0",
    period: "forever",
    features: [
      "One trial use of every major feature",
      "Background removal and generative fill",
      "AI captions, audit, and semantic search",
      "Video compression plus trial video AI",
      "Small asset library for experiments",
    ],
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For solo creators and marketers using AI media every week.",
    monthly: "$12",
    yearly: "$99",
    period: "per month",
    highlight: true,
    features: [
      "Unlimited image cleanup and captions",
      "Unlimited quality audits",
      "Natural-language asset search",
      "Batch processing up to 10 images",
      "Video Studio analysis and captions",
    ],
    cta: "Start Pro",
  },
  {
    id: "business",
    name: "Business",
    description: "For teams that need more batch volume and usage visibility.",
    monthly: "$29",
    yearly: "$249",
    period: "per month",
    features: [
      "Everything in Pro",
      "Batch processing up to 25 images",
      "Unlimited searches and conversions",
      "Usage analytics dashboard",
      "Priority support and Stripe portal",
    ],
    cta: "Start Business",
  },
];

function PricingCard({ tier, isYearly }: { tier: PricingTier; isYearly: boolean }) {
  const price = isYearly ? tier.yearly : tier.monthly;
  const href = tier.id === "free" ? "/sign-up" : `/pricing?plan=${tier.id}`;
  const period = isYearly && tier.id !== "free" ? "per year" : tier.period;

  return (
    <div
      className={`flex h-full flex-col rounded-lg border p-6 ${
        tier.highlight
          ? "border-[#0f8f7a] bg-[#101014] text-white shadow-2xl shadow-black/15"
          : "border-white/10 bg-[#0b1110] text-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-white">
            {tier.name}
          </h3>
          <p className={`mt-3 text-sm leading-6 ${tier.highlight ? "text-white/65" : "text-[#a7b8b4]"}`}>
            {tier.description}
          </p>
        </div>
        {tier.highlight ? (
          <span className="rounded-full bg-[#64d6c1] px-3 py-1 text-xs font-semibold text-[#101014]">
            Popular
          </span>
        ) : null}
      </div>

      <div className="mt-8 flex items-end gap-2">
        <span className="text-5xl font-semibold text-white">
          {price}
        </span>
        <span className={`pb-1 text-sm ${tier.highlight ? "text-white/50" : "text-[#a7b8b4]"}`}>
          {period}
        </span>
      </div>

      <ul className="mt-8 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className={`flex items-start gap-3 text-sm leading-6 ${
              tier.highlight ? "text-white/70" : "text-[#a7b8b4]"
            }`}
          >
            <span
              className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full ${
                tier.highlight ? "bg-[#64d6c1] text-[#101014]" : "bg-[#0f8f7a]/10 text-[#0f8f7a]"
              }`}
            >
              <Check className="size-3.5" />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#64d6c1] px-5 py-3 text-sm font-semibold text-[#04100e] hover:bg-[#9ff3e3]"
      >
        {tier.cta}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="bg-[#050807] py-20 text-white md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[#64d6c1]">Pricing</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
              Start small. Upgrade when the workflow pays for itself.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#a7b8b4]">
              Clear plans for testing, daily solo work, and higher-volume teams.
              Paid checkout runs through Stripe.
            </p>
          </div>

          <div className="inline-flex w-fit rounded-full border border-white/10 bg-[#0b1110] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                !isYearly ? "bg-[#64d6c1] text-[#04100e]" : "text-[#a7b8b4] hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                isYearly ? "bg-[#64d6c1] text-[#04100e]" : "text-[#a7b8b4] hover:text-white"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} isYearly={isYearly} />
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-white/10 bg-[#0b1110] p-5 text-sm leading-6 text-[#a7b8b4]">
          Secure checkout via Stripe. Cancel from the customer portal. Free
          users can test the core workflow before choosing a paid plan.
        </div>
      </div>
    </section>
  );
}
