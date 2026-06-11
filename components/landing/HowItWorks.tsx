import Link from "next/link";
import { ArrowRight, CheckCircle2, CreditCard, UploadCloud, WandSparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Upload one asset or a full batch",
    description:
      "Bring in images and videos, then keep everything organized inside the same media library.",
    icon: UploadCloud,
  },
  {
    number: "02",
    title: "Choose the AI work to run",
    description:
      "Remove backgrounds, expand a canvas, generate captions, audit quality, analyze video, or search by meaning.",
    icon: WandSparkles,
  },
  {
    number: "03",
    title: "Review, download, and keep moving",
    description:
      "Compare outputs, check metadata, export the finished work, and upgrade only when the workflow fits.",
    icon: CheckCircle2,
  },
];

export function HowItWorks() {
  return (
    <section id="workflow" className="bg-[#050807] py-20 text-white md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-[#64d6c1]">Workflow</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
              From upload to client-ready in three steps.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/60">
              The product is built around a simple rhythm: bring assets in,
              run the right AI action, and leave with work that is ready to
              post, pitch, or hand off.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#64d6c1] px-5 py-3 text-sm font-semibold text-[#04100e] hover:bg-[#9ff3e3]"
            >
              Try the free workflow
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="grid gap-5 rounded-lg border border-white/10 bg-[#0b1110] p-5 sm:grid-cols-[72px_1fr] sm:p-6"
              >
                <div className="flex size-14 items-center justify-center rounded-md bg-[#64d6c1] text-[#04100e]">
                  <step.icon className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#64d6c1]">{step.number}</span>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-lg border border-[#64d6c1]/30 bg-[#0b1110] p-5 text-white md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#64d6c1] text-[#04100e]">
                <CreditCard className="size-5" />
              </span>
              <div>
                <h3 className="text-xl font-semibold">Start without a card.</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a7b8b4]">
                  Every major feature has a free trial path, so you can test
                  the real workflow before choosing Pro or Business.
                </p>
              </div>
            </div>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-full bg-[#64d6c1] px-5 py-3 text-sm font-semibold text-[#04100e] hover:bg-[#9ff3e3]"
            >
              Compare plans
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
