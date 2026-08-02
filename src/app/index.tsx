import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Welcome } from '@/constants/welcome';

/**
 * Welcome screen — Designed to utilize the entire phone window smoothly.
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth();

  // Returning users with a cached session skip the welcome screen entirely.
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/(tabs)" />;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + Welcome.logoTop,
            paddingBottom: Math.max(insets.bottom, 16) + Welcome.footerBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Top & Hero Section */}
        <View style={styles.topSection}>
          {/* Calora Horizontal Logo */}
          <Image
            source={require('@/assets/images/logo-lockup-horizontal.png')}
            style={styles.logo}
            contentFit="contain"
            alt="Calora"
          />

          {/* Larger Phone Mockup Image */}
          <Image
            source={require('@/assets/images/welcome-screen-ui-demo.png')}
            style={styles.mockup}
            contentFit="contain"
            alt="Calora food scanner mockup"
          />

          {/* Headline */}
          <Text style={styles.headline}>
            Snap, Analyze,{'\n'}Hit Your Goals
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            AI Nutrition that understands{'\n'}your meals in seconds.
          </Text>
        </View>

        {/* Bottom Section (Pushed to bottom of viewport) */}
        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            onPress={() => router.push('/onboarding')}>
            <View style={styles.ctaLabelBox}>
              <Text style={styles.ctaLabel}>Get Started</Text>
            </View>
            <ArrowRight
              color={Welcome.onBrand}
              size={Welcome.arrowSize}
              strokeWidth={2.5}
            />
          </Pressable>

          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text
              style={styles.footerLink}
              accessibilityRole="link"
              onPress={() => router.push('/(auth)/sign-in')}>
              Sign In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Welcome.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: Welcome.gutter,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
  },
  bottomSection: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 18,
  },
  logo: {
    width: 215,
    height: 52,
  },
  mockup: {
    width: Welcome.mockupHeight * Welcome.mockupRatio,
    height: Welcome.mockupHeight,

    marginTop: -35,
    marginBottom: -115,
  },
  headline: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '800',

    fontSize: 36,

    lineHeight: 42,

    letterSpacing: -1,

    color: Welcome.headline,

    textAlign: 'center',

    marginTop: -18,
  },
  subtitle: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '400',

    fontSize: 17,

    lineHeight: 24,

    color: '#666',

    textAlign: 'center',

    marginTop: 8,
  },
  cta: {
    alignSelf: 'stretch',

    height: 56,

    borderRadius: 28,

    backgroundColor: Welcome.brand,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 24,
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
    fontSize: Welcome.ctaLabelSize,
    color: Welcome.onBrand,
  },
  ctaArrow: {
    width: Welcome.arrowSize,
    height: Welcome.arrowSize,
  },
  ctaArrowFallback: {
    fontSize: Welcome.arrowSize,
    color: Welcome.onBrand,
    fontWeight: '700',
  },
  footerText: {
    fontFamily: Welcome.fontFamily,

    fontWeight: '400',

    fontSize: 15,

    color: '#666',

    marginTop: 10,
    marginBottom: 24,
  },
  footerLink: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '700',
    color: Welcome.link,
  },
});
