import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/design';

/**
 * LoaderOne: 3 bouncing dots animated in a smooth loop (React Native equivalent)
 */
export function LoaderOne() {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBouncingAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: -10,
              duration: 350,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 350,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    };

    const a1 = createBouncingAnimation(anim1, 0);
    const a2 = createBouncingAnimation(anim2, 150);
    const a3 = createBouncingAnimation(anim3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [anim1, anim2, anim3]);

  return (
    <View style={styles.loaderOneContainer}>
      <Animated.View style={[styles.dot, { transform: [{ translateY: anim1 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ translateY: anim2 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ translateY: anim3 }] }]} />
    </View>
  );
}

/**
 * LoaderFive: Pulsing animated text loader
 */
export function LoaderFive({ text = 'Loading...' }: { text?: string }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.Text style={[styles.loaderFiveText, { opacity: pulseAnim }]}>
      {text}
    </Animated.Text>
  );
}

/**
 * Full Page App Loading Screen with Light Theme (#FAF9F6), Brand Icon & Animated Loader
 */
export function AppLoaderScreen({ text = 'Loading...' }: { text?: string }) {
  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Image
            source={require('@/assets/images/logo-mark.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>
        <Text style={styles.brandTitle}>CalorieAI</Text>
      </View>

      <View style={styles.loaderBox}>
        <LoaderOne />
        <LoaderFive text={text} />
      </View>
    </View>
  );
}

export function LoaderOneDemo() {
  return <LoaderOne />;
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  loaderBox: {
    alignItems: 'center',
    gap: 14,
  },
  loaderOneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1A5D42',
  },
  loaderFiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6E6E73',
    letterSpacing: 0.2,
  },
});
