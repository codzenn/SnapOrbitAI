"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type BillingCycle = "monthly" | "yearly";

const PRICE_IDS = {
  pro: {
    monthly: "pro_monthly",
    yearly: "pro_yearly",
  },
  business: {
    monthly: "business_monthly",
    yearly: "business_yearly",
  },
} as const;

const PRICING = [
  {
    id: "free",
    name: "Free",
    monthly: "$0",
    yearly: "$0",
    highlight: false,
    description: "For trying the core workflow with limited usage.",
    cta: "Start Free",
    features: [
      "1 free trial of every feature",
      "1 Video Analysis run",
      "1 Video Caption generation",
      "1 Aspect Ratio conversion",
      "Unlimited Video Compression",
      "Max 5 assets stored for 7 days",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: "$12",
    yearly: "$99",
    description: "For solo creators and marketers running daily AI workflows.",
    cta: "Start Pro",
    highlight: true,
    features: [
      "Unlimited background removal",
      "Unlimited generative fill",
      "Unlimited captions and quality audits",
      "Natural-language asset search",
      "Batch processing up to 10 images",
      "Unlimited Video Analysis",
      "Unlimited Video Captions",
      "50 aspect ratio conversions per month",
      "Unlimited Video Compression",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthly: "$29",
    yearly: "$249",
    highlight: false,
    description: "For teams that need unlimited workflows and analytics.",
    cta: "Start Business",
    features: [
      "Everything in Pro",
      "Batch processing up to 25 images",
      "Unlimited aspect ratio conversions",
      "Business usage analytics dashboard",
      "Stripe customer portal access",
      "Priority support",
    ],
  },
] as const;

function PricingContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const autoPlan = searchParams.get("plan");

  const subtitle = useMemo(
    () =>
      cycle === "monthly"
        ? "Billed monthly. Cancel any time."
        : "Billed yearly. Save more over 12 months.",
    [cycle],
  );

  const startCheckout = useCallback(async (planId: "pro" | "business") => {
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent(`/pricing?plan=${planId}`)}`;
      return;
    }

    try {
      setLoadingPlan(planId);
      setError(null);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: PRICE_IDS[planId][cycle],
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not start Stripe checkout.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start Stripe checkout.",
      );
      setLoadingPlan(null);
    }
  }, [cycle, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !autoPlan || !isSignedIn) {
      return;
    }

    if (autoPlan === "pro" || autoPlan === "business") {
      void startCheckout(autoPlan);
      window.history.replaceState({}, "", "/pricing");
    }
  }, [autoPlan, isLoaded, isSignedIn, startCheckout]);

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white">
            <BrandMark className="size-9" />
            SnapOrbitAI
          </Link>
          <Button asChild variant="ghost" className="text-neutral-300 hover:bg-white/10 hover:text-white">
            <Link href={isSignedIn ? "/home" : "/"}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-neutral-300">
            <Sparkles className="size-4" />
            Flexible plans for every stage
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">
            Pricing Plans
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
            Pick the plan that matches your workflow and upgrade any time.
          </p>
          <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                cycle === "monthly"
                  ? "bg-white text-black"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                cycle === "yearly"
                  ? "bg-white text-black"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {error ? (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {PRICING.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col border-white/10 bg-black/40 text-white backdrop-blur-sm ${
                plan.highlight ? "ring-2 ring-white/20" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.highlight ? (
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
                      Most Popular
                    </span>
                  ) : null}
                </div>
                <CardDescription className="text-neutral-400">
                  {plan.description}
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-extrabold">
                    {cycle === "monthly" ? plan.monthly : plan.yearly}
                  </span>
                  <span className="ml-2 text-neutral-400">
                    /{cycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-neutral-300">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                        <Check className="size-3.5" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.id === "free" ? (
                  <Button asChild className="w-full bg-white text-black hover:bg-neutral-200">
                    <Link href={isSignedIn ? "/home" : "/sign-up"}>{plan.cta}</Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void startCheckout(plan.id as "pro" | "business")}
                    disabled={loadingPlan !== null}
                    className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {[
            {
              question: "What happens after the free trial?",
              answer: "Upgrade to Pro ($12/mo) or Business ($29/mo) for unlimited image AI, plus Video Studio access and higher conversion limits.",
            },
            {
              question: "Is there a free trial for Pro or Business?",
              answer: "No, but the free plan lets you test every major workflow once before upgrading.",
            },
            {
              question: "Can I cancel anytime?",
              answer: "Yes. Manage or cancel your subscription from the Stripe customer portal.",
            },
          ].map((item) => (
            <Card key={item.question} className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">{item.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-neutral-400">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          <Loader2 className="size-8 animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
