import { Image, type ImageProps } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * The Calora logo. The icon is identical across themes — only the wordmark
 * changes colour, so `lockup` swaps assets on the system theme and `mark`
 * (icon only) renders the same file on both.
 */

const lockup = {
  light: require('../../assets/images/logo-light.png'),
  dark: require('../../assets/images/logo-dark.png'),
} as const;

const mark = require('../../assets/images/logo-mark.png');

/** Intrinsic width / height, so a caller only ever picks one dimension. */
const Ratio = {
  lockup: 334 / 375,
  mark: 266 / 267,
} as const;

export type LogoProps = Omit<ImageProps, 'source' | 'alt'> & {
  /** `lockup` is the icon plus wordmark, `mark` is the icon alone. */
  variant?: 'lockup' | 'mark';
  /** Rendered height in points. Width follows the logo's aspect ratio. */
  height?: number;
};

export function Logo({ variant = 'lockup', height = 96, style, ...rest }: LogoProps) {
  const scheme = useColorScheme();
  const source = variant === 'mark' ? mark : lockup[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Image
      source={source}
      style={[{ width: height * Ratio[variant], height }, style]}
      contentFit="contain"
      alt="Calora"
      {...rest}
    />
  );
}
