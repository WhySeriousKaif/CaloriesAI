import { useAuth, useClerk } from '@clerk/expo';
import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

/** How long to wait for Clerk's session before giving up and offering a retry. */
const TIMEOUT_MS = 15_000;

/**
 * Landing screen for Clerk's OAuth redirect.
 *
 * Who actually completes the sign-in differs by platform:
 *  - **Native** — `useSSO().startSSOFlow()` on the sign-in screen owns the whole
 *    exchange and calls `setActive` itself. The OS still deep-links back here
 *    when the browser closes, so this screen's only job is to wait for
 *    `isSignedIn` to flip and then get out of the way.
 *  - **Web** — there's no in-process flow to finish the job, so we call
 *    `handleRedirectCallback` once to exchange the code for a session.
 *
 * The previous version checked a `handled` ref *before* `isSignedIn`, so once
 * the first pass had run (with the session not yet propagated) every later run
 * returned early — including the one where `isSignedIn` finally became true.
 * The screen spun on "Completing sign in..." forever. Auth state is therefore
 * now checked first, on every render, and the ref only guards the side effect.
 */
export default function SSOCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();

  const exchanged = useRef(false);
  const [timedOut, setTimedOut] = useState(false);

  // Web only: perform the code exchange exactly once.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!isLoaded || isSignedIn || exchanged.current) return;

    exchanged.current = true;

    void (async () => {
      try {
        await clerk.handleRedirectCallback({ signInFallbackRedirectUrl: '/(tabs)' });
      } catch (err) {
        console.error('[sso-callback] Redirect callback failed:', err);
      }
    })();
  }, [isLoaded, isSignedIn, clerk]);

  // Never leave the user on an indefinite spinner.
  useEffect(() => {
    if (isSignedIn) return;
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isSignedIn]);

  // Checked before anything else, on every render — this is the exit.
  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  if (timedOut) {
    return <Redirect href="/(auth)/sign-in" />;
  }

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
