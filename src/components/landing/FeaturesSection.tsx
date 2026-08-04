import React, { useState } from 'react';
import { Container } from './Container';
import { FeatureCard, FeatureData } from './FeatureCard';
import { PhoneShowcase } from './PhoneShowcase';

const FEATURES_DATA: FeatureData[] = [
  {
    id: '1',
    title: 'Track Your Food With Just a Picture',
    description:
      'Snap a photo of your meal and let AI instantly identify the food, estimate portion size, and calculate calories, protein, carbohydrates, fats, and other nutrients within seconds.',
    imageSrc: 'Scan-result.png',
  },
  {
    id: '2',
    title: 'Massive Nutrition Database',
    description:
      'Access millions of verified foods, restaurant meals, packaged products, and barcodes to quickly find accurate nutrition information whenever you need it.',
    imageSrc: 'meal-details.png',
  },
  {
    id: '3',
    title: 'AI Progress Tracking',
    description:
      'Monitor your calorie intake, macros, weight, and nutrition goals with intelligent insights, personalized recommendations, and weekly progress reports powered by AI.',
    imageSrc: 'analytics.png',
  },
  {
    id: '4',
    title: 'Water & Activity Tracking',
    description:
      'Track your daily water intake, exercise, and healthy habits in one place to build a consistent lifestyle and achieve your fitness goals faster.',
    imageSrc: 'scanning-photo.png',
  },
];

export const FeaturesSection: React.FC = () => {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  const activeFeature = FEATURES_DATA[activeFeatureIndex];

  return (
    <section className="py-[120px] bg-[#FAF8F4]" id="features">
      <Container>
        {/* Section Heading */}
        <h2 className="text-center font-bold text-[34px] sm:text-[44px] lg:text-[56px] text-[#111111] tracking-tight leading-[1.15] mb-12 lg:mb-[72px]">
          What does Calora include?
        </h2>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column (40% width): Phone Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <PhoneShowcase
              imageSrc={activeFeature.imageSrc}
              altText={activeFeature.title}
              activeDotIndex={activeFeatureIndex}
            />
          </div>

          {/* Right Column (60% width): 4 Feature Cards Stacked Vertically */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {FEATURES_DATA.map((feature, index) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isActive={activeFeatureIndex === index}
                onClick={() => setActiveFeatureIndex(index)}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
