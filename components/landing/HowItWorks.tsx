'use client';

import React, { useRef, useEffect } from 'react';

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  delay: number;
}

function StepCard({ number, title, description, delay }: StepCardProps) {
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
      className="scroll-reveal flex-1 rounded-lg border p-8 relative"
      style={{
        background: '#0E1420',
        borderColor: '#1E2D47',
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Step number watermark */}
      <div
        className="absolute top-6 left-6 opacity-30"
        style={{
          fontSize: 'clamp(48px, 6vw, 72px)',
          color: '#1E2D47',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {number}
      </div>

      {/* Content */}
      <div className="relative z-10 mt-8">
        <h3
          className="font-semibold mb-4"
          style={{ color: '#F0F4FF', fontFamily: 'Syne, sans-serif', fontSize: '20px' }}
        >
          {title}
        </h3>

        <p
          className="leading-relaxed"
          style={{ color: '#7A90B8', fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.6 }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full py-20 md:py-28" style={{ background: '#080B11' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: '#3D5278', fontFamily: 'JetBrains Mono, monospace' }}
          >
            HOW IT WORKS
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
            Try every feature.
            <br />
            Free. Right now.
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
            No credit card. No time limit. One trial use of every feature before you decide to upgrade.
          </p>
        </div>

        {/* Steps Container */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          {/* Arrow - visible only on desktop between cards */}
          <div className="hidden md:flex items-center justify-center absolute left-1/3 top-1/2">
            <div style={{ color: '#2A3F5F', fontSize: '24px' }}>→</div>
          </div>

          <StepCard
            number="01"
            title="Sign up in seconds"
            description="Create your account with email or Google. No credit card. No commitment. Your free trial starts immediately."
            delay={0}
          />

          <StepCard
            number="02"
            title="Try every feature once"
            description="Background removal, generative fill, AI captions, quality audit, batch processing, semantic search — try each once, completely free."
            delay={80}
          />

          <StepCard
            number="03"
            title="Upgrade when it clicks"
            description="When the workflow fits, move to Pro ($12/mo) for unlimited access. Or Business ($29/mo) for teams and analytics."
            delay={160}
          />
        </div>
      </div>

      <style>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 500ms ease, transform 500ms ease;
        }

        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-reveal {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
