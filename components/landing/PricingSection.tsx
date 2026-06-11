'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface PricingTier {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyLabel: string;
  yearlyLabel: string;
  accentColor: string;
  textColor: string;
  borderColor: string;
  isMostPopular: boolean;
  features: string[];
  ctaText: string;
  ctaStyle: 'solid' | 'outline';
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyLabel: 'No credit card required',
    yearlyLabel: 'No credit card required',
    accentColor: '#7A90B8',
    textColor: '#7A90B8',
    borderColor: '#1E2D47',
    isMostPopular: false,
    features: [
      '1 trial use of every feature',
      'Background removal',
      'Generative fill',
      'AI captions + hashtags',
      'Quality audit',
      'Batch (3 images)',
      'Semantic search (3 searches)',
    ],
    ctaText: 'Start free →',
    ctaStyle: 'outline',
  },
  {
    name: 'Pro',
    monthlyPrice: 12,
    yearlyPrice: 99,
    monthlyLabel: 'or $99/yr — save 31%',
    yearlyLabel: 'or $12/mo — save 31%',
    accentColor: '#4F8EF7',
    textColor: '#4F8EF7',
    borderColor: '#4F8EF7',
    isMostPopular: true,
    features: [
      'Everything in Free',
      'Unlimited background removal',
      'Unlimited generative fill',
      'Unlimited AI captions',
      'Unlimited quality audits',
      '50 batch jobs/month (10 images)',
      '100 semantic searches/month',
      'Video Studio (analyze + captions)',
      '500 assets · 90-day storage',
    ],
    ctaText: 'Start Pro →',
    ctaStyle: 'solid',
  },
  {
    name: 'Business',
    monthlyPrice: 29,
    yearlyPrice: 249,
    monthlyLabel: 'or $249/yr — save 28%',
    yearlyLabel: 'or $29/mo — save 28%',
    accentColor: '#A855F7',
    textColor: '#A855F7',
    borderColor: '#2A3F5F',
    isMostPopular: false,
    features: [
      'Everything in Pro',
      'Unlimited batch (25 images/job)',
      'Unlimited searches',
      'Unlimited assets + storage',
      'Usage analytics dashboard',
      'Stripe customer portal',
      'Priority support (12hr)',
    ],
    ctaText: 'Start Business →',
    ctaStyle: 'outline',
  },
];

function PricingCard({ tier, isYearly }: { tier: PricingTier; isYearly: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
  const label = isYearly ? tier.yearlyLabel : tier.monthlyLabel;

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
      className="scroll-reveal rounded-lg border p-8"
      style={{
        background: tier.isMostPopular
          ? 'linear-gradient(145deg, #0E1420 0%, #0F1628 100%)'
          : '#0E1420',
        borderColor: tier.borderColor,
        boxShadow: tier.isMostPopular
          ? '0 0 60px rgba(79, 142, 247, 0.15)'
          : 'none',
        transform: tier.isMostPopular ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 300ms ease',
      }}
    >
      {/* Most Popular Badge */}
      {tier.isMostPopular && (
        <div
          className="inline-block px-3 py-1 rounded text-xs font-semibold mb-4"
          style={{
            background: '#4F8EF7',
            color: '#080B11',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          ★ MOST POPULAR
        </div>
      )}

      {/* Plan Name */}
      <div
        className="text-xs font-bold uppercase tracking-wide mb-2"
        style={{
          color: tier.textColor,
          fontFamily: 'Syne, sans-serif',
        }}
      >
        {tier.name}
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-1">
        <span
          style={{
            fontSize: 'clamp(36px, 5vw, 52px)',
            color: '#F0F4FF',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
          }}
        >
          ${price}
        </span>
        <span
          style={{
            color: '#3D5278',
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
          }}
        >
          /mo
        </span>
      </div>

      {/* Price Label */}
      <p
        className="text-xs mb-6"
        style={{
          color: '#3D5278',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {label}
      </p>

      {/* Divider */}
      <div
        className="my-6"
        style={{
          borderTop: '1px solid #1E2D47',
        }}
      ></div>

      {/* Features List */}
      <ul className="space-y-4 mb-10">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="text-sm flex items-start gap-3"
            style={{
              color: '#7A90B8',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            <span style={{ color: tier.accentColor, marginRight: '4px', marginTop: '2px', flexShrink: 0 }}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href={`/sign-${tier.name === 'Free' ? 'up' : 'up'}`}
        className={`block w-full py-3 rounded-lg font-medium text-center transition-all duration-200`}
        style={{
          background: tier.ctaStyle === 'solid' ? tier.accentColor : 'transparent',
          color: tier.ctaStyle === 'solid' ? '#080B11' : tier.accentColor,
          border: tier.ctaStyle === 'outline' ? `1px solid ${tier.accentColor}` : 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (tier.ctaStyle === 'solid') {
            el.style.boxShadow = `0 0 20px ${tier.accentColor}40`;
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = 'none';
        }}
      >
        {tier.ctaText}
      </Link>
    </div>
  );
}

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="w-full py-24 md:py-32" style={{ background: '#080B11' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: '#3D5278', fontFamily: 'JetBrains Mono, monospace' }}
          >
            PRICING
          </div>

          <h2
            className="mb-8"
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              color: '#F0F4FF',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Simple pricing.
            <br />
            No surprises.
          </h2>
        </div>

        {/* Monthly/Yearly Toggle */}
        <div className="flex justify-center items-center gap-4 mb-16">
          <span
            style={{
              color: isYearly ? '#3D5278' : '#F0F4FF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            }}
          >
            Monthly
          </span>

          <button
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-12 h-6 rounded-full transition-all duration-300 border"
            style={{
              background: isYearly ? '#4F8EF7' : '#0E1420',
              borderColor: isYearly ? '#4F8EF7' : '#1E2D47',
            }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300"
              style={{
                transform: isYearly ? 'translateX(24px)' : 'translateX(2px)',
              }}
            ></div>
          </button>

          <span
            style={{
              color: isYearly ? '#F0F4FF' : '#3D5278',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            }}
          >
            Yearly — save ~30%
          </span>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} isYearly={isYearly} />
          ))}
        </div>

        {/* Trust Row */}
        <div
          className="flex flex-wrap justify-center items-center gap-3 text-xs text-center"
          style={{
            color: '#3D5278',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          }}
        >
          <span>🔒 Secure checkout via Stripe</span>
          <span>·</span>
          <span>↩ 7-day refund policy</span>
          <span>·</span>
          <span>✦ Cancel anytime, no penalties</span>
        </div>
      </div>

      <style>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 500ms ease, transform 500ms ease, all 300ms ease;
        }

        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-reveal {
            opacity: 1;
            transform: none;
            transition: all 300ms ease;
          }
        }
      `}</style>
    </section>
  );
}
