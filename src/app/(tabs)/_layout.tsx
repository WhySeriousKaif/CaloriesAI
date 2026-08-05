import { useAuth } from '@clerk/expo';
import { Redirect, Tabs } from 'expo-router';
import { BarChart2, Clock, Home, User } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraFab } from '@/components/camera-fab';
import { ErrorScreen } from '@/components/ui/error-screen';
import { AppLoaderScreen } from '@/components/ui/loader';
import { Palette } from '@/constants/design';
import { useProfile } from '@/hooks/use-profile';

export default function TabsLayout() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { profile, loading, error, reload } = useProfile();
  const insets = useSafeAreaInsets();

  if (!isLoaded || loading) {
    return <AppLoaderScreen text="Preparing Calora..." />;
  }
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  // Must be checked *before* the onboarding redirect below. A failed request
  // leaves `profile` null, which is otherwise indistinguishable from a user who
  // never onboarded — so without this branch a dead server or a dropped
  // connection would dump a fully-onboarded user back at step one.
  if (error && !profile) {
    return (
      <ErrorScreen
        title="Couldn't load your profile"
        message={error}
        onRetry={reload}
        secondaryLabel="Sign out"
        onSecondary={() => void signOut()}
      />
    );
  }

  // Mandate onboarding for all users who haven't completed onboarding yet
  if (!profile || !profile.onboardingCompletedAt) {
    return <Redirect href="/onboarding" />;
  }

  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <View style={{ flex: 1, backgroundColor: Palette.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Palette.brand,
          tabBarInactiveTintColor: Palette.textTertiary,
          tabBarStyle: {
            backgroundColor: Palette.card,
            borderTopWidth: 1,
            borderTopColor: Palette.border,
            height: 64 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => <Clock size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => <BarChart2 size={size || 22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
          }}
        />
      </Tabs>
      <CameraFab />
    </View>
  );
}
