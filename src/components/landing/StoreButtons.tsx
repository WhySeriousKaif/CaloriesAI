import React from 'react';

interface StoreButtonsProps {
  fullWidthMobile?: boolean;
}

export const StoreButtons: React.FC<StoreButtonsProps> = ({ fullWidthMobile = true }) => {
  return (
    <div className={`flex flex-wrap items-center gap-3.5 ${fullWidthMobile ? 'w-full sm:w-auto' : ''}`}>
      {/* App Store Button */}
      <a
        href="#app-store"
        className={`inline-flex items-center justify-center gap-3 px-5 py-3.5 rounded-[24px] bg-[#111111] text-white hover:bg-[#1F6B47] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${
          fullWidthMobile ? 'w-full sm:w-auto' : ''
        }`}
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M17.05 12.04c-.03-2.9 2.37-4.3 2.48-4.37-1.35-1.98-3.45-2.25-4.2-2.28-1.79-.18-3.49 1.05-4.4 1.05-.91 0-2.31-1.03-3.8-1-1.95.03-3.75 1.13-4.75 2.88-2.03 3.52-.52 8.73 1.46 11.58.97 1.4 2.12 2.96 3.63 2.9 1.46-.06 2.01-.94 3.77-.94 1.76 0 2.26.94 3.8.91 1.57-.03 2.56-1.42 3.52-2.83 1.11-1.62 1.57-3.19 1.6-3.27-.04-.02-3.07-1.18-3.11-4.63z" />
          <path d="M14.6 3.6c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.41-1.63z" />
        </svg>
        <div className="text-left leading-none">
          <span className="block text-[10px] uppercase tracking-wider text-gray-300">Download on the</span>
          <span className="block text-sm font-semibold mt-0.5">App Store</span>
        </div>
      </a>

      {/* Google Play Button */}
      <a
        href="#google-play"
        className={`inline-flex items-center justify-center gap-3 px-5 py-3.5 rounded-[24px] bg-[#111111] text-white hover:bg-[#1F6B47] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${
          fullWidthMobile ? 'w-full sm:w-auto' : ''
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#00d2ff" d="M3.6 1.8c-.3.3-.5.8-.5 1.4v17.6c0 .6.2 1.1.5 1.4l.1.1L13.5 12.1v-.2L3.7 1.7l-.1.1z" />
          <path fill="#ffce00" d="M16.8 15.4l-3.3-3.3v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2z" />
          <path fill="#ff3a44" d="M16.9 15.4L13.5 12 3.6 21.9c.4.4 1 .4 1.7.1l11.6-6.6" />
          <path fill="#00f076" d="M16.9 8.6L5.3 2C4.6 1.6 4 1.7 3.6 2.1L13.5 12l3.4-3.4z" />
        </svg>
        <div className="text-left leading-none">
          <span className="block text-[10px] uppercase tracking-wider text-gray-300">GET IT ON</span>
          <span className="block text-sm font-semibold mt-0.5">Google Play</span>
        </div>
      </a>
    </div>
  );
};
