import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

/**
 * Public auth group. Signed-in users never see these screens — this guard is also
 * what completes the sign-in flow: once `setActive` flips `isSignedIn`, the user
 * is redirected into the app without any imperative navigation.
 */
export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  // Clerk restores the cached session on cold start; rendering before it settles
  // would flash the sign-in screen at signed-in users.
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
