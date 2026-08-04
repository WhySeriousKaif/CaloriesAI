import React, { useId } from 'react';
import { Animated, Easing, Platform, Text, TextStyle, ViewStyle } from 'react-native';

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

export function SquigglyText({
  children,
  steps = 5,
  stepDuration = 80,
  scale = [6, 8],
  baseFrequency = 0.02,
  numOctaves = 3,
  style,
  containerStyle,
  color,
}: SquigglyTextProps) {
  const reactId = useId();
  const safeId = reactId.replace(/[:_]/g, '');

  if (Platform.OS === 'web') {
    const filterId = (i: number) => `squiggly-${safeId}-${i}`;
    const [currentStep, setCurrentStep] = React.useState(0);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps);
      }, stepDuration);
      return () => clearInterval(interval);
    }, [steps, stepDuration]);

    const scaleAt = (i: number) =>
      Array.isArray(scale) ? scale[i % scale.length] : scale;

    const activeFilterUrl = `url(#${filterId(currentStep)})`;

    return (
      <Text style={[{ filter: activeFilterUrl, ...(color ? { color } : {}) }, style]}>
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
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={scaleAt(i)}
                />
              </filter>
            ))}
          </defs>
        </svg>
        {children}
      </Text>
    );
  }

  // Mobile Native animated wobble/wave fallback
  const wobbleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobbleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: -1,
          duration: 300,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [wobbleAnim]);

  const translateY = wobbleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-1.5, 1.5],
  });

  const rotate = wobbleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-1deg', '1deg'],
  });

  return (
    <Animated.Text style={[{ transform: [{ translateY }, { rotate }] }, color ? { color } : {}, style]}>
      {children}
    </Animated.Text>
  );
}


