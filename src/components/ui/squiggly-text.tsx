import React, { useId } from 'react';
import { Platform, Text, TextStyle, ViewStyle } from 'react-native';

export interface SquigglyTextProps {
  children: React.ReactNode;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  steps?: number;
  stepDuration?: number;
  scale?: number | [number, number];
  baseFrequency?: number;
  numOctaves?: number;
  color?: string;
}

/**
 * Web renders the real effect: an SVG feTurbulence + feDisplacementMap filter
 * cycled through a few seeds to make the glyphs wobble.
 */
function SquigglyTextWeb({
  children,
  steps = 5,
  stepDuration = 80,
  scale = [6, 8],
  baseFrequency = 0.02,
  numOctaves = 3,
  style,
  color,
}: SquigglyTextProps) {
  const reactId = useId();
  const safeId = reactId.replace(/[:_]/g, '');
  const filterId = (i: number) => `squiggly-${safeId}-${i}`;
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps);
    }, stepDuration);
    return () => clearInterval(interval);
  }, [steps, stepDuration]);

  const scaleAt = (i: number) => (Array.isArray(scale) ? scale[i % scale.length] : scale);

  return (
    <Text style={[{ filter: `url(#${filterId(currentStep)})`, ...(color ? { color } : {}) }, style]}>
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          {Array.from({ length: steps }).map((_, i) => (
            <filter id={filterId(i)} key={i}>
              <feTurbulence
                baseFrequency={baseFrequency}
                numOctaves={numOctaves}
                result="noise"
                seed={i}
              />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={scaleAt(i)} />
            </filter>
          ))}
        </defs>
      </svg>
      {children}
    </Text>
  );
}

/**
 * Native has no equivalent of an SVG displacement filter on text, and this
 * component is always used *inside* a parent <Text>. React Native only honours
 * a small set of style props on nested text — colour and the font/spacing
 * family — so the previous Animated.Text `transform` wobble was silently
 * dropped on iOS and could stop the span rendering altogether on Android,
 * which is why "Snap" and "Goals" went missing on device.
 *
 * Rendering plain inline text keeps the words visible and correctly coloured.
 * Any wobble here would have to be drawn per-glyph with react-native-svg, which
 * would break inline text flow — not worth it for a decorative effect.
 */
function SquigglyTextNative({ children, style, color }: SquigglyTextProps) {
  return <Text style={[color ? { color } : null, style]}>{children}</Text>;
}

export const SquigglyText =
  Platform.OS === 'web' ? SquigglyTextWeb : SquigglyTextNative;
