import React from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { TestimonialsSection } from './TestimonialsSection';
import { FeaturesSection } from './FeaturesSection';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';

export const CaloraLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#111111] font-sans antialiased selection:bg-[#1F6B47] selection:text-white">
      {/* Sticky Navigation Header */}
      <Navbar />

      <main>
        {/* Hero Section */}
        <Hero />

        {/* Social Proof / Testimonials Section */}
        <TestimonialsSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Final CTA Section */}
        <FinalCTA />
      </main>

      {/* 4-Column Footer */}
      <Footer />
    </div>
  );
};

export default CaloraLandingPage;
