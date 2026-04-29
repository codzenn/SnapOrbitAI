"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, PlayCircle, ArrowLeft, CheckCircle2, CircleAlert, X, Loader2, Camera, User, Video, Rocket } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PricingContent() {
  const { userId, isSignedIn, isLoaded } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<"success" | "cancelled" | null>(null);
  const [coupon, setCoupon] = useState<string>("");
  const searchParams = useSearchParams();

  const couponLabel = useMemo(() => coupon.trim().toUpperCase(), [coupon]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const autoPlan = searchParams.get("plan");
      if (autoPlan) {
        window.history.replaceState({}, "", "/pricing");
        handleUpgrade(autoPlan);
      }
    }
  }, [isLoaded, isSignedIn, searchParams]);

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") {
      setBillingStatus("success");
    } else if (billing === "cancelled") {
      setBillingStatus("cancelled");
    }
  }, [searchParams]);

  const handleUpgrade = async (planId: string) => {
    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent(`/pricing?plan=${planId}`)}`;
      return;
    }

    if (planId === "free") {
      window.location.href = "/home";
      return;
    }

    try {
      setLoading(planId);
      setError(null);
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: planId, coupon: coupon.trim() || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      const loaded = await loadRazorpayCheckout();
      if (!loaded || !window.Razorpay) {
        throw new Error("Failed to load Razorpay checkout. Please try again.");
      }

      if (!data.keyId || !data.subscriptionId) {
        throw new Error("Invalid checkout response");
      }

      const rzpay = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "SnapOrbitAI",
        description: planId === "pro" ? "Upgrade to Professional" : "Upgrade to Enterprise",
        prefill: {
          email: data.email || undefined,
        },
        ...(data.offerId ? { offer_id: data.offerId } : {}),
        notes: {
          plan: planId,
          coupon: couponLabel,
        },
        handler: async (rsp: any) => {
          try {
            const verifyRes = await fetch("/api/billing/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan: planId,
                razorpay_payment_id: rsp.razorpay_payment_id,
                razorpay_subscription_id: rsp.razorpay_subscription_id,
                razorpay_signature: rsp.razorpay_signature,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok || !verifyJson.ok) {
              throw new Error(verifyJson.error || "Payment verification failed");
            }
            window.location.href = "/home";
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed");
          } finally {
            setLoading(null);
          }
        },
        modal: {
          ondismiss: () => {
            setBillingStatus("cancelled");
            setLoading(null);
          },
        },
      });

      rzpay.open();
    } catch (err) {
      console.error("Upgrade error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.",
      );
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md px-4 md:px-8">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <Camera className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-white">SnapOrbitAI</p>
            </div>
          </Link>
          <Button asChild variant="ghost" className="text-neutral-300 hover:text-white hover:bg-white/10">
            <Link href={userId ? "/home" : "/"}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
        {billingStatus === "success" && (
          <div className="flex items-start gap-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-green-400 shadow-sm mb-8">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div className="flex flex-1 flex-col gap-1">
              <h3 className="font-bold">Upgrade successful</h3>
              <p className="text-sm opacity-90">Your subscription is now active. Premium features should be unlocked.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setBillingStatus(null)} className="h-6 w-6 text-green-400 hover:bg-green-500/20">
              <X className="size-4" />
            </Button>
          </div>
        )}

        {billingStatus === "cancelled" && (
          <div className="flex items-start gap-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-400 shadow-sm mb-8">
            <CircleAlert className="mt-0.5 size-5 shrink-0" />
            <div className="flex flex-1 flex-col gap-1">
              <h3 className="font-bold">Checkout cancelled</h3>
              <p className="text-sm opacity-90">No changes were made to your subscription.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setBillingStatus(null)} className="h-6 w-6 text-yellow-400 hover:bg-yellow-500/20">
              <X className="size-4" />
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 shadow-sm mb-8">
            <div className="flex items-center gap-3">
              <CircleAlert className="size-5" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setError(null)} className="border-red-500/30 hover:bg-red-500/20 text-red-400">
              Dismiss
            </Button>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-white">
            Choose your plan
          </h1>
          <p className="mt-4 text-lg text-neutral-400">
            From free guest trials to professional media workflows.
          </p>
        </div>

        <Card className="mt-10 bg-black/40 border-white/10 text-white backdrop-blur-sm max-w-xl mx-auto">
          <CardContent className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-sm font-semibold text-white">Coupon code</Label>
              <p className="text-xs text-neutral-400 mt-1">Optional. Applied at checkout if configured.</p>
            </div>
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon"
              className="bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-white/20 w-full sm:w-64"
            />
          </CardContent>
        </Card>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`bg-black/40 border-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] flex flex-col ${
                plan.highlighted ? "ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20" : ""
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {plan.id === "free" && <div className="p-2 rounded-xl bg-white/10 text-white"><User className="size-5" /></div>}
                    {plan.id === "pro" && <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Video className="size-5" /></div>}
                    {plan.id === "pro_plus" && <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Rocket className="size-5" /></div>}
                    <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                  </div>
                  {plan.highlighted && (
                    <span className="rounded-full bg-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-neutral-400">/month</span>
                </div>
              </CardHeader>
              
              <div className="mx-6 h-px bg-white/10"></div>

              <CardContent className="flex-grow pt-6">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                        <Check className="size-3.5" />
                      </div>
                      <span className="text-neutral-300 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading !== null}
                  variant={plan.highlighted ? "default" : "outline"}
                  className={`w-full ${plan.highlighted ? "bg-white text-black hover:bg-neutral-200" : "border-white/20 bg-transparent text-white hover:bg-white/10"} ${loading === plan.id ? "opacity-50 cursor-wait" : ""}`}
                >
                  {loading === plan.id ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Redirecting...</>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="mt-16 bg-black/40 border-white/10 text-white backdrop-blur-sm text-center">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-white">Have more questions?</h3>
            <p className="mt-2 text-neutral-400">
              Contact our support team for custom enterprise solutions or volume discounts.
            </p>
            <Button variant="outline" className="mt-6 border-white/20 bg-transparent text-white hover:bg-white/10">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <Loader2 className="size-8 animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}