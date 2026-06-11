'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? 'border-b border-[#1E2D47]' : ''
      }`}
      style={{
        background: 'rgba(8, 11, 17, 0.8)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-xl font-bold" style={{ color: '#4F8EF7' }}>
          <span>✦</span>
          <span>SnapOrbitAI</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[#7A90B8] hover:text-[#F0F4FF] transition-colors duration-150">
            Features
          </a>
          <a href="#pricing" className="text-[#7A90B8] hover:text-[#F0F4FF] transition-colors duration-150">
            Pricing
          </a>
          <Link href="/sign-in" className="text-[#7A90B8] hover:text-[#F0F4FF] transition-colors duration-150">
            Sign In
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Link
            href="/sign-up"
            className="px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200"
            style={{
              background: '#4F8EF7',
              color: '#080B11',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(79, 142, 247, 0.4)';
              e.currentTarget.style.background = '#6BA3F9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#4F8EF7';
            }}
          >
            Start Free →
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex flex-col gap-1.5"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <div className="w-6 h-0.5 bg-[#7A90B8]"></div>
          <div className="w-6 h-0.5 bg-[#7A90B8]"></div>
          <div className="w-6 h-0.5 bg-[#7A90B8]"></div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden px-6 py-6 border-t"
          style={{ background: '#0E1420', borderColor: '#1E2D47' }}
        >
          <div className="flex flex-col gap-4">
            <a href="#features" className="text-[#7A90B8]">
              Features
            </a>
            <a href="#pricing" className="text-[#7A90B8]">
              Pricing
            </a>
            <Link href="/sign-in" className="text-[#7A90B8]">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-lg font-medium text-sm w-full text-center"
              style={{ background: '#4F8EF7', color: '#080B11' }}
            >
              Start Free →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
