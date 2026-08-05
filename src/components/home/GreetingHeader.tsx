import { useState } from 'react';
import { useUser } from '@clerk/expo';
import { Flame } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/ui/pressable';

import { Logo } from '@/components/logo';
import { Radius } from '@/constants/design';
import { useStreak } from '@/hooks/use-streak';
import { StreakModal } from './StreakModal';

/** Local-time greeting. Purely cosmetic, so the device clock is good enough. */
function greetingFor(hour: number) {
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function GreetingHeader() {
  const { user } = useUser();
  const { streak } = useStreak();
  const [showStreak, setShowStreak] = useState(false);

  // Clerk users signed up via Google/Apple may have no first name set.
  const rawName =
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    'there';

  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const greeting = greetingFor(new Date().getHours());

  const currentStreak = streak > 0 ? streak : 1;

  return (
    <View style={styles.container}>
      <StreakModal
        visible={showStreak}
        onClose={() => setShowStreak(false)}
        streakCount={currentStreak}
      />

      <View style={styles.topRow}>
        <Logo variant="mark" height={36} />

        <Pressable
          onPress={() => setShowStreak(true)}
          style={({ pressed }) => [styles.streakButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="View Streak"
          hitSlop={8}>
          <Flame size={16} color="#EF4444" fill="#EF4444" />
          <Text style={styles.streakCount}>{currentStreak}</Text>
        </Pressable>
      </View>

      <Text style={styles.greeting} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {greeting}, {name}!
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        Let&apos;s make today a healthy one.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  pressed: {
    opacity: 0.75,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    includeFontPadding: false,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  wave: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#144934',
    marginTop: 2,
    includeFontPadding: false,
  },
});
