import { useAuth } from '@clerk/expo';
import { Redirect, Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { Palette } from '@/constants/design';
import { useProfile } from '@/hooks/use-profile';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, loading } = useProfile();

  if (!isLoaded || loading) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  // Mandate onboarding for all users who haven't completed onboarding yet
  if (!profile || !profile.onboardingCompletedAt) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.container}>
      <Slot />
      <AppTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
});
