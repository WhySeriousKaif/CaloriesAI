import { useAuth } from '@clerk/expo';
import { Redirect, Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { Palette } from '@/constants/design';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

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
