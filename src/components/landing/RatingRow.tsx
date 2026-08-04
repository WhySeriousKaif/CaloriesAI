import React from 'react';

export const RatingRow: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 text-sm sm:text-base font-medium text-[#111111] mb-9">
      <span className="flex items-center gap-1.5">
        <span>🍎</span>
        <span className="text-[#6B7280]">App Store</span>
        <b className="font-bold text-[#111111]">4.9 / 5</b>
      </span>
      <span className="text-gray-300">•</span>
      <span className="flex items-center gap-1.5">
        <span>▶</span>
        <span className="text-[#6B7280]">Google Play</span>
        <b className="font-bold text-[#111111]">4.8 / 5</b>
      </span>
    </div>
  );
};
