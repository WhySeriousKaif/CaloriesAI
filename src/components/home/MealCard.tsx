import { Image } from 'expo-image';
import {
  AlertTriangle,
  ChevronRight,
  Salad,
  Sparkles,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/ui/pressable';

import {
  CardShadow,
  Macro,
  NumeralFont,
  Palette,
  Radius,
} from '@/constants/design';
import type { MealItem } from '@/hooks/use-meals';

type MealCardProps = {
  meal: MealItem | any;
  onPress?: () => void;
  onRetake?: () => void;
};

/**
 * A single row in Today's Meals. Renders one of three states straight from
 * `meal.status`, matching the `analyzing | pending | completed | failed` lifecycle.
 */
export function MealCard({ meal, onPress, onRetake }: MealCardProps) {
  if (meal.status === 'analyzing' || meal.status === 'pending') {
    return null;
  }
  if (meal.status === 'failed') {
    return <FailedCard onRetake={onRetake} />;
  }

  const accentKey = meal.accent && Macro[meal.accent as keyof typeof Macro] ? meal.accent : 'protein';
  const accent = Macro[accentKey as keyof typeof Macro] ?? Macro.protein;

  const formattedTime = meal.loggedAt
    ? (() => {
        try {
          const d = new Date(meal.loggedAt);
          return isNaN(d.getTime())
            ? String(meal.loggedAt)
            : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch {
          return String(meal.loggedAt);
        }
      })()
    : '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meal.name ?? 'Meal'}, ${meal.calories ?? 0} calories`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {meal.imageUrl ? (
        <Image
          source={{ uri: meal.imageUrl }}
          style={styles.thumbImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      ) : (
        <View style={[styles.thumb, { backgroundColor: accent.tint }]}>
          <Salad size={26} color={accent.color} strokeWidth={1.8} />
        </View>
      )}

      <View style={styles.middle}>
        <Text style={styles.slot} numberOfLines={1}>
          {meal.name || meal.slot || 'Logged Meal'}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {meal.errorReason ? 'Failed to process' : 'AI Nutrition'}
        </Text>

        <View style={styles.macroRow}>
          <MacroDot color={Macro.protein.color} grams={meal.proteinG} />
          <MacroDot color={Macro.carbs.color} grams={meal.carbsG} />
          <MacroDot color={Macro.fat.color} grams={meal.fatG} />
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.kcalRow}>
          <Text style={styles.kcal}>{meal.calories ?? 0}</Text>
          <Text style={styles.kcalUnit}> kcal</Text>
        </View>
        <Text style={styles.time}>{formattedTime}</Text>
      </View>

      <ChevronRight size={18} color={Palette.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}

function MacroDot({ color, grams }: { color: string; grams: number | null }) {
  return (
    <View style={styles.macroItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.macroText}>{grams ?? 0}g</Text>
    </View>
  );
}

/** The optimistic card shown while `analyze-meal` runs. */
function AnalyzingCard() {
  return (
    <View style={[styles.card, styles.analyzingCard]} accessibilityRole="progressbar">
      <View style={[styles.thumb, styles.analyzingThumb]}>
        <Sparkles size={24} color={Palette.brand} strokeWidth={2} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.analyzingTitle}>Analyzing your meal...</Text>
        <Text style={styles.analyzingSub}>Our AI is identifying ingredients</Text>

        <View style={styles.analyzingTrack}>
          <View style={styles.analyzingFill} />
        </View>
      </View>
    </View>
  );
}

import { Skeleton } from '@/components/common/Skeleton';

export function SkeletonMealCard() {
  return (
    <View style={styles.card}>
      <Skeleton style={{ width: 72, height: 72, borderRadius: 18 }} />
      <View style={styles.middle}>
        <Skeleton style={{ width: 130, height: 18, borderRadius: 6, marginBottom: 8 }} />
        <Skeleton style={{ width: 90, height: 14, borderRadius: 6 }} />
      </View>
      <View style={styles.right}>
        <Skeleton style={{ width: 50, height: 24, borderRadius: 6 }} />
      </View>
    </View>
  );
}

function FailedCard({ onRetake }: { onRetake?: () => void }) {
  return (
    <View style={[styles.card, styles.failedCard]}>
      <View style={[styles.thumb, styles.failedThumb]}>
        <AlertTriangle size={24} color={Palette.danger} strokeWidth={2} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.failedTitle}>Couldn&apos;t analyze this image</Text>
        <Text style={styles.failedSub}>Try a clearer photo of your meal</Text>
      </View>

      <Pressable
        onPress={onRetake}
        accessibilityRole="button"
        style={({ pressed }) => [styles.retakeButton, pressed && styles.pressed]}>
        <Text style={styles.retakeText}>Retake</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Palette.card,
    borderRadius: 24,
    padding: 18,
    ...CardShadow,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  middle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 3,
  },
  slot: {
    fontSize: 18,
    fontWeight: '600',
    color: Palette.text,
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
  name: {
    fontSize: 15,
    fontWeight: '400',
    color: '#7B7B7B',
    includeFontPadding: false,
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
  },
  macroText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
    includeFontPadding: false,
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 2,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  kcal: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0B5E43',
    fontFamily: NumeralFont,
    includeFontPadding: false,
  },
  kcalUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B5E43',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
  },

  analyzingCard: {
    backgroundColor: Palette.brandTint,
  },
  analyzingThumb: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  analyzingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.brand,
  },
  analyzingSub: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  analyzingTrack: {
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    overflow: 'hidden',
  },
  analyzingFill: {
    height: '100%',
    width: '55%',
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
  },

  failedCard: {
    backgroundColor: Palette.dangerTint,
  },
  failedThumb: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  failedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
  },
  failedSub: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  retakeButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Palette.danger,
    backgroundColor: Palette.card,
  },
  retakeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.danger,
  },
});
