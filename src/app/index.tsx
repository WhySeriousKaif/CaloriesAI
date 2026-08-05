import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLoaderScreen } from '@/components/ui/loader';
import { SquigglyText } from '@/components/ui/squiggly-text';
import { Welcome } from '@/constants/welcome';

/**
 * Welcome / launch screen.
 *
 * Layout rules that keep this working on every handset:
 *  - A ScrollView with `flexGrow: 1` fills the screen when there's room and
 *    scrolls when there isn't, so nothing can ever end up unreachable.
 *  - The text + buttons block is content-sized and `flexShrink: 0`; only the
 *    phone image gives up space. Fixed flex fractions were what previously
 *    clipped the CTA and the sign-in link on shorter screens.
 *  - Every Text caps `maxFontSizeMultiplier`, so a large OS font setting can't
 *    overflow the fixed-height button.
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { height } = useWindowDimensions();

  // Small handsets (SE, older Androids) get slightly tighter type and spacing
  // so the whole screen still lands without scrolling.
  const compact = height < 700;

  const [ctaPressed, setCtaPressed] = useState(false);

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
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* 1 — Logo */}
        <View style={styles.headerBox}>
          <Image
            source={require('../../assets/images/logo-lockup-horizontal.png')}
            style={[styles.logo, compact && styles.logoCompact]}
            contentFit="contain"
            transition={200}
            alt="Calora"
          />
        </View>

        {/* 2 — Phone mockup. The only element allowed to shrink. */}
        <View style={[styles.heroBox, compact && styles.heroBoxCompact]}>
          <Image
            source={require('../../assets/images/welcome-screen-ui-demo.png')}
            style={styles.mockup}
            contentFit="contain"
            transition={200}
            alt="Calora scanning a meal to show its calories and macros"
          />
        </View>

        {/* 3 — Headline, CTA and sign-in. Never shrinks. */}
        <View style={styles.bottomSection}>
          <Text
            style={[styles.headline, compact && styles.headlineCompact]}
            maxFontSizeMultiplier={1.3}>
            <SquigglyText scale={[5, 8]} stepDuration={70} color={COLORS.ink}>
              Snap
            </SquigglyText>
            , Analyze{'\n'}Hit Your{' '}
            <SquigglyText scale={[5, 8]} stepDuration={70} color={COLORS.ink}>
              Goals
            </SquigglyText>
          </Text>

          <Text
            style={[styles.subtitle, compact && styles.subtitleCompact]}
            maxFontSizeMultiplier={1.3}>
            AI Nutrition that understands{'\n'}your meals in seconds.
          </Text>

          {/* NativeWind's JSX interop (jsxImportSource in babel.config.js) does
              not invoke Pressable's function-callback props, so `style={fn}`
              and function-as-children are silently dropped on native. Keep the
              visuals on a plain View and drive press feedback from state. */}
          <Pressable
            style={styles.ctaHit}
            accessibilityRole="button"
            accessibilityLabel="Get started with Calora"
            onPressIn={() => setCtaPressed(true)}
            onPressOut={() => setCtaPressed(false)}
            onPress={() => router.push('/onboarding')}>
            <View style={[styles.cta, ctaPressed && styles.ctaPressed]}>
              <View style={styles.ctaLabelBox}>
                <Text style={styles.ctaLabel} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  Get Started
                </Text>
              </View>
              <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
                <ArrowRight color={COLORS.onInk} size={20} strokeWidth={2.5} />
              </Animated.View>
            </View>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText} maxFontSizeMultiplier={1.3}>
              Already have an account?{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/sign-in')}
              accessibilityRole="link"
              accessibilityLabel="Sign in to your account"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <Text style={styles.footerLink} maxFontSizeMultiplier={1.3}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const COLORS = {
  bg: '#FAF9F6',
  ink: '#073828',
  onInk: '#FFFFFF',
  muted: '#666666',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    // Fills the viewport when there's room, scrolls when there isn't.
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  headerBox: {
    flexShrink: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  logo: {
    width: 185,
    height: 44,
  },
  logoCompact: {
    width: 156,
    height: 37,
  },

  heroBox: {
    flex: 1,
    // Allows the image to shrink instead of pushing the buttons off-screen,
    // while still guaranteeing it never collapses to nothing.
    minHeight: 220,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBoxCompact: {
    minHeight: 170,
  },
  mockup: {
    width: '100%',
    height: '100%',
    maxHeight: 590,
  },

  bottomSection: {
    flexShrink: 0,
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
  },
  headline: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '800',
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.6,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  headlineCompact: {
    fontSize: 25,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitleCompact: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },

  ctaHit: {
    width: '100%',
    marginBottom: 12,
  },
  cta: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.ink,
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
    // Offsets the arrow's width so the label stays optically centred.
    paddingLeft: 28,
  },
  ctaLabel: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '700',
    fontSize: 17,
    color: COLORS.onInk,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '400',
    fontSize: 15,
    color: COLORS.muted,
  },
  footerLink: {
    fontFamily: Welcome.fontFamily,
    fontWeight: '700',
    fontSize: 15,
    color: COLORS.ink,
  },
});
