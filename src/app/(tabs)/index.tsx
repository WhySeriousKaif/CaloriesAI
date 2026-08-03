import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera, Flame, Sparkles, Utensils, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalorieRingCard } from '@/components/home/CalorieRingCard';
import { DateStrip, formatLocalDateKey, weekAround } from '@/components/home/DateStrip';
import { GreetingHeader } from '@/components/home/GreetingHeader';
import { MacroCard } from '@/components/home/MacroCard';
import { MealCard } from '@/components/home/MealCard';
import { Layout, Macro, NumeralFont, Palette, Radius } from '@/constants/design';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { MealItem, useMeals } from '@/hooks/use-meals';
import { useProfile } from '@/hooks/use-profile';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading: profileLoading } = useProfile();
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);

  const days = useMemo(() => weekAround(new Date()), []);
  const todayKey = useMemo(
    () => days.find((day) => day.isToday)?.key ?? days[0].key,
    [days]
  );
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const { meals: allMeals, reload: reloadAll } = useMeals();
  const { meals, loading: mealsLoading, reload: reloadSelected } = useMeals(selectedKey);

  useFocusEffect(
    useCallback(() => {
      void reloadAll();
      void reloadSelected();
    }, [reloadAll, reloadSelected])
  );

  const loggedDateKeys = useMemo(
    () =>
      new Set(
        allMeals
          .filter((m) => m.loggedAt)
          .map((m) => formatLocalDateKey(new Date(m.loggedAt)))
      ),
    [allMeals]
  );

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
            loggedDateKeys={loggedDateKeys}
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
              <Sparkles size={28} color={Palette.brand} />
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
                onPress={() => setSelectedMeal(meal)}
                onRetake={() => router.push('/camera')}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Meal Detail Modal */}
      {selectedMeal ? (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedMeal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedMeal.name || 'Meal Detail'}</Text>
                <Pressable onPress={() => setSelectedMeal(null)} hitSlop={10}>
                  <X size={22} color={Palette.text} />
                </Pressable>
              </View>

              {selectedMeal.imageUrl ? (
                <Image
                  source={{ uri: selectedMeal.imageUrl }}
                  style={styles.modalImage}
                  contentFit="cover"
                />
              ) : null}

              <View style={styles.modalCalorieRow}>
                <Flame size={24} color={Palette.brand} fill={Palette.brand} />
                <Text style={styles.modalCalories}>{selectedMeal.calories ?? 0}</Text>
                <Text style={styles.modalKcalLabel}>total calories</Text>
              </View>

              <View style={styles.modalMacrosGrid}>
                <View style={[styles.modalMacroPill, { backgroundColor: Macro.protein.tint }]}>
                  <Text style={[styles.modalMacroVal, { color: Macro.protein.color }]}>
                    {selectedMeal.proteinG ?? 0}g
                  </Text>
                  <Text style={styles.modalMacroLbl}>Protein</Text>
                </View>
                <View style={[styles.modalMacroPill, { backgroundColor: Macro.carbs.tint }]}>
                  <Text style={[styles.modalMacroVal, { color: Macro.carbs.color }]}>
                    {selectedMeal.carbsG ?? 0}g
                  </Text>
                  <Text style={styles.modalMacroLbl}>Carbs</Text>
                </View>
                <View style={[styles.modalMacroPill, { backgroundColor: Macro.fat.tint }]}>
                  <Text style={[styles.modalMacroVal, { color: Macro.fat.color }]}>
                    {selectedMeal.fatG ?? 0}g
                  </Text>
                  <Text style={styles.modalMacroLbl}>Fat</Text>
                </View>
              </View>

              {selectedMeal.loggedAt ? (
                <Text style={styles.loggedAtText}>
                  Logged at {new Date(selectedMeal.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                onPress={() => setSelectedMeal(null)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
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
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 220,
    marginTop: 4,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Palette.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
  },
  modalCalorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    justifyContent: 'center',
  },
  modalCalories: {
    fontSize: 36,
    fontWeight: '800',
    color: Palette.brand,
    fontFamily: NumeralFont,
  },
  modalKcalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  modalMacrosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  modalMacroPill: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  modalMacroVal: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: NumeralFont,
  },
  modalMacroLbl: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  loggedAtText: {
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  closeBtn: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
