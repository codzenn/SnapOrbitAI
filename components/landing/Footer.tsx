'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="w-full border-t py-12 md:py-16"
      style={{
        background: '#080B11',
        borderColor: '#1E2D47',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Logo and Tagline */}
        <div className="mb-8 pb-8 border-b" style={{ borderColor: '#1E2D47' }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: '#4F8EF7' }}>
            <span>✦</span>
            <span className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              SnapOrbitAI
            </span>
          </div>
          <p
            style={{
              color: '#7A90B8',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            }}
          >
            Built for creators and developers.
          </p>
        </div>

        {/* Links and Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Links */}
          <div className="flex gap-6">
            <a
              href="#pricing"
              style={{
                color: '#3D5278',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7A90B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#3D5278';
              }}
            >
              Pricing
            </a>
            <Link
              href="/sign-in"
              style={{
                color: '#3D5278',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7A90B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#3D5278';
              }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              style={{
                color: '#3D5278',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7A90B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#3D5278';
              }}
            >
              Sign Up
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3D5278',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7A90B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#3D5278';
              }}
            >
              GitHub
            </a>
          </div>

          {/* Copyright */}
          <div
            style={{
              color: '#3D5278',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
            }}
          >
            © 2026 SnapOrbitAI · Powered by Gemini + Cloudinary · Built with Next.js
          </div>
        </div>
      </div>
    </footer>
  );
}
