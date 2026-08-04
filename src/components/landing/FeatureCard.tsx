import React from 'react';

export interface FeatureData {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
}

interface FeatureCardProps {
  feature: FeatureData;
  isActive: boolean;
  onClick: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-[24px] bg-white border cursor-pointer transition-all duration-300 transform ${
        isActive
          ? 'border-[#1F6B47] shadow-lg -translate-y-1 ring-1 ring-[#1F6B47]'
          : 'border-gray-200/80 shadow-xs hover:border-[#1F6B47] hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <h3 className="font-bold text-[22px] sm:text-[28px] text-[#111111] tracking-tight leading-snug mb-2">
        {feature.title}
      </h3>
      <p className="text-base sm:text-[17px] text-[#6B7280] leading-[1.7] font-normal">
        {feature.description}
      </p>
    </div>
  );
};
