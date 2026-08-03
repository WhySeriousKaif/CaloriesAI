import { Droplet, Drumstick, Wheat } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import {
  CardShadow,
  Macro,
  NumeralFont,
  Palette,
  Radius,
  type MacroKey,
} from '@/constants/design';

const ICONS = {
  protein: Drumstick,
  carbs: Wheat,
  fat: Droplet,
} as const;

type MacroCardProps = {
  macro: MacroKey;
  value: number;
  target: number | null;
};

/** One of the three macro tiles under the calorie ring. */
export function MacroCard({ macro, value, target }: MacroCardProps) {
  const { color, tint, label } = Macro[macro];
  const Icon = ICONS[macro];

  const progress = target && target > 0 ? Math.min(1, value / target) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: tint }]}>
          <Icon size={17} color={color} strokeWidth={2.2} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.target}>{target ? ` / ${target}g` : ' g'}</Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { backgroundColor: color, width: `${progress * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Palette.card,
    borderRadius: 26,
    padding: 16,
    gap: 8,
    ...CardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#7A7A7A',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.5,
    fontFamily: NumeralFont,
  },
  target: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A7A7A',
  },
  track: {
    height: 6,
    backgroundColor: '#F3F3F3',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
