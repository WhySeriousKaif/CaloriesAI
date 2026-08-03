import { useState } from 'react';
import { useUser } from '@clerk/expo';
import { Flame } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/logo';
import { Radius } from '@/constants/design';
import { StreakModal } from './StreakModal';

/** Local-time greeting. Purely cosmetic, so the device clock is good enough. */
function greetingFor(hour: number) {
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function GreetingHeader() {
  const { user } = useUser();
  const [showStreak, setShowStreak] = useState(false);

  // Clerk users signed up via Google/Apple may have no first name set.
  const rawName =
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    'there';

  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const greeting = greetingFor(new Date().getHours());

  return (
    <View style={styles.container}>
      <StreakModal
        visible={showStreak}
        onClose={() => setShowStreak(false)}
        streakCount={1}
      />

      <View style={styles.topRow}>
        <Logo variant="lockup" height={28} />

        <Pressable
          onPress={() => setShowStreak(true)}
          style={({ pressed }) => [styles.streakButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="View Streak"
          hitSlop={8}>
          <Flame size={16} color="#EF4444" fill="#EF4444" />
          <Text style={styles.streakCount}>1</Text>
        </Pressable>
      </View>

      <Text style={styles.greeting}>
        {greeting}, {name}! <Text style={styles.wave}>👋</Text>
      </Text>
      <Text style={styles.subtitle}>Let&apos;s make today a healthy one.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: '#FEE2E2',
  },
  streakCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  pressed: {
    opacity: 0.7,
  },
  greeting: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.4,
  },
  wave: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6E6E73',
  },
});
