import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

export function IPhoneMockup() {
  return (
    <View style={styles.phoneOuterContainer}>
      {/* Outer iPhone Titanium Frame */}
      <View style={styles.phoneFrame}>
        {/* Notch / Dynamic Island */}
        <View style={styles.notchContainer}>
          <View style={styles.notch} />
        </View>

        {/* Screen Display Area */}
        <View style={styles.screenDisplay}>
          {/* Healthy Meal Camera Photography */}
          <Image
            source={require('../../assets/images/healthy-meal-camera.png')}
            style={styles.foodImage}
            contentFit="cover"
            alt="Healthy meal camera preview"
          />

          {/* iOS Camera Header Info (9:41, Status) */}
          <View style={styles.cameraHeader}>
            <Text style={styles.timeText}>9:41</Text>
            <View style={styles.statusIcons}>
              <Text style={styles.statusIconText}>5G</Text>
              <View style={styles.batteryIcon} />
            </View>
          </View>

          {/* Camera Action Controls (X, ?) */}
          <View style={styles.cameraTopBar}>
            <View style={styles.actionCircle}>
              <Text style={styles.actionIconText}>✕</Text>
            </View>
            <View style={styles.actionCircle}>
              <Text style={styles.actionIconText}>?</Text>
            </View>
          </View>

          {/* AI Scanning Target Frame (White Corners) */}
          <View style={styles.scanTargetContainer}>
            <View style={[styles.cornerMarker, styles.cornerTL]} />
            <View style={[styles.cornerMarker, styles.cornerTR]} />
            <View style={[styles.cornerMarker, styles.cornerBL]} />
            <View style={[styles.cornerMarker, styles.cornerBR]} />
          </View>

          {/* Translucent Mode Selector Pill */}
          <View style={styles.bottomOverlayBar}>
            <View style={styles.activePill}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.activePillText}>Scan Food</Text>
            </View>
            <Text style={styles.inactiveModeIcon}>📷</Text>
            <Text style={styles.inactiveModeIcon}>🖼</Text>
          </View>

          {/* Bottom Shutter Control */}
          <View style={styles.shutterContainer}>
            <View style={styles.flashCircle}>
              <Text style={styles.flashIcon}>⚡︎</Text>
            </View>
            <View style={styles.shutterOuterRing}>
              <View style={styles.shutterInnerButton} />
            </View>
            <View style={styles.emptySpacer} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phoneOuterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Soft natural drop shadow matching welcomescreen-ui-design.png
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  phoneFrame: {
    width: 252,
    height: 388,
    borderRadius: 42,
    backgroundColor: '#1C1C1E',
    borderWidth: 4,
    borderColor: '#2D2D30',
    overflow: 'hidden',
    position: 'relative',
  },
  notchContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
  },
  notch: {
    width: 72,
    height: 18,
    backgroundColor: '#000000',
    borderRadius: 10,
  },
  screenDisplay: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 36,
    overflow: 'hidden',
    position: 'relative',
  },
  foodImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cameraHeader: {
    position: 'absolute',
    top: 10,
    left: 18,
    right: 18,
    zIndex: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIconText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  batteryIcon: {
    width: 16,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  cameraTopBar: {
    position: 'absolute',
    top: 36,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Scan Target Box
  scanTargetContainer: {
    position: 'absolute',
    top: 85,
    left: 36,
    right: 36,
    height: 160,
    zIndex: 15,
  },
  cornerMarker: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },

  // Floating Control Bar
  bottomOverlayBar: {
    position: 'absolute',
    bottom: 58,
    alignSelf: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 12,
    zIndex: 20,
  },
  activePill: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  sparkleIcon: {
    fontSize: 10,
  },
  activePillText: {
    color: '#073828',
    fontSize: 10,
    fontWeight: '700',
  },
  inactiveModeIcon: {
    fontSize: 12,
    opacity: 0.8,
  },

  // Shutter Controls
  shutterContainer: {
    position: 'absolute',
    bottom: 12,
    left: 18,
    right: 18,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flashCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashIcon: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  shutterOuterRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInnerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  emptySpacer: {
    width: 26,
  },
});
