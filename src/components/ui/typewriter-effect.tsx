import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export interface TypewriterEffectProps {
  words: {
    text: string;
    style?: TextStyle;
  }[];
  style?: TextStyle;
  containerStyle?: ViewStyle;
  cursorColor?: string;
}

export function TypewriterEffect({
  words,
  style,
  containerStyle,
  cursorColor = '#059669',
}: TypewriterEffectProps) {
  // Combine all word texts to compute total length
  const fullString = words.map((w) => w.text).join(' ');
  const totalChars = fullString.length;

  const charIndexAnim = useRef(new Animated.Value(0)).current;
  const cursorOpacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Typewriter typing animation
    Animated.timing(charIndexAnim, {
      toValue: totalChars,
      duration: Math.max(1200, totalChars * 75),
      useNativeDriver: false,
    }).start();

    // Cursor blinking loop
    const cursorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    cursorLoop.start();

    return () => cursorLoop.stop();
  }, [totalChars, charIndexAnim, cursorOpacityAnim]);

  // Flatten characters with their word styling
  const charactersWithStyle: { char: string; style?: TextStyle }[] = [];
  words.forEach((wordObj, wIdx) => {
    wordObj.text.split('').forEach((char) => {
      charactersWithStyle.push({ char, style: wordObj.style });
    });
    if (wIdx < words.length - 1) {
      charactersWithStyle.push({ char: ' ' });
    }
  });

  const [visibleCount, setVisibleCount] = React.useState(0);

  useEffect(() => {
    const id = charIndexAnim.addListener(({ value }) => {
      setVisibleCount(Math.floor(value));
    });
    return () => charIndexAnim.removeListener(id);
  }, [charIndexAnim]);

  return (
    <View style={[styles.rowContainer, containerStyle]}>
      <Text style={[styles.baseText, style]}>
        {charactersWithStyle.slice(0, visibleCount).map((item, idx) => (
          <Text key={idx} style={item.style}>
            {item.char}
          </Text>
        ))}
      </Text>
      <Animated.View
        style={[
          styles.cursor,
          { backgroundColor: cursorColor, opacity: cursorOpacityAnim },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  baseText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0A3527',
  },
  cursor: {
    width: 3,
    height: 24,
    borderRadius: 1.5,
    marginLeft: 3,
  },
});
