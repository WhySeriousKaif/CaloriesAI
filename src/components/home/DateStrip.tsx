import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/ui/pressable';

import { NumeralFont, Palette, Radius } from '@/constants/design';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type DayCell = {
  key: string;
  weekday: string;
  dayOfMonth: number;
  isToday: boolean;
  isFuture: boolean;
};

export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates 14 past days + today + 2 future days for smooth scrolling.
 */
export function weekAround(reference: Date): DayCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastDaysCount = 14;
  const futureDaysCount = 2;
  const totalDays = pastDaysCount + 1 + futureDaysCount;

  return Array.from({ length: totalDays }, (_, index) => {
    const offset = index - pastDaysCount;
    const date = new Date(reference);
    date.setDate(reference.getDate() + offset);
    date.setHours(0, 0, 0, 0);

    return {
      key: formatLocalDateKey(date),
      weekday: WEEKDAYS[date.getDay()],
      dayOfMonth: date.getDate(),
      isToday: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
    };
  });
}

type DateStripProps = {
  days: DayCell[];
  selectedKey: string;
  onSelect: (key: string) => void;
  loggedDateKeys?: Set<string>;
};

export function DateStrip({ days, selectedKey, onSelect, loggedDateKeys }: DateStripProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const selectedIndex = days.findIndex((d) => d.key === selectedKey);
    const targetIndex = selectedIndex >= 0 ? selectedIndex : days.findIndex((d) => d.isToday);
    if (targetIndex >= 0 && scrollViewRef.current) {
      const itemWidth = 58;
      const scrollX = Math.max(0, targetIndex * itemWidth - 160);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: scrollX, animated: false });
      }, 60);
    }
  }, [days, selectedKey]);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}>
      {days.map((day) => {
        const selected = day.key === selectedKey;
        const hasMeal = loggedDateKeys ? loggedDateKeys.has(day.key) : false;

        const weekdayColor = selected
          ? '#FFFFFF'
          : day.isFuture
          ? Palette.textTertiary
          : Palette.textSecondary;

        const dayColor = selected
          ? '#FFFFFF'
          : day.isFuture
          ? Palette.textTertiary
          : Palette.text;

        return (
          <Pressable
            key={day.key}
            onPress={() => onSelect(day.key)}
            disabled={day.isFuture}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: day.isFuture }}
            accessibilityLabel={`${day.weekday} ${day.dayOfMonth}`}
            style={({ pressed }) => [
              styles.cell,
              selected && styles.cellSelected,
              pressed && !selected && styles.pressed,
            ]}>
            <Text style={[styles.weekday, { color: weekdayColor }]} numberOfLines={1}>
              {day.weekday}
            </Text>
            <Text style={[styles.day, { color: dayColor }]} numberOfLines={1}>
              {day.dayOfMonth}
            </Text>
            <View
              style={[
                styles.dot,
                selected && styles.dotSelected,
                (!hasMeal || day.isFuture) && styles.dotHidden,
              ]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cell: {
    minWidth: 50,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  cellSelected: {
    backgroundColor: Palette.brand,
  },
  pressed: {
    opacity: 0.6,
  },
  weekday: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  weekdaySelected: {
    color: '#FFFFFF',
  },
  day: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    fontFamily: NumeralFont,
    textAlign: 'center',
    includeFontPadding: false,
  },
  daySelected: {
    color: '#FFFFFF',
  },
  dimmed: {
    color: Palette.textTertiary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
    marginTop: 2,
  },
  dotSelected: {
    backgroundColor: '#FFFFFF',
  },
  dotHidden: {
    backgroundColor: 'transparent',
  },
});
