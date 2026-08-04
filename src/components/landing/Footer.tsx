import React from 'react';
import { Container } from './Container';
import { FooterColumn, FooterLink } from './FooterColumn';
import { SocialLinks } from './SocialLinks';

const PRODUCT_LINKS: FooterLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Pricing', href: '#pricing' },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: 'FAQ', href: '#faq' },
  { label: 'Blog', href: '#blog' },
  { label: 'Support', href: '#support' },
  { label: 'Contact', href: '#contact' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: 'About', href: '#about' },
  { label: 'Careers', href: '#careers' },
  { label: 'Press', href: '#press' },
  { label: 'Security', href: '#security' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200/80 pt-20 pb-10 text-left">
      <Container>
        {/* 4-Column Desktop Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 pb-16 border-b border-gray-100">
          {/* Column 1 (2 cols wide): Brand & Info */}
          <div className="lg:col-span-2 flex flex-col items-start gap-4">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1F6B47] flex items-center justify-center text-white">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.05 12.04c-.03-2.9 2.37-4.3 2.48-4.37-1.35-1.98-3.45-2.25-4.2-2.28-1.79-.18-3.49 1.05-4.4 1.05-.91 0-2.31-1.03-3.8-1-1.95.03-3.75 1.13-4.75 2.88-2.03 3.52-.52 8.73 1.46 11.58.97 1.4 2.12 2.96 3.63 2.9 1.46-.06 2.01-.94 3.77-.94 1.76 0 2.26.94 3.8.91 1.57-.03 2.56-1.42 3.52-2.83 1.11-1.62 1.57-3.19 1.6-3.27-.04-.02-3.07-1.18-3.11-4.63z" />
                  <path d="M14.6 3.6c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.41-1.63z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-[#111111] tracking-tight">Calora</span>
            </a>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs">
              AI-powered calorie tracking made effortless.
            </p>
            <div className="flex items-center gap-2.5 mt-2">
              <a href="#app-store" className="px-3.5 py-1.5 rounded-lg bg-[#111111] text-white text-xs font-semibold hover:bg-[#1F6B47] transition-colors">
                App Store
              </a>
              <a href="#google-play" className="px-3.5 py-1.5 rounded-lg bg-[#111111] text-white text-xs font-semibold hover:bg-[#1F6B47] transition-colors">
                Google Play
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <FooterColumn title="Product" links={PRODUCT_LINKS} />

          {/* Column 3: Resources */}
          <FooterColumn title="Resources" links={RESOURCE_LINKS} />

          {/* Column 4: Company */}
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>

        {/* Bottom Footer Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <p>© {new Date().getFullYear()} Calora. All rights reserved.</p>
          <SocialLinks />
        </div>
      </Container>
    </footer>
  );
};
