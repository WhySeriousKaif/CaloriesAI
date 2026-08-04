import '@/global.css';

import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ProfileSync } from '@/components/profile-sync';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: __DEV__ ? 'development' : 'production',
    debug: false,
    sendDefaultPii: true,
    enableLogs: false,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableNativeFramesTracking: !isRunningInExpoGo(),
    integrations: [
      Sentry.mobileReplayIntegration({
        maskAllImages: false,
        maskAllText: false,
        maskAllVectors: false,
      }),
      navigationIntegration,
    ],
  });
}

function SentryUser() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    Sentry.setUser(userId ? { id: userId } : null);
  }, [isLoaded, userId]);

  return null;
}

const LightAppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAF9F6',
    card: '#FFFFFF',
    text: '#1A1A1A',
    border: '#EFEFE9',
  },
};

function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SentryUser />
      {/* Global Clerk CAPTCHA container required when Bot Protection is active */}
      <View nativeID="clerk-captcha" id="clerk-captcha" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
      <ThemeProvider value={LightAppTheme}>
        <AnimatedSplashOverlay />
        <ProfileSync />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF9F6' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          {/* Reached from the camera FAB, not the tab bar. */}
          <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default Sentry.wrap(RootLayout);

