import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Search,
  Utensils,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CardShadow,
  Layout,
  Macro,
  NumeralFont,
  Palette,
  Radius,
} from '@/constants/design';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { MealItem, useMeals } from '@/hooks/use-meals';

function formatDateHeader(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals, loading, reload } = useMeals();
  const [search, setSearch] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);

  // Filter and group meals by day
  const filteredMeals = useMemo(() => {
    if (!search.trim()) return meals;
    const q = search.toLowerCase();
    return meals.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q)
    );
  }, [meals, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, MealItem[]>();

    for (const meal of filteredMeals) {
      const dateKey = meal.loggedAt
        ? meal.loggedAt.split('T')[0]
        : 'Unknown Date';

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(meal);
    }

    return Array.from(map.entries()).map(([dateKey, dayMeals]) => {
      const totals = dayMeals.reduce(
        (acc, m) => {
          if (m.status === 'completed') {
            acc.calories += m.calories ?? 0;
            acc.proteinG += m.proteinG ?? 0;
            acc.carbsG += m.carbsG ?? 0;
            acc.fatG += m.fatG ?? 0;
          }
          return acc;
        },
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
      );

      return {
        dateKey,
        title: formatDateHeader(dateKey),
        meals: dayMeals,
        totals,
      };
    });
  }, [filteredMeals]);

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
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Meal History</Text>
          <Text style={styles.pageSub}>
            {meals.length} {meals.length === 1 ? 'meal' : 'meals'} logged
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={18} color={Palette.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search meals, ingredients..."
            placeholderTextColor={Palette.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <X size={16} color={Palette.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Palette.brand} />
            <Text style={styles.loadingText}>Loading meal history...</Text>
          </View>
        ) : grouped.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Clock size={24} color={Palette.brand} />
            </View>
            <Text style={styles.emptyTitle}>No meals found</Text>
            <Text style={styles.emptySub}>
              {search
                ? 'Try a different search query'
                : 'Meals you scan or log will appear here grouped by day.'}
            </Text>
            {!search ? (
              <Pressable
                style={({ pressed }) => [styles.scanBtn, pressed && styles.pressed]}
                onPress={() => router.push('/camera')}>
                <Utensils size={18} color="#FFFFFF" />
                <Text style={styles.scanBtnText}>Scan a Meal</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.dateKey} style={styles.groupContainer}>
              {/* Day Summary Header */}
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <Calendar size={16} color={Palette.brand} />
                  <Text style={styles.groupTitle}>{group.title}</Text>
                </View>
                <View style={styles.groupTotals}>
                  <Flame size={14} color={Palette.brand} fill={Palette.brand} />
                  <Text style={styles.groupCalories}>{group.totals.calories} kcal</Text>
                </View>
              </View>

              {/* Day Meals List */}
              <View style={styles.mealList}>
                {group.meals.map((meal) => (
                  <Pressable
                    key={meal.id}
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    onPress={() => setSelectedMeal(meal)}>
                    {meal.imageUrl ? (
                      <Image
                        source={{ uri: meal.imageUrl }}
                        style={styles.thumbImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.thumbFallback}>
                        <Utensils size={24} color={Palette.brand} />
                      </View>
                    )}

                    <View style={styles.middle}>
                      <Text style={styles.mealTitle}>
                        {meal.name || 'Logged Meal'}
                      </Text>
                      <View style={styles.macroRow}>
                        <View style={styles.macroBadge}>
                          <View style={[styles.dot, { backgroundColor: Macro.protein.color }]} />
                          <Text style={styles.macroText}>{meal.proteinG ?? 0}g</Text>
                        </View>
                        <View style={styles.macroBadge}>
                          <View style={[styles.dot, { backgroundColor: Macro.carbs.color }]} />
                          <Text style={styles.macroText}>{meal.carbsG ?? 0}g</Text>
                        </View>
                        <View style={styles.macroBadge}>
                          <View style={[styles.dot, { backgroundColor: Macro.fat.color }]} />
                          <Text style={styles.macroText}>{meal.fatG ?? 0}g</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.rightCol}>
                      <Text style={styles.kcalVal}>{meal.calories ?? 0}</Text>
                      <Text style={styles.kcalLbl}>kcal</Text>
                      {meal.loggedAt ? (
                        <Text style={styles.timeLbl}>{formatTime(meal.loggedAt)}</Text>
                      ) : null}
                    </View>

                    <ChevronRight size={18} color={Palette.textTertiary} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))
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
    gap: 16,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: 2,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.8,
  },
  pageSub: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Palette.border,
    ...CardShadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  emptyCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
  },
  emptySub: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    marginTop: 8,
  },
  scanBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupContainer: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  groupTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.brand,
    fontFamily: NumeralFont,
  },
  mealList: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...CardShadow,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  thumbImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  thumbFallback: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    gap: 4,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  kcalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.brand,
    fontFamily: NumeralFont,
  },
  kcalLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
    marginTop: -2,
  },
  timeLbl: {
    fontSize: 11,
    color: Palette.textTertiary,
    marginTop: 2,
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
