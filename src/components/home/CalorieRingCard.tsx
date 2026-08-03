import { useState } from 'react';
import { Flame, Info, Leaf } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  CardShadow,
  Layout,
  NumeralFont,
  Palette,
  Radius,
} from '@/constants/design';
import { CalorieInfoModal } from './CalorieInfoModal';

const RING_SIZE = 148;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

import { Skeleton } from '@/components/common/Skeleton';

type CalorieRingCardProps = {
  consumed: number;
  target: number;
  loading?: boolean;
};

export function CalorieRingCard({ consumed, target, loading }: CalorieRingCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const hasTarget = target > 0;
  const remaining = Math.max(0, target - consumed);
  const progress = hasTarget ? Math.min(1, consumed / target) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const overBudget = hasTarget && consumed > target;

  return (
    <View style={styles.card}>
      <CalorieInfoModal visible={showInfo} onClose={() => setShowInfo(false)} />

      <Pressable
        onPress={() => setShowInfo(true)}
        style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="How targets are calculated"
        hitSlop={8}>
        <Info size={15} color={Palette.textTertiary} strokeWidth={2} />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.left}>
          <Text style={styles.label}>
            {overBudget ? 'Over by' : 'Calories left'}
          </Text>
          {loading ? (
            <View style={{ marginVertical: 6 }}>
              <Skeleton style={{ width: 110, height: 40, borderRadius: 10 }} />
              <Skeleton style={{ width: 85, height: 14, borderRadius: 6, marginTop: 6 }} />
            </View>
          ) : (
            <>
              <Text style={styles.bigNumber}>
                {hasTarget ? (overBudget ? consumed - target : remaining) : '—'}
              </Text>
              <Text style={styles.ofTarget}>
                {hasTarget ? `of ${target.toLocaleString()} kcal` : 'no target set'}
              </Text>
            </>
          )}

          <View style={[styles.pill, overBudget && styles.pillWarn]}>
            <Leaf
              size={12}
              color={overBudget ? Palette.danger : Palette.brand}
              strokeWidth={2.4}
            />
            <Text style={[styles.pillText, overBudget && styles.pillTextWarn]}>
              {overBudget ? 'Over target' : 'On track'}
            </Text>
          </View>
        </View>

        <View style={styles.ringWrapper}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={Palette.track}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={overBudget ? Palette.danger : Palette.brand}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={loading ? CIRCUMFERENCE * 0.7 : dashOffset}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>

          <View style={styles.ringCenter} pointerEvents="none">
            <Flame size={18} color={Palette.text} strokeWidth={2.2} fill={Palette.text} />
            {loading ? (
              <Skeleton style={{ width: 44, height: 20, borderRadius: 6, marginVertical: 2 }} />
            ) : (
              <Text style={styles.consumed}>{consumed.toLocaleString()}</Text>
            )}
            <Text style={styles.consumedLabel}>Consumed</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: Layout.cardPadding,
    ...CardShadow,
  },
  infoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  bigNumber: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '700',
    color: Palette.brand,
    letterSpacing: -1.5,
    fontFamily: NumeralFont,
  },
  ofTarget: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
    marginTop: -2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Palette.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginTop: 10,
  },
  pillWarn: {
    backgroundColor: Palette.dangerTint,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.brand,
  },
  pillTextWarn: {
    color: Palette.danger,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  consumed: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.5,
    fontFamily: NumeralFont,
  },
  consumedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
});
