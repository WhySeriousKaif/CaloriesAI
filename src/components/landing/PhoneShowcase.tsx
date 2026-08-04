import React from 'react';

interface PhoneShowcaseProps {
  imageSrc: string;
  altText: string;
  activeDotIndex: number;
}

export const PhoneShowcase: React.FC<PhoneShowcaseProps> = ({
  imageSrc,
  altText,
  activeDotIndex,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Clean transparent phone container */}
      <div className="relative w-full max-w-[620px] flex items-center justify-center">
        <img
          src={imageSrc}
          alt={altText}
          className="w-full max-w-[620px] h-auto object-contain block drop-shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
        />
      </div>

      {/* 4-Dot Pagination Indicator below phone */}
      <div className="flex items-center justify-center gap-2.5 mt-7">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-2.5 transition-all duration-300 rounded-full cursor-pointer ${
              activeDotIndex === index
                ? 'w-7 bg-[#1F6B47]'
                : 'w-2.5 bg-gray-200 hover:bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
