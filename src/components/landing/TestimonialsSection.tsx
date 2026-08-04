import React from 'react';
import { Container } from './Container';
import { InfluencerCard, InfluencerData } from './InfluencerCard';

const INFLUENCERS_DATA: InfluencerData[] = [
  {
    id: '1',
    name: 'Jeremiah Jones',
    quote: 'Make a healthier choice for your late night snack and use the Calora app to track your calories.',
    imageSrc: 'jeremiah.webp',
    heightDesktop: 'h-[660px]',
  },
  {
    id: '2',
    name: 'Dawson Gibbs',
    quote: "Track with Calora app, if you're not tracking your calories while going for your goals then you're doing it all wrong.",
    imageSrc: 'dawson.webp',
    heightDesktop: 'h-[680px] lg:mt-14', // Staggered offset in column 2
  },
  {
    id: '3',
    name: 'Hussein Farhat',
    quote: "If you're tracking your calories and macros correctly with Calora, you can get away with eating almost anything and still get in shape as long as it matches your daily goals.",
    imageSrc: 'jacked1.webp',
    heightDesktop: 'h-[640px]',
  },
  {
    id: '4',
    name: 'Kadin Kerns',
    quote: 'Looking good as usual and my calories are too with Calora 🔥',
    imageSrc: 'jacked2.webp',
    heightDesktop: 'h-[640px]',
  },
  {
    id: '5',
    name: 'Brian Wallack',
    quote: 'Calora can literally track anything 🥸',
    imageSrc: 'jacked3.webp',
    heightDesktop: 'h-[680px] lg:mt-14', // Staggered offset in column 2
  },
  {
    id: '6',
    name: 'Alex Eubank',
    quote: "Calora is literally the best calorie tracker. Fastest and most accurate I've ever used.",
    imageSrc: 'jacked4.webp',
    heightDesktop: 'h-[640px]',
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-[120px] bg-[#FAF8F4]" id="testimonials">
      <Container>
        {/* Section Heading */}
        <h2 className="text-center font-bold text-[34px] sm:text-[44px] lg:text-[56px] text-[#111111] tracking-tight leading-[1.15] mb-12 sm:mb-16">
          Used by your favorite fitness influencers 👀
        </h2>

        {/* Staggered Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {INFLUENCERS_DATA.map((influencer) => (
            <InfluencerCard key={influencer.id} influencer={influencer} />
          ))}
        </div>
      </Container>
    </section>
  );
};
