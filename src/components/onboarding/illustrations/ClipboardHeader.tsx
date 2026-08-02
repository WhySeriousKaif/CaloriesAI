import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function ClipboardHeader() {
  return (
    <View style={styles.container}>
      <Svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Soft Circular Background */}
        <Circle cx="60" cy="60" r="50" fill="#E8F5E9" opacity="0.8" />
        <Circle cx="85" cy="85" r="16" fill="#C8E6C9" opacity="0.6" />

        {/* Clipboard Cardboard Base */}
        <Rect x="36" y="32" width="48" height="60" rx="8" fill="#A1887F" />
        <Rect x="40" y="36" width="40" height="52" rx="6" fill="#FFFFFF" />

        {/* Top Clip */}
        <Rect x="48" y="28" width="24" height="8" rx="3" fill="#073828" />

        {/* Checklist Rows */}
        <Circle cx="48" cy="48" r="4" fill="#059669" />
        <Path d="M46 48L47.5 49.5L50.5 46.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <Rect x="56" y="46" width="18" height="4" rx="2" fill="#E5E7EB" />

        <Circle cx="48" cy="60" r="4" fill="#059669" />
        <Path d="M46 60L47.5 61.5L50.5 58.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <Rect x="56" y="58" width="20" height="4" rx="2" fill="#E5E7EB" />

        <Circle cx="48" cy="72" r="4" fill="#059669" />
        <Path d="M46 72L47.5 73.5L50.5 70.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <Rect x="56" y="70" width="14" height="4" rx="2" fill="#E5E7EB" />

        {/* Decorative Green Leaves */}
        <Path
          d="M82 62C82 62 88 56 94 60C94 60 90 70 82 62Z"
          fill="#34D399"
        />
        <Path
          d="M76 72C76 72 84 70 86 78C86 78 78 82 76 72Z"
          fill="#059669"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
