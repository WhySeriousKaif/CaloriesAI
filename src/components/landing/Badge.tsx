import React from 'react';

export const Badge: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200/80 shadow-xs text-xs sm:text-sm font-medium text-[#111111] mb-6">
      <span className="text-amber-500 font-bold">⭐ Loved by 5M+ users</span>
      <span className="text-gray-300">•</span>
      <span className="text-amber-600 font-semibold">★ 4.9 Rating</span>
    </div>
  );
};
