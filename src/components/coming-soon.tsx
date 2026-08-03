import { StatusBar } from 'expo-status-bar';
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardShadow, Layout, Palette, Radius } from '@/constants/design';

type ComingSoonProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/** Branded placeholder for destinations that exist in the tab bar but not yet in the build. */
export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Icon size={28} color={Palette.brand} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.gutter,
  },
  card: {
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    paddingVertical: 36,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 380,
    gap: 8,
    ...CardShadow,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  badge: {
    marginTop: 10,
    backgroundColor: Palette.brandTint,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.brand,
  },
});
