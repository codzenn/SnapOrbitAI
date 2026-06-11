'use client';

import React, { useRef, useEffect } from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  tag: string;
  iconGradient: string;
  icon: string;
  gridSpan?: string;
  gridRowSpan?: string;
  delay: number;
  specialContent?: React.ReactNode;
}

function FeatureCard({
  title,
  description,
  tag,
  iconGradient,
  icon,
  delay,
  specialContent,
}: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && ref.current) {
          ref.current.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className="scroll-reveal rounded-lg border p-7 hover:border-[#2A3F5F] transition-all duration-200 cursor-pointer group"
      style={{
        background: '#0E1420',
        borderColor: '#1E2D47',
        transitionDelay: `${delay}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 0 30px rgba(79, 142, 247, 0.07)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = 'none';
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ background: iconGradient }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className="mt-4 font-semibold text-lg"
        style={{ color: '#F0F4FF', fontFamily: 'Syne, sans-serif', fontSize: '18px' }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: '#7A90B8', fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: '1.6' }}
      >
        {description}
      </p>

      {/* Special Content */}
      {specialContent && <div className="mt-4">{specialContent}</div>}

      {/* Tag */}
      <div
        className="mt-6 pt-4 border-t text-xs"
        style={{ color: '#3D5278', borderColor: '#1E2D47', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
      >
        {tag}
      </div>
    </div>
  );
}

export function FeaturesGrid() {
  return (
    <section id="features" className="w-full py-20 md:py-28" style={{ background: '#080B11' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: '#3D5278', fontFamily: 'JetBrains Mono, monospace' }}
          >
            THE FEATURE SET
          </div>

          <h2
            className="mb-6"
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              color: '#F0F4FF',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Everything your media workflow needs.
          </h2>

          <p
            className="mx-auto"
            style={{
              maxWidth: '580px',
              color: '#7A90B8',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            Six focused tools. One workspace. No switching between apps.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Background Removal (6 cols, tall) */}
          <div className="md:col-span-6 md:row-span-2">
            <FeatureCard
              title="Background Removal"
              description="One click. Cloudinary AI isolates your subject instantly. Compare before and after with a drag slider."
              tag="Cloudinary AI · Instant"
              iconGradient="linear-gradient(135deg, #1A3A7A, #0E1420)"
              icon="✂️"
              gridSpan="col-span-6"
              gridRowSpan="row-span-2"
              delay={0}
              specialContent={
                <div className="flex gap-4 mt-4 items-center">
                  <div
                    className="flex-1 h-24 rounded-lg border"
                    style={{
                      borderColor: '#1E2D47',
                      background: 'linear-gradient(135deg, #1A3A7A 0%, #0E1420 100%)',
                    }}
                  ></div>
                  <div style={{ color: '#3D5278', fontSize: '12px' }}>→</div>
                  <div
                    className="flex-1 h-24 rounded-lg border"
                    style={{
                      borderColor: '#1E2D47',
                      background: 'repeating-linear-gradient(45deg, #141C2E, #141C2E 10px, #0E1420 10px, #0E1420 20px)',
                    }}
                  ></div>
                </div>
              }
            />
          </div>

          {/* Card 2: AI Captions (3 cols) */}
          <div className="md:col-span-3">
            <FeatureCard
              title="AI Caption Generator"
              description="Gemini reads your image and writes Instagram, LinkedIn, and Twitter captions. Plus 15 ranked hashtags."
              tag="Gemini 2.5 Flash · Vision"
              iconGradient="linear-gradient(135deg, #3B1F7A, #1A0E2E)"
              icon="✦"
              delay={80}
            />
          </div>

          {/* Card 3: Quality Audit (3 cols) */}
          <div className="md:col-span-3">
            <FeatureCard
              title="Quality Audit"
              description="AI scores your image on composition, brightness, blur, and platform suitability before you post."
              tag="Auto · Non-blocking"
              iconGradient="linear-gradient(135deg, #1A3A1A, #0E1A0E)"
              icon="◎"
              delay={160}
              specialContent={
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-baseline gap-2">
                    <span style={{ color: '#22C55E', fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700 }}>
                      8.4
                    </span>
                    <span style={{ color: '#3D5278', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>/10</span>
                  </div>
                  <div className="flex gap-2">
                    {['Instagram', 'LinkedIn', 'Twitter'].map((platform) => (
                      <div
                        key={platform}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#22C55E',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        ✓ {platform}
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
          </div>

          {/* Card 4: Generative Fill (4 cols) */}
          <div className="md:col-span-4">
            <FeatureCard
              title="Generative Fill & Expand"
              description="Extend any image to 1:1, 16:9, 9:16, or 4:5. Cloudinary AI fills the new space naturally."
              tag="Cloudinary · 4 presets"
              iconGradient="linear-gradient(135deg, #1A2A4A, #0E1420)"
              icon="⤢"
              delay={240}
            />
          </div>

          {/* Card 5: Batch Processor (4 cols) */}
          <div className="md:col-span-4">
            <FeatureCard
              title="Smart Batch Processor"
              description="Upload 10 images. Apply BG removal, captions, and audit to all of them. Download as a single ZIP."
              tag="Up to 25 images · ZIP export"
              iconGradient="linear-gradient(135deg, #3A1A1A, #1A0E0E)"
              icon="⚡"
              delay={320}
            />
          </div>

          {/* Card 6: Semantic Search (4 cols) */}
          <div className="md:col-span-4">
            <FeatureCard
              title="Natural Language Search"
              description="Type 'dark moody product photos' and find them. Powered by Gemini embeddings + cosine similarity."
              tag="RAG · Vector search"
              iconGradient="linear-gradient(135deg, #1A3A2A, #0E1A14)"
              icon="⌕"
              delay={400}
            />
          </div>
        </div>
      </div>

      <style>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 500ms ease, transform 500ms ease, border-color 200ms, box-shadow 200ms;
        }

        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-reveal {
            opacity: 1;
            transform: none;
            transition: border-color 200ms, box-shadow 200ms;
          }
        }
      `}</style>
    </section>
  );
}
