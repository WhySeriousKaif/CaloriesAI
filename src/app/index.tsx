import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLoaderScreen } from '@/components/ui/loader';
import { SquigglyText } from '@/components/ui/squiggly-text';
import { Welcome } from '@/constants/welcome';

/**
 * Welcome screen — Built using flexbox proportion layout with larger hero phone image.
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  // Subtle button pulse / slide animation
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 5,
          duration: 750,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 750,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [arrowAnim]);

  if (!isLoaded) return <AppLoaderScreen text="Loading Calora..." />;
  if (isSignedIn) return <Redirect href="/(tabs)" />;

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}>
      <StatusBar style="dark" />

      {/* 1. Header (Logo) */}
      <View style={styles.headerBox}>
        <Image
          source={require('@/assets/images/logo-lockup-horizontal.png')}
          style={styles.logo}
          contentFit="contain"
          alt="Calora"
        />
      </View>

      {/* 2. Hero (Phone Mockup - Enlarged) */}
      <View style={styles.heroBox}>
        <Image
          source={require('@/assets/images/welcome-screen-ui-demo.png')}
          style={styles.mockup}
          contentFit="contain"
          alt="Calora food scanner mockup"
        />
      </View>

      {/* 3. Bottom Section (Headline & Buttons right under phone) */}
      <View style={styles.bottomSection}>
        <Text style={styles.headline}>
          <SquigglyText scale={[5, 8]} stepDuration={70} color="#073828">
            Snap
          </SquigglyText>
          , Analyze{'\n'}Hit Your{' '}
          <SquigglyText scale={[5, 8]} stepDuration={70} color="#073828">
            Goals
          </SquigglyText>
        </Text>

        <Text style={styles.subtitle}>
          AI Nutrition that understands{'\n'}your meals in seconds.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
          onPress={() => router.push('/onboarding')}>
          <View style={styles.ctaLabelBox}>
            <Text style={styles.ctaLabel}>Get Started</Text>
          </View>
          <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
            <ArrowRight
              color={Welcome.onBrand}
              size={Welcome.arrowSize}
              strokeWidth={2.5}
            />
          </Animated.View>
        </Pressable>

        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text
            style={styles.footerLink}
            accessibilityRole="link"
            onPress={() => router.push(isSignedIn ? '/(tabs)' : '/(auth)/sign-in')}>
            Sign In
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 24,
  },
  headerBox: {
    flex: 0.10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 185,
    height: 44,
  },
  heroBox: {
    flex: 0.58,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockup: {
    width: '100%',
    height: '100%',
    maxHeight: 590,
  },
  bottomSection: {
    flex: 0.32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headline: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '800',
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.6,
    color: '#073828',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#073828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaLabelBox: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: Welcome.arrowSize + 8,
  },
  ctaLabel: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '700',
    fontSize: 17,
    color: '#FFFFFF',
  },
  footerText: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '400',
    fontSize: 15,
    color: '#666666',
    marginBottom: 4,
  },
  footerLink: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '700',
    color: '#073828',
  },
});

