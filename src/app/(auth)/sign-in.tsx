import { useAuth, useClerk, useSSO } from '@clerk/expo';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { AppleMark, GoogleMark } from '@/components/auth/BrandMarks';
import { LegalModal } from '@/components/common/LegalModal';

WebBrowser.maybeCompleteAuthSession();

type Provider = 'google' | 'apple';

const STRATEGY = {
  google: 'oauth_google',
  apple: 'oauth_apple',
} as const;

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();

  // Pushed as `/(auth)/sign-in?intent=signup` at the end of onboarding, so the
  // copy can speak to the plan the user just built instead of a generic welcome.
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const isSignUp = intent === 'signup';

  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);

  const onContinue = useCallback(
    async (provider: Provider) => {
      if (pending) return;

      setPending(provider);
      setError(null);

      try {
        if (isSignedIn) {
          router.replace('/(tabs)');
          return;
        }

        const { createdSessionId, setActive, signUp } = await startSSOFlow({
          strategy: STRATEGY[provider],
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          router.replace('/(tabs)');
          return;
        }

        if (signUp?.status === 'missing_requirements') {
          setError(
            'We need a little more information to finish creating your account.'
          );
          return;
        }
      } catch (err: any) {
        console.error('SSO error:', JSON.stringify(err, null, 2));
        const clerkMessage =
          err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          err?.message ??
          'Something went wrong. Please try again.';
        setError(clerkMessage);
      } finally {
        setPending(null);
      }
    },
    [pending, isSignedIn, startSSOFlow, router]
  );

  const appleButton = (
    <ProviderButton
      label="Continue with Apple"
      icon={<AppleMark size={19} color="#FFFFFF" />}
      onPress={() => onContinue('apple')}
      loading={pending === 'apple'}
      disabled={pending !== null}
      variant="dark"
    />
  );

  const googleButton = (
    <ProviderButton
      label="Continue with Google"
      icon={<GoogleMark size={19} />}
      onPress={() => onContinue('google')}
      loading={pending === 'google'}
      disabled={pending !== null}
      variant="light"
    />
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      {/* Clerk Smart CAPTCHA container required for custom auth flows when bot protection is active */}
      <View nativeID="clerk-captcha" style={styles.captchaContainer} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        {router.canGoBack() ? (
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ChevronLeft size={22} color="#073828" strokeWidth={2.5} />
          </Pressable>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}
      </View>

      <View style={styles.body}>
        <Image
          source={require('../../../assets/images/logo-lockup-horizontal.png')}
          style={styles.logo}
          contentFit="contain"
          alt="Calora"
        />

        <Text style={styles.title}>
          {isSignUp ? 'Your plan is ready' : 'Welcome back'}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? 'Create your account to save your targets and start tracking today.'
            : 'Sign in to pick up right where you left off.'}
        </Text>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}>
        {/* Apple first on iOS, per platform convention. */}
        {Platform.OS === 'ios' ? (
          <>
            {appleButton}
            {googleButton}
          </>
        ) : (
          <>
            {googleButton}
            {appleButton}
          </>
        )}

        <View style={styles.trustRow}>
          <ShieldCheck size={14} color="#059669" strokeWidth={2.5} />
          <Text style={styles.trustText}>
            We never post anything to your accounts.
          </Text>
        </View>

        <Text style={styles.legalText}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => setLegalType('terms')}>Terms</Text> and{' '}
          <Text style={styles.legalLink} onPress={() => setLegalType('privacy')}>Privacy Policy</Text>.
        </Text>
      </View>

      <LegalModal
        visible={!!legalType}
        type={legalType}
        onClose={() => setLegalType(null)}
      />
    </View>
  );
}

interface ProviderButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  variant: 'dark' | 'light';
}

function ProviderButton({
  label,
  icon,
  onPress,
  loading,
  disabled,
  variant,
}: ProviderButtonProps) {
  const isDark = variant === 'dark';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.providerBtn,
        isDark ? styles.providerBtnDark : styles.providerBtnLight,
        pressed && styles.pressed,
        disabled && !loading && styles.dimmed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}>
      {loading ? (
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#073828'} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.providerLabel,
              isDark ? styles.providerLabelDark : styles.providerLabelLight,
            ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 24,
  },
  header: {
    height: 'auto',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    height: 40,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 190,
    height: 46,
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0A3527',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  errorCard: {
    marginTop: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    gap: 12,
  },
  providerBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  providerBtnDark: {
    backgroundColor: '#0F0F0F',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  providerBtnLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  providerLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  providerLabelDark: {
    color: '#FFFFFF',
  },
  providerLabelLight: {
    color: '#0A3527',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  dimmed: {
    opacity: 0.45,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  legalText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  legalLink: {
    fontWeight: '700',
    color: '#4B5563',
  },
  captchaContainer: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
});
