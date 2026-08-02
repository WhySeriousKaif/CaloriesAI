import { Platform } from 'react-native';

export const Welcome = {
  // Colors
  background: '#FCFCFC',
  brand: '#073828',
  onBrand: '#FFFFFF',

  headline: '#0A3527',
  subtitle: '#666666',
  link: '#0A3527',

  fontFamily: Platform.select({
    ios: 'Helvetica Neue',
    default: 'sans-serif',
  }),

  // Layout
  gutter: 28,

  // Logo
  logoTop: 0,
  logoHeight: 52,
  logoRatio: 994 / 306,

  // Phone Hero
  logoToMockup: -35,
mockupHeight: 620,
mockupBottomOffset: -115,

  mockupRatio: 752 / 1337,


  // Headline
  mockupToHeadline: -40,
  headlineSize: 36,
  headlineLineHeight: 42,
  headlineTracking: -1,

  // Subtitle
  headlineToSubtitle: 6,
  subtitleSize: 17,
  subtitleLineHeight: 24,

  // CTA
  subtitleToCta: 18,
  ctaHeight: 56,
  ctaLabelSize: 18,
  arrowSize: 20,

  // Footer
  ctaToFooter: 10,
footerBottom: 26,
  footerLineHeight: 20,

} as const;