'use client';

import Link from 'next/link';

export function Hero() {
  return (
    <section
      className="relative min-h-screen w-full overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 flex items-center justify-center"
      style={{ background: '#080B11' }}
    >
      {/* Aurora background orbs */}
      <style>{`
        @keyframes drift1 {
          from {
            transform: translate(0, 0) scale(1);
          }
          to {
            transform: translate(80px, 60px) scale(1.1);
          }
        }

        @keyframes drift2 {
          from {
            transform: translate(0, 0) scale(1);
          }
          to {
            transform: translate(-60px, 80px) scale(0.95);
          }
        }

        .aurora-orb-1 {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(79, 142, 247, 0.35) 0%, transparent 70%);
          filter: blur(80px);
          top: -100px;
          left: -100px;
          animation: drift1 12s ease-in-out infinite alternate;
          pointer-events: none;
        }

        .aurora-orb-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%);
          filter: blur(100px);
          top: 50px;
          right: -100px;
          animation: drift2 15s ease-in-out infinite alternate;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-orb-1,
          .aurora-orb-2 {
            animation: none;
          }
        }
      `}</style>

      <div className="aurora-orb-1"></div>
      <div className="aurora-orb-2"></div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Eyebrow badge */}
        <div
          className="inline-block px-4 py-2.5 rounded-full border mb-12 font-mono text-xs tracking-widest"
          style={{
            background: 'rgba(79, 142, 247, 0.08)',
            borderColor: '#2A3F5F',
            color: '#7A90B8',
          }}
        >
          <span style={{ color: '#4F8EF7' }}>✦</span> Powered by Gemini 2.5 Flash + Cloudinary AI
        </div>

        {/* Headline with gradient "AI" */}
        <h1
          className="mb-8 font-bold leading-relaxed"
          style={{
            fontSize: 'clamp(44px, 7vw, 80px)',
            color: '#F0F4FF',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            lineHeight: '1.15',
          }}
        >
          Your media, transformed by{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #4F8EF7 0%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI
          </span>{' '}
          in seconds.
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-16 leading-relaxed"
          style={{
            maxWidth: '640px',
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#7A90B8',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            lineHeight: '1.75',
            letterSpacing: '0.3px',
          }}
        >
          Remove backgrounds, expand images, generate captions, analyze quality, and search your assets — all in one
          workspace.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row gap-5 justify-center mb-20">
          <Link
            href="/sign-up"
            className="px-7 py-3 rounded-lg font-medium text-base transition-all duration-200"
            style={{
              background: '#4F8EF7',
              color: '#080B11',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(79, 142, 247, 0.5)';
              e.currentTarget.style.background = '#6BA3F9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#4F8EF7';
            }}
          >
            Start free — no card needed →
          </Link>

          <a
            href="#how-it-works"
            className="px-7 py-3 rounded-lg font-medium text-base border transition-all duration-200"
            style={{
              borderColor: '#2A3F5F',
              color: '#7A90B8',
              background: 'transparent',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F0F4FF';
              e.currentTarget.style.borderColor = '#4F8EF7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#7A90B8';
              e.currentTarget.style.borderColor = '#2A3F5F';
            }}
          >
            See how it works ↓
          </a>
        </div>

        {/* Tech stack badges */}
        <div
          className="flex flex-wrap gap-3 justify-center mb-24 opacity-70"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
        >
          {['Gemini 2.5 Flash', 'Cloudinary AI', 'Next.js', 'Prisma', 'Clerk Auth'].map((tech) => (
            <div
              key={tech}
              className="px-3 py-1.5 rounded border"
              style={{ background: '#0E1420', borderColor: '#1E2D47', color: '#3D5278' }}
            >
              {tech}
            </div>
          ))}
        </div>

        {/* Dashboard Mockup Card */}
        <div
          className="max-w-5xl mx-auto rounded-2xl overflow-hidden border"
          style={{
            background: '#0E1420',
            borderColor: '#2A3F5F',
            boxShadow: '0 0 60px rgba(79, 142, 247, 0.12), 0 40px 80px rgba(0, 0, 0, 0.4)',
            marginTop: '48px',
            animation: 'scrollReveal 0.8s ease 0.3s both',
          }}
        >
          {/* Browser Chrome */}
          <div
            className="px-4 py-3 border-b flex items-center gap-3"
            style={{ borderColor: '#1E2D47', background: '#080B11' }}
          >
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div
              className="flex-1 text-center text-xs"
              style={{ color: '#3D5278', fontFamily: 'Inter, sans-serif' }}
            >
              snaporbitai.vercel.app/home
            </div>
            <div style={{ color: '#3D5278' }}>🔄</div>
          </div>

          {/* Dashboard Content */}
          <div className="flex min-h-96">
            {/* Sidebar */}
            <div
              className="w-48 p-4 border-r flex flex-col"
              style={{ borderColor: '#1E2D47', background: '#080B11' }}
            >
              <div
                className="font-bold mb-8 text-sm"
                style={{ color: '#4F8EF7', fontFamily: 'Syne, sans-serif' }}
              >
                ✦ SnapOrbitAI
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { icon: '📁', label: 'Asset Library', active: true },
                  { icon: '🎬', label: 'Video Studio', active: false },
                  { icon: '⚡', label: 'Batch Process', active: false },
                  { icon: '💎', label: 'Pricing', active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="px-3 py-2 rounded text-xs transition-colors"
                    style={{
                      background: item.active ? '#0F1628' : 'transparent',
                      color: item.active ? '#4F8EF7' : '#7A90B8',
                      borderColor: item.active ? '#4F8EF7' : 'transparent',
                      border: item.active ? '1px solid' : 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {item.icon} {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b" style={{ borderColor: '#1E2D47' }}>
                <h2 className="text-lg font-semibold" style={{ color: '#F0F4FF', fontFamily: 'Syne, sans-serif' }}>
                  Asset Library
                </h2>
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="px-3 py-2 rounded-lg text-xs border"
                  style={{
                    background: '#141C2E',
                    borderColor: '#1E2D47',
                    color: '#7A90B8',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  disabled
                />
              </div>

              {/* Asset Grid */}
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg border overflow-hidden group cursor-pointer"
                    style={{ borderColor: '#1E2D47', background: '#141C2E' }}
                  >
                    {/* Fake image gradient */}
                    <div
                      className="w-full h-full relative overflow-hidden"
                      style={{
                        background:
                          i % 2 === 0
                            ? 'linear-gradient(135deg, #1A3A7A 0%, #0E1420 100%)'
                            : 'linear-gradient(135deg, #3B1F7A 0%, #1A0E2E 100%)',
                      }}
                    >
                      {/* Overlay badge */}
                      <div
                        className="absolute top-2 right-2 text-xs px-2 py-1 rounded"
                        style={{
                          background: i % 2 === 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(79, 142, 247, 0.2)',
                          color: i % 2 === 0 ? '#22C55E' : '#4F8EF7',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {i % 2 === 0 ? '✓ Captions' : '⚡ Audited'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollReveal {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
