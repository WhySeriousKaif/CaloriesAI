import { Platform } from 'react-native';

/**
 * Design tokens matched exactly to the Calora reference mockup (Screenshot 3).
 */
export const Palette = {
  background: '#FAF9F6',
  brand: '#1A5D42',
  brandDeep: '#12452F',
  brandTint: '#E4EFE8',
  onBrand: '#FFFFFF',

  card: '#FFFFFF',
  track: '#E3EDE6',
  border: '#EFEFE9',

  text: '#1A1A1A',
  textSecondary: '#6E6E73',
  textTertiary: '#8A8A8A',

  danger: '#E5484D',
  dangerTint: '#FDECEC',
} as const;

export const Macro = {
  protein: { color: '#1A5D42', tint: '#E4EFE8', label: 'Protein' },
  carbs: { color: '#F5A623', tint: '#FDF0D5', label: 'Carbs' },
  fat: { color: '#8B5CF6', tint: '#EDE7FB', label: 'Fat' },
} as const;

export type MacroKey = keyof typeof Macro;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const Layout = {
  gutter: 16,
  cardPadding: 16,
  sectionGap: 16,
} as const;

export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  android: { elevation: 2 },
  default: {
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
  },
}) as object;

export const NumeralFont = Platform.select({
  web: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  ios: 'ui-rounded',
  default: undefined,
});

export const DisplayFont = Platform.select({
  web: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  ios: 'System',
  default: undefined,
});
