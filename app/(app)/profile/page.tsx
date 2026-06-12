import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/trial";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const client = await clerkClient();
  const [user, plan, subscription] = await Promise.all([
    client.users.getUser(userId),
    getUserPlan(userId),
    prisma.subscription.findUnique({
      where: { userId },
    }),
  ]);

  const primaryEmail =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "No email added";
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    primaryEmail ||
    "Creator";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SO";
  const planLabel =
    plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Free";
  const subscriptionStatus = subscription?.status
    ? subscription.status.replace(/_/g, " ")
    : "No active subscription";
  const renewalLabel = subscription?.currentPeriodEnd
    ? dateFormatter.format(subscription.currentPeriodEnd)
    : "Unavailable";
  const joinedLabel = user.createdAt
    ? dateFormatter.format(new Date(user.createdAt))
    : "Unavailable";

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Profile
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-neutral-400">
          Review your account details, current plan, and billing status from one
          place.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Account overview</CardTitle>
            <CardDescription className="text-neutral-400">
              Basic profile details used across your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar size="lg" className="ring-1 ring-white/10">
                <AvatarImage src={user.imageUrl} alt={displayName} />
                <AvatarFallback className="bg-white/10 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                <p className="text-sm text-neutral-400">{primaryEmail}</p>
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">
                  {planLabel} plan
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-white">
                  <Mail className="size-4 text-neutral-400" />
                  <p className="text-sm font-semibold">Primary email</p>
                </div>
                <p className="text-sm text-neutral-400">{primaryEmail}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-white">
                  <CalendarDays className="size-4 text-neutral-400" />
                  <p className="text-sm font-semibold">Member since</p>
                </div>
                <p className="text-sm text-neutral-400">{joinedLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription className="text-neutral-400">
                Current billing and plan details for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CreditCard className="size-4 text-neutral-400" />
                  <p className="text-sm font-semibold text-white">Plan status</p>
                </div>
                <p className="text-sm text-neutral-400">
                  {planLabel} plan - {subscriptionStatus}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BadgeCheck className="size-4 text-neutral-400" />
                  <p className="text-sm font-semibold text-white">Renewal date</p>
                </div>
                <p className="text-sm text-neutral-400">{renewalLabel}</p>
              </div>
              <Button asChild className="w-full bg-white text-black hover:bg-neutral-200">
                <Link href="/pricing">
                  {plan === "free" ? "View plans" : "Renew or change plan"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Account security</CardTitle>
              <CardDescription className="text-neutral-400">
                Key identity details connected to this workspace login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mt-0.5 size-4 text-neutral-400" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Verified identity
                  </p>
                  <p className="text-sm text-neutral-400">
                    Your account is managed through Clerk authentication with your
                    current sign-in email.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <Sparkles className="mt-0.5 size-4 text-neutral-400" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Workspace access
                  </p>
                  <p className="text-sm text-neutral-400">
                    Profile data, billing access, and plan entitlements are tied
                    to this signed-in account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
