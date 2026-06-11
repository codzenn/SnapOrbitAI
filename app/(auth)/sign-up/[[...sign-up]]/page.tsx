import Link from "next/link";
import { ArrowLeft, Crown, ShieldCheck } from "lucide-react";
import { SignUp } from "@clerk/nextjs";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800/20 via-black to-black z-0"></div>
      
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-0 overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
          <section className="flex flex-col justify-between gap-8 border-r border-white/10 bg-white/5 px-6 py-10 md:px-10">
            <div className="space-y-8">
              <Button asChild variant="ghost" className="w-fit px-0 text-neutral-400 hover:bg-transparent hover:text-white">
                <Link href="/">
                  <ArrowLeft className="mr-2 size-4" />
                  Back to home
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <BrandMark className="size-12" />
                <div>
                  <p className="text-xl font-bold tracking-tight text-white">SnapOrbitAI</p>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    Secure creator workspace
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">
                  Start your creative journey today.
                </h1>
                <p className="max-w-md text-base leading-relaxed text-neutral-400">
                  Built for creators and developers.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-400" />
                <div>
                  <p className="font-semibold text-white">Enterprise security</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                    Your assets and data are protected by industry-leading security standards.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
                <Crown className="mt-0.5 size-5 shrink-0 text-yellow-500" />
                <div>
                  <p className="font-semibold text-white">Flexible pricing</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                    Start with our Starter tier and upgrade to Professional when your workflow demands it.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center px-4 py-8 md:px-8 md:py-10 bg-black/20">
            <SignUp
              fallbackRedirectUrl="/home"
              forceRedirectUrl="/home"
              signInUrl="/sign-in"
              appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl rounded-2xl",
                headerTitle: "text-white",
                headerSubtitle: "text-neutral-400",
                socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors",
                socialButtonsBlockButtonText: "text-white font-medium",
                dividerLine: "bg-white/10",
                dividerText: "text-neutral-500",
                formFieldLabel: "text-neutral-300",
                formFieldInput: "bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-white/30 focus:ring-white/20 transition-all",
                formButtonPrimary: "bg-white text-black hover:bg-neutral-200 transition-colors font-medium",
                footerActionText: "text-neutral-400",
                footerActionLink: "text-white hover:text-neutral-300 transition-colors",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-neutral-400 hover:text-white transition-colors"
              }
            }} />
          </section>
        </div>
      </div>
    </main>
  );
}
