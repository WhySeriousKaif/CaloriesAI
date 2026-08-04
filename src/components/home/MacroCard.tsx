import { Dumbbell, Droplet, Wheat } from 'lucide-react-native';
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
  protein: Dumbbell,
  carbs: Wheat,
  fat: Droplet,
} as const;

import { Skeleton } from '@/components/common/Skeleton';

type MacroCardProps = {
  macro: MacroKey;
  value: number;
  target: number | null;
  loading?: boolean;
};

/** One of the three macro tiles under the calorie ring. */
export function MacroCard({ macro, value, target, loading }: MacroCardProps) {
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
        {loading ? (
          <Skeleton style={{ width: 45, height: 18, borderRadius: 6, marginVertical: 2 }} />
        ) : (
          <>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.target}>{target ? ` / ${target}g` : ' g'}</Text>
          </>
        )}
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
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    ...CardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A7A7A',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 1,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.4,
    fontFamily: NumeralFont,
  },
  target: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A7A7A',
  },
  track: {
    height: 4,
    backgroundColor: '#F3F3F3',
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
