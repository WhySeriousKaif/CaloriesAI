import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

export function WeightHeader() {
  return (
    <View style={styles.container}>
      <Svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Soft Oval Background */}
        <Circle cx="60" cy="60" r="48" fill="#F0FDF4" />

        {/* Digital Bathroom Scale Base */}
        <Rect x="36" y="32" width="48" height="54" rx="14" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="3" />

        {/* Digital LED Display Screen */}
        <Rect x="46" y="40" width="28" height="14" rx="4" fill="#DCFCE7" />
        <SvgText
          x="60"
          y="50"
          fontSize="9"
          fontWeight="800"
          fill="#073828"
          textAnchor="middle">
          72.0
        </SvgText>

        {/* Footprint sensor pads */}
        <Rect x="43" y="60" width="10" height="18" rx="5" fill="#F3F4F6" />
        <Rect x="67" y="60" width="10" height="18" rx="5" fill="#F3F4F6" />

        {/* Potted Plant Accent */}
        <Rect x="88" y="74" width="12" height="10" rx="3" fill="#92400E" />
        <Path d="M94 74C94 74 88 66 92 60C96 64 94 74 94 74Z" fill="#059669" />
        <Path d="M94 74C94 74 100 68 102 72C99 76 94 74 94 74Z" fill="#34D399" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
