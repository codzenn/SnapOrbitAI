"use client";

import Link from "next/link";
import { Suspense, type FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@clerk/nextjs/legacy";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthField } from "@/components/auth/AuthField";
import { PasswordField } from "@/components/auth/PasswordField";
import { clerkErrorToMessage, safeRedirectPath } from "@/lib/auth-helpers";

async function sendResetCode(signIn: any, email: string) {
  const res = await signIn.create({
    strategy: "reset_password_email_code",
    identifier: email,
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
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();

  const redirectTo = useMemo(
    () => safeRedirectPath(searchParams.get("redirect_url"), "/home"),
    [searchParams],
  );

  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(Boolean(initialEmail));
  const [done, setDone] = useState(false);

  const onSend = async () => {
    if (!isLoaded || !signIn) return;
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendResetCode(signIn, trimmed);
      setSent(true);
      router.replace(
        `/reset-password?email=${encodeURIComponent(trimmed)}&redirect_url=${encodeURIComponent(
          redirectTo,
        )}`,
      );
    } catch (err) {
      setError(clerkErrorToMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }
    if (!code.trim()) {
      setError("Reset code is required");
      return;
    }
    if (!newPassword) {
      setError("New password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
      });

      if (res.status === "needs_new_password") {
        const updated = await res.resetPassword({ password: newPassword });
        if (updated.status === "complete" && updated.createdSessionId) {
          await setActive({ session: updated.createdSessionId });
          setDone(true);
          router.replace(redirectTo);
          return;
        }
        setError("Password reset could not be completed.");
        return;
      }

      if (res.status === "complete" && res.createdSessionId) {
        await setActive({ session: res.createdSessionId });
        setDone(true);
        router.replace(redirectTo);
        return;
      }

      setError("Password reset could not be completed.");
    } catch (err) {
      setError(clerkErrorToMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-xl">
          <div className="p-6 md:p-10">
            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="size-6" />
              </div>
              <h1 className="text-2xl font-bold text-base-content">
                Set a new password
              </h1>
              <p className="text-sm text-base-content/60">
                Enter the code from your email and choose a new password.
              </p>
            </div>

            <AuthErrorBanner message={error} />

            {done ? (
              <div className="rounded-2xl border border-success/25 bg-success/5 px-4 py-3 text-sm text-success">
                Password updated successfully.
              </div>
            ) : null}

            {!sent ? (
              <div className="space-y-4">
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
                <button
                  type="button"
                  className="btn btn-primary w-full rounded-xl"
                  onClick={onSend}
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
                </button>
              </div>
            ) : (
              <>
                <form className="space-y-4" onSubmit={onSubmit}>
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
                  <AuthField
                    label="Reset code"
                    value={code}
                    onChange={setCode}
                    inputMode="numeric"
                    placeholder="Enter the code"
                    required
                    name="code"
                  />
                  <PasswordField
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                    placeholder="Create a new password"
                    required
                    name="newPassword"
                  />
                  <PasswordField
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    required
                    name="confirmNewPassword"
                  />

                  <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-neutral-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Updating
                      </>
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-neutral-400 hover:text-white"
                    onClick={onSend}
                    disabled={loading}
                  >
                    {loading ? "Resending..." : "Resend code"}
                  </Button>
                  <Button asChild variant="ghost" className="w-full text-neutral-400 hover:text-white">
                    <Link
                      href={
                        redirectTo
                          ? `/sign-in?redirect_url=${encodeURIComponent(redirectTo)}`
                          : "/sign-in"
                      }
                    >
                      Back to sign in
                    </Link>
                  </Button>
                </div>
              </>
            )}

            <div className="mt-6 text-center text-xs text-base-content/45">
              Secured by Clerk
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordInner />
    </Suspense>
  );
}
