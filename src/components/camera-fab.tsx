import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/design';

/**
 * The camera button that floats over the tab bar.
 * Uses explicit inner/outer containers so native Android & iOS render
 * the solid forest green fill and camera icon with 100% reliability.
 */
export function CameraFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bottom = Math.max(insets.bottom, 12) + 14;

  return (
    <View style={[styles.layer, { bottom }]} pointerEvents="box-none">
      <Pressable
        onPress={() => router.push('/camera')}
        accessibilityRole="button"
        accessibilityLabel="Scan a meal"
        style={({ pressed }) => [styles.outerRing, pressed && styles.pressed]}>
        <View style={styles.innerCircle}>
          <Camera size={26} color="#FFFFFF" strokeWidth={2.2} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  outerRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.background,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.brandDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.94 }],
  },
});
