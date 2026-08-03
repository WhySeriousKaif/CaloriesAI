import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Radius } from '@/constants/design';
import { BottomTabInset } from '@/constants/theme';

const SIZE = 62;

/**
 * The camera button that floats over the tab bar.
 *
 * Expo Router's native tabs render the *system* tab bar, which has no notch and
 * no center slot — and the docs list "cannot measure the tab bar height" as a
 * known limitation. So this is an overlay positioned with a hardcoded offset
 * rather than anything measured. `OVERLAP` is the one number to nudge if the
 * button sits too high or low on a given device.
 */
const OVERLAP = Platform.select({ ios: 14, android: 22, default: 18 });

export function CameraFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bottom = insets.bottom + BottomTabInset - OVERLAP;

  return (
    // `box-none` so only the button itself swallows touches — the rest of the
    // row must stay transparent or it would eat taps meant for the tab bar.
    <View style={[styles.layer, { bottom }]} pointerEvents="box-none">
      <Pressable
        onPress={() => router.push('/camera')}
        accessibilityRole="button"
        accessibilityLabel="Scan a meal"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Camera size={26} color={Palette.onBrand} strokeWidth={2.2} />
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
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    // A ring in the page colour reads as a notch cut out of the bar.
    borderWidth: 5,
    borderColor: Palette.background,
    ...Platform.select({
      ios: {
        shadowColor: Palette.brandDeep,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {
        boxShadow: '0 6px 16px rgba(18, 69, 47, 0.3)',
      },
    }),
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.94 }],
  },
});
