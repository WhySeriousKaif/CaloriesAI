import React from 'react';
import { Container } from './Container';
import { Badge } from './Badge';
import { StoreButtons } from './StoreButtons';
import { HeroImage } from './HeroImage';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center py-12 lg:py-20 overflow-hidden bg-[#FAF8F4]">
      {/* Background Subtle Radial Gradient */}
      <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial from-[#1F6B47]/5 via-transparent to-transparent pointer-events-none blur-3xl" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          {/* LEFT SIDE COLUMN */}
          <div className="lg:col-span-5 text-left flex flex-col items-start justify-center">
            {/* Social Badge */}
            <Badge />

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] tracking-tight leading-[1.08] mb-6">
              Meet Calora
              <span className="block mt-1 font-extrabold text-[#111111]">
                Track your calories with just a picture.
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-[#6B7280] leading-relaxed mb-8 max-w-lg font-normal">
              Calora uses AI to instantly recognize meals from a photo and provides accurate calorie counts, macros, nutrition insights, and meal history within seconds.
            </p>

            {/* Primary & Secondary Store Buttons */}
            <StoreButtons fullWidthMobile={true} />

            {/* Trust Text */}
            <div className="flex items-center gap-2 mt-6 text-xs sm:text-sm font-medium text-[#6B7280]">
              <span>No credit card required</span>
              <span>•</span>
              <span>Free forever plan available</span>
            </div>
          </div>

          {/* RIGHT SIDE COLUMN (Floating Hero Image) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <HeroImage imageSrc="demo1-hero.png" altText="Calora AI Calorie Tracker Showcase" />
          </div>
        </div>
      </Container>
    </section>
  );
};
