import React, { useState } from 'react';
import { Container } from './Container';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F4]/90 backdrop-blur-md border-b border-gray-200/60 transition-all">
      <Container>
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand Logo & Text */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-[#1F6B47] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.05 12.04c-.03-2.9 2.37-4.3 2.48-4.37-1.35-1.98-3.45-2.25-4.2-2.28-1.79-.18-3.49 1.05-4.4 1.05-.91 0-2.31-1.03-3.8-1-1.95.03-3.75 1.13-4.75 2.88-2.03 3.52-.52 8.73 1.46 11.58.97 1.4 2.12 2.96 3.63 2.9 1.46-.06 2.01-.94 3.77-.94 1.76 0 2.26.94 3.8.91 1.57-.03 2.56-1.42 3.52-2.83 1.11-1.62 1.57-3.19 1.6-3.27-.04-.02-3.07-1.18-3.11-4.63z" />
                <path d="M14.6 3.6c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.41-1.63z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-[#111111] tracking-tight">Calora</span>
          </a>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111111] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-5">
            <a
              href="#login"
              className="text-sm font-semibold text-[#111111] hover:text-[#1F6B47] transition-colors"
            >
              Login
            </a>
            <a
              href="#app-store"
              className="px-4 py-2.5 rounded-[24px] bg-[#1F6B47] hover:bg-[#165236] text-white text-xs font-semibold tracking-wide transition-all shadow-xs hover:shadow transform hover:-translate-y-0.5"
            >
              Download App
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#111111] hover:bg-gray-200/50 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200/60 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#111111] px-2 py-1.5 hover:text-[#1F6B47]"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-200/60 flex flex-col gap-2.5">
              <a
                href="#login"
                className="w-full text-center py-2.5 text-sm font-semibold text-[#111111]"
              >
                Login
              </a>
              <a
                href="#app-store"
                className="w-full text-center py-3 rounded-[24px] bg-[#1F6B47] text-white font-semibold text-sm"
              >
                Download App
              </a>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};
