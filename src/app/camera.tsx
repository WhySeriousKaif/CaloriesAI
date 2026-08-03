import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera, ChevronLeft, ImageIcon, Zap } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout, Palette, Radius } from '@/constants/design';

/**
 * Camera — stub.
 *
 * The real capture flow is PLAN.md Phase 4: `expo-camera` capture, ImageKit
 * upload via a signed endpoint, `POST /api/meals` to create the `analyzing`
 * row, then the `analyze-meal` task. This screen holds the route and the
 * chrome so the FAB has somewhere to go.
 */
export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ChevronLeft size={22} color={Palette.onBrand} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan a meal</Text>
        <View style={styles.backButtonSpacer} />
      </View>

      <View style={styles.body}>
        {/* Stands in for the live camera preview. */}
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          <Camera size={40} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        </View>

        <Text style={styles.hint}>Center your plate in the frame</Text>
        <Text style={styles.subHint}>
          Camera capture arrives with the meal analysis pipeline.
        </Text>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 28 }]}>
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityLabel="Choose from library"
          style={styles.secondaryControl}>
          <ImageIcon size={22} color="rgba(255,255,255,0.5)" strokeWidth={2} />
        </Pressable>

        <View style={styles.shutterOuter}>
          <View style={styles.shutterInner} />
        </View>

        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityLabel="Toggle flash"
          style={styles.secondaryControl}>
          <Zap size={22} color="rgba(255,255,255,0.5)" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101512',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.gutter,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.onBrand,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.gutter,
    gap: 6,
  },
  viewfinder: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 340,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: Palette.onBrand,
  },
  cornerTopLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 14,
  },
  cornerTopRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 14,
  },
  cornerBottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 14,
  },
  cornerBottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 14,
  },
  hint: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.onBrand,
  },
  subHint: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: Layout.gutter,
  },
  secondaryControl: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: Radius.pill,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});
