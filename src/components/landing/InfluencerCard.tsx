import React from 'react';

export interface InfluencerData {
  id: string;
  name: string;
  quote: string;
  imageSrc: string;
  heightDesktop?: string;
}

export interface InfluencerCardProps {
  influencer: InfluencerData;
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({ influencer }) => {
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-neutral-900 ${influencer.heightDesktop || 'h-[640px]'}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
        <p className="text-lg font-medium italic mb-2">&ldquo;{influencer.quote}&rdquo;</p>
        <h3 className="text-xl font-bold">{influencer.name}</h3>
      </div>
    </div>
  );
};
