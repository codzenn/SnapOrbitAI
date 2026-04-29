"use client";

import Link from "next/link";
import { Suspense, type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useSignIn } from "@clerk/nextjs/legacy";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthField } from "@/components/auth/AuthField";
import { safeRedirectPath } from "@/lib/auth-helpers";

function ForgotPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signIn } = useSignIn();

  const redirectTo = useMemo(
    () => safeRedirectPath(searchParams.get("redirect_url"), "/home"),
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setError(null);
    setLoading(true);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: trimmed,
      });

      const factor = res.supportedFirstFactors?.find(
        (f: any) => (f as any).strategy === "reset_password_email_code",
      ) as { emailAddressId: string } | undefined;

      if (factor?.emailAddressId) {
        await res.prepareFirstFactor({
          strategy: "reset_password_email_code",
          emailAddressId: factor.emailAddressId,
        });
      }

      setSent(true);
      router.replace(
        `/reset-password?email=${encodeURIComponent(trimmed)}&redirect_url=${encodeURIComponent(
          redirectTo,
        )}`,
      );
    } catch (err) {
      setSent(true);
      setError(null);
      router.replace(
        `/reset-password?email=${encodeURIComponent(trimmed)}&redirect_url=${encodeURIComponent(
          redirectTo,
        )}`,
      );
      void err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-xl">
          <div className="p-6 md:p-10">
            <Button asChild variant="ghost" className="mb-6 px-0 text-neutral-400 hover:text-white hover:bg-transparent">
              <Link href="/sign-in">
                <ArrowLeft className="mr-2 size-4" />
                Back to Sign In
              </Link>
            </Button>

            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="size-6" />
              </div>
              <h1 className="text-2xl font-bold text-base-content">
                Reset your password
              </h1>
              <p className="text-sm text-base-content/60">
                We’ll email you a code to reset your password.
              </p>
            </div>

            <AuthErrorBanner message={error} />

            {sent ? (
              <div className="rounded-2xl border border-success/25 bg-success/5 px-4 py-3 text-sm text-success">
                If an account exists for that email, a reset code was sent.
              </div>
            ) : null}

            <form className="mt-4 space-y-4" onSubmit={onSubmit}>
              <AuthField
                label="Email address"
                value={email}
                onChange={setEmail}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email address"
                required
                name="email"
              />

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-neutral-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  "Send reset code"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-base-content/45">
              Secured by Clerk
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell min-h-screen px-4 py-8 md:px-8">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
            <div className="w-full rounded-2xl border border-base-300/70 bg-base-100 p-6 shadow-xl md:p-10">
              <div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
                <Loader2 className="size-4 animate-spin" />
                Loading
              </div>
            </div>
          </div>
        </main>
      }
    >
      <ForgotPasswordInner />
    </Suspense>
  );
}
