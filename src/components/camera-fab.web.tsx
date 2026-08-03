import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Radius } from '@/constants/design';
import { BottomTabInset } from '@/constants/theme';

const SIZE = 62;
const OVERLAP = Platform.select({ ios: 14, android: 22, default: 18 });

export function CameraFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bottom = (insets?.bottom ?? 0) + BottomTabInset - OVERLAP;

  return (
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
    borderWidth: 5,
    borderColor: Palette.background,
    boxShadow: '0 6px 16px rgba(18, 69, 47, 0.3)',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.94 }],
  },
});
