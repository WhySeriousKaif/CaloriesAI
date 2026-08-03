import { useAuth, useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function SSOCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const router = useRouter();

  const handled = useRef(false);

  useEffect(() => {
    if (!isLoaded || handled.current) return;

    if (isSignedIn) {
      router.replace('/(tabs)');
      return;
    }

    handled.current = true;

    (async () => {
      try {
        if (typeof (clerk as any)?.handleRedirectCallback === 'function') {
          await (clerk as any).handleRedirectCallback(
            {
              afterSignInUrl: '/(tabs)',
              afterSignUpUrl: '/(tabs)',
              redirectUrl: '/(tabs)',
            },
            (to: string) => {
              router.replace(to as any);
              return Promise.resolve();
            }
          );
          return;
        }

        if (clerk?.session || clerk?.user) {
          router.replace('/(tabs)');
          return;
        }

        router.replace('/(auth)/sign-in');
      } catch (err) {
        console.error('[SSO Callback Error]:', err);
        if (clerk?.session || clerk?.user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/sign-in');
        }
      }
    })();
  }, [isLoaded, isSignedIn, clerk, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#059669" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A3527',
  },
});
