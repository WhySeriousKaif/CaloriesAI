import { Pressable, StyleSheet, Text, View } from 'react-native';

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
 * The seven days of the week containing `reference`, Sunday first.
 *
 * Built from the device's local calendar. The timezone-correct "which meals
 * belong to this local day" query is PLAN.md Phase 5 — this only drives the strip.
 */
export function weekAround(reference: Date): DayCell[] {
  const startOfWeek = new Date(reference);
  startOfWeek.setDate(reference.getDate() - reference.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

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
    <View style={styles.row}>
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
            {/* The dot marks a day that has been logged; future days stay blank. */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
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
