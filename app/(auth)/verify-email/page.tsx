"use client";

import Link from "next/link";
import { Suspense, type FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Mail, RefreshCcw } from "lucide-react";
import { useSignUp } from "@clerk/nextjs/legacy";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthField } from "@/components/auth/AuthField";
import { clerkErrorToMessage, safeRedirectPath } from "@/lib/auth-helpers";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signUp, setActive } = useSignUp();

  const redirectTo = useMemo(
    () => safeRedirectPath(searchParams.get("redirect_url"), "/home"),
    [searchParams],
  );

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onResend = async () => {
    if (!isLoaded || !signUp) return;
    setError(null);
    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err) {
      setError(clerkErrorToMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setError(null);
    setLoading(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (res.status === "complete" && res.createdSessionId) {
        await setActive({ session: res.createdSessionId });
        setDone(true);
        router.replace(redirectTo);
        return;
      }

      setError("Verification could not be completed. Please try again.");
    } catch (err) {
      setError(clerkErrorToMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const emailHint = signUp?.emailAddress ? `Sent to ${signUp.emailAddress}` : null;

  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-xl">
          <div className="p-6 md:p-10">
            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {done ? <CheckCircle2 className="size-6" /> : <Mail className="size-6" />}
              </div>
              <h1 className="text-2xl font-bold text-base-content">
                Verify your email
              </h1>
              <p className="text-sm text-base-content/60">
                Enter the verification code we sent to your email.
              </p>
              {emailHint ? (
                <p className="text-xs text-base-content/45">{emailHint}</p>
              ) : null}
            </div>

            {!signUp && isLoaded ? (
              <div className="rounded-2xl border border-warning/25 bg-warning/5 p-4 text-sm text-warning">
                Your sign-up session is missing. Please start again.
              </div>
            ) : null}

            <AuthErrorBanner message={error} />

            <form className="space-y-4" onSubmit={onSubmit}>
              <AuthField
                label="Verification code"
                value={code}
                onChange={setCode}
                inputMode="numeric"
                placeholder="Enter the code"
                required
                name="code"
              />

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-neutral-200"
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verifying
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </form>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-neutral-400 hover:text-white"
                onClick={onResend}
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend code"}
              </Button>
              <Button asChild variant="ghost" className="w-full text-neutral-400 hover:text-white">
                <Link href={redirectTo ? `/sign-in?redirect_url=${encodeURIComponent(redirectTo)}` : "/sign-in"}>Skip</Link>
              </Button>
            </div>

            <div className="mt-6 text-center text-xs text-base-content/45">
              Secured by Clerk
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailInner />
    </Suspense>
  );
}
