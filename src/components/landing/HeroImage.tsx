import React from 'react';

interface HeroImageProps {
  imageSrc?: string;
  altText?: string;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  imageSrc = 'demo1-hero.png',
  altText = 'Calora AI Calorie Tracking Showcase',
}) => {
  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Subtle radial glow background behind hero image */}
      <div className="absolute inset-0 bg-radial from-[#1F6B47]/8 via-[#1F6B47]/2 to-transparent rounded-full blur-3xl transform scale-110 pointer-events-none" />

      {/* Hero Showcase Image */}
      <div className="relative z-10 w-full max-w-[820px] transition-transform duration-500 hover:scale-[1.015]">
        <img
          src={imageSrc}
          alt={altText}
          className="w-full h-auto object-contain block drop-none"
          loading="eager"
        />
      </div>
    </div>
  );
};
