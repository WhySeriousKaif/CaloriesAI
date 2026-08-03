import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera, Utensils } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalorieRingCard } from '@/components/home/CalorieRingCard';
import { DateStrip, weekAround } from '@/components/home/DateStrip';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { MacroCard } from '@/components/home/MacroCard';
import { MealCard } from '@/components/home/MealCard';
import { Layout, Palette, Radius } from '@/constants/design';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useMeals } from '@/hooks/use-meals';
import { useProfile } from '@/hooks/use-profile';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading: profileLoading } = useProfile();
  const { meals, loading: mealsLoading } = useMeals();

  const days = useMemo(() => weekAround(new Date()), []);
  const todayKey = useMemo(
    () => days.find((day) => day.isToday)?.key ?? days[0].key,
    [days]
  );
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const consumed = useMemo(() => {
    return meals.reduce(
      (acc, meal) => {
        if (meal.status === 'completed') {
          acc.calories += meal.calories ?? 0;
          acc.proteinG += meal.proteinG ?? 0;
          acc.carbsG += meal.carbsG ?? 0;
          acc.fatG += meal.fatG ?? 0;
        }
        return acc;
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
  }, [meals]);

  const targets = {
    calories: profile?.dailyCalories ?? 0,
    proteinG: profile?.proteinG ?? null,
    carbsG: profile?.carbsG ?? null,
    fatG: profile?.fatG ?? null,
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + BottomTabInset + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <GreetingHeader />

        <View style={styles.dateStripWrapper}>
          <DateStrip
            days={days}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
        </View>

        <CalorieRingCard consumed={consumed.calories} target={targets.calories} />

        <View style={styles.macroRow}>
          <MacroCard macro="protein" value={consumed.proteinG} target={targets.proteinG} />
          <MacroCard macro="carbs" value={consumed.carbsG} target={targets.carbsG} />
          <MacroCard macro="fat" value={consumed.fatG} target={targets.fatG} />
        </View>

        {!profileLoading && !profile ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              We couldn&apos;t find your plan yet. Finish onboarding to see your
              personal targets here.
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
          {meals.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/history')}
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          )}
        </View>

        {meals.length === 0 && !mealsLoading ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Utensils size={24} color={Palette.brand} />
            </View>
            <Text style={styles.emptyText}>
              Snap your first meal of the day and the numbers land here.
            </Text>
            <Pressable
              onPress={() => router.push('/camera')}
              style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
              <Camera size={18} color={Palette.onBrand} />
              <Text style={styles.scanButtonText}>Scan a meal</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.mealList}>
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal as any}
                onRetake={() => router.push('/camera')}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingHorizontal: Layout.gutter,
    gap: Layout.sectionGap,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  dateStripWrapper: {
    marginTop: -4,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noticeCard: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -8,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.5,
  },
  viewAll: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.brand,
  },
  pressed: {
    opacity: 0.6,
  },
  emptyCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  scanButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.onBrand,
  },
  mealList: {
    gap: 10,
  },
});
