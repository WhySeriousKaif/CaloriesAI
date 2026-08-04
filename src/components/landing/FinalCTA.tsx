import React from 'react';
import { Container } from './Container';
import { RatingRow } from './RatingRow';
import { StoreButtons } from './StoreButtons';

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-[120px] pb-20 bg-radial from-[#1F6B47]/6 via-[#FAF8F4] to-[#FAF8F4] text-center relative overflow-hidden">
      <Container>
        <div className="max-w-[800px] mx-auto flex flex-col items-center justify-center">
          {/* 5 Green Stars */}
          <div className="text-[#1F6B47] text-2xl tracking-[4px] mb-6 font-bold">
            ★★★★★
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-[64px] font-bold text-[#111111] tracking-tight leading-[1.1] mb-5 max-w-[700px]">
            Track calories smarter, not harder.
          </h2>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#6B7280] leading-[1.7] max-w-[700px] mb-8 font-normal">
            Join thousands of users who are achieving their nutrition goals with AI-powered calorie tracking.
          </p>

          {/* Ratings */}
          <RatingRow />

          {/* Store Buttons */}
          <div className="mb-6 w-full flex justify-center">
            <StoreButtons fullWidthMobile={true} />
          </div>

          {/* Optional Small Trust Text */}
          <div className="text-xs sm:text-sm font-medium text-[#6B7280]">
            Free forever • No credit card required • Privacy-first
          </div>
        </div>
      </Container>
    </section>
  );
};
