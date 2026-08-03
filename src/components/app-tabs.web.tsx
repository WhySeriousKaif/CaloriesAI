import { usePathname, useRouter } from 'expo-router';
import {
  BarChart3,
  Camera,
  Clock,
  Home,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/design';

export default function AppTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome =
    pathname === '/' ||
    pathname === '/index' ||
    pathname === '/(tabs)' ||
    pathname === '/(tabs)/index';
  const isHistory = pathname.includes('history');
  const isAnalytics = pathname.includes('analytics');
  const isProfile = pathname.includes('profile');

  return (
    <View style={styles.dock} pointerEvents="box-none">
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <TabButton
            icon={Home}
            label="Home"
            isFocused={isHome}
            onPress={() => router.push('/(tabs)')}
          />
          <TabButton
            icon={Clock}
            label="History"
            isFocused={isHistory}
            onPress={() => router.push('/(tabs)/history')}
          />

          {/* Reserved notch space for center elevated camera button */}
          <View style={styles.notch} />

          <TabButton
            icon={BarChart3}
            label="Analytics"
            isFocused={isAnalytics}
            onPress={() => router.push('/(tabs)/analytics')}
          />
          <TabButton
            icon={User}
            label="Profile"
            isFocused={isProfile}
            onPress={() => router.push('/(tabs)/profile')}
          />
        </View>

        {/* Elevated Floating Camera Button */}
        <Pressable
          onPress={() => router.push('/camera')}
          accessibilityRole="button"
          accessibilityLabel="Scan a meal"
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
          <Camera size={26} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

function TabButton({
  icon: Icon,
  label,
  isFocused,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const color = isFocused ? Palette.brand : Palette.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Icon
        size={22}
        color={color}
        strokeWidth={isFocused ? 2.4 : 2}
        fill={isFocused ? Palette.brandTint : 'transparent'}
      />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  pillRow: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFEFE9',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      default: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    }),
  } as any,
  notch: {
    width: 64,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    top: -22,
    width: 62,
    height: 62,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: Palette.brand,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
      default: {
        boxShadow: '0 8px 24px rgba(26, 93, 66, 0.35)',
      },
    }),
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.94 }],
  },
});
