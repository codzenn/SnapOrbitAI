export function SocialProofBar() {
  const partners = ["Gemini", "Cloudinary", "Stripe", "Clerk", "Prisma", "Next.js"];
  const metrics = [
    { value: "Backgrounds", label: "removed by Cloudinary AI" },
    { value: "Captions", label: "generated with Gemini vision" },
    { value: "Search", label: "powered by semantic embeddings" },
  ];

  return (
    <section className="border-y border-white/10 bg-[#050807] py-10 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-[#64d6c1]">Trusted building blocks</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#a7b8b4]">
              Built with the infrastructure creators already rely on, without
              forcing your media workflow across five separate tabs.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((item) => (
              <div key={item.value} className="rounded-lg border border-white/10 bg-[#0b1110] p-4">
                <p className="text-lg font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-sm leading-5 text-[#a7b8b4]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6">
          {partners.map((partner) => (
            <span key={partner} className="text-sm font-semibold text-white/60">
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
