import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { NumeralFont, Palette, Radius } from '@/constants/design';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type DayCell = {
  key: string;
  weekday: string;
  dayOfMonth: number;
  isToday: boolean;
  isFuture: boolean;
};

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
      key: date.toISOString().slice(0, 10),
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
};

export function DateStrip({ days, selectedKey, onSelect }: DateStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}>
      {days.map((day) => {
        const selected = day.key === selectedKey;

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
            <Text
              style={[
                styles.weekday,
                selected && styles.weekdaySelected,
                day.isFuture && styles.dimmed,
              ]}>
              {day.weekday}
            </Text>
            <Text
              style={[
                styles.day,
                selected && styles.daySelected,
                day.isFuture && styles.dimmed,
              ]}>
              {day.dayOfMonth}
            </Text>
            <View
              style={[
                styles.dot,
                selected && styles.dotSelected,
                day.isFuture && styles.dotHidden,
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
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 16,
  },
  cell: {
    width: 48,
    alignItems: 'center',
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
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  weekdaySelected: {
    color: '#FFFFFF',
  },
  day: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    fontFamily: NumeralFont,
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
