import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export function HeightHeader() {
  return (
    <View style={styles.container}>
      <Svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Soft Oval Background */}
        <Circle cx="60" cy="60" r="48" fill="#F0FDF4" />

        {/* Height Ruler Stand */}
        <Rect x="68" y="28" width="6" height="64" rx="3" fill="#D1D5DB" />
        {/* Ruler Markings */}
        <Line x1="74" y1="36" x2="80" y2="36" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        <Line x1="74" y1="46" x2="78" y2="46" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="74" y1="56" x2="80" y2="56" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        <Line x1="74" y1="66" x2="78" y2="66" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="74" y1="76" x2="80" y2="76" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />

        {/* Human Silhouette */}
        <Circle cx="48" cy="40" r="7" fill="#073828" />
        <Path
          d="M48 48V72M48 54H42M48 54H54M48 72L44 88M48 72L52 88"
          stroke="#073828"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Potted Plant Accent */}
        <Rect x="86" y="78" width="14" height="12" rx="3" fill="#B45309" />
        <Path d="M93 78C93 78 88 70 91 64C94 67 93 78 93 78Z" fill="#059669" />
        <Path d="M93 78C93 78 98 72 101 75C99 79 93 78 93 78Z" fill="#34D399" />
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
