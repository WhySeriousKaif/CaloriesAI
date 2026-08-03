import '@/global.css';

import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ProfileSync } from '@/components/profile-sync';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to your .env file.'
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {/* Global Clerk CAPTCHA container required when Bot Protection is active */}
      <View nativeID="clerk-captcha" id="clerk-captcha" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <ProfileSync />
        <Stack screenOptions={{ headerShown: false }}>
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
