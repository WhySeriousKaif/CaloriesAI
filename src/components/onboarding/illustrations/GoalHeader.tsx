import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export function GoalHeader() {
  return (
    <View style={styles.container}>
      <Svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Soft Background Circle */}
        <Circle cx="60" cy="60" r="48" fill="#F0FDF4" />

        {/* Target Bullseye Rings */}
        <Circle cx="60" cy="60" r="34" stroke="#073828" strokeWidth="5" fill="#FFFFFF" />
        <Circle cx="60" cy="60" r="22" stroke="#059669" strokeWidth="4" fill="none" />
        <Circle cx="60" cy="60" r="10" stroke="#073828" strokeWidth="4" fill="#073828" />

        {/* Arrow Hit Bullseye */}
        <Path
          d="M32 88L56 64"
          stroke="#073828"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Arrow Feathers */}
        <Path
          d="M26 94L34 86M26 86L34 94"
          stroke="#059669"
          strokeWidth="3"
          strokeLinecap="round"
        />
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
