import { StatusBar } from 'expo-status-bar';
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  Flame,
  PieChart,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { useMeals } from '@/hooks/use-meals';
import { useProfile } from '@/hooks/use-profile';

import { formatLocalDateKey } from '@/components/home/DateStrip';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { meals, loading } = useMeals();

  const dailyTarget = profile?.dailyCalories ?? 2200;
  const targetProtein = profile?.proteinG ?? 140;
  const targetCarbs = profile?.carbsG ?? 220;
  const targetFat = profile?.fatG ?? 70;

  // Compute real 7-day analytics metrics based on user's logged meals
  const analyticsData = useMemo(() => {
    const completedMeals = meals.filter((m) => m.status === 'completed');

    // Build last 7 days array (local time format)
    const days: { label: string; dateStr: string; calories: number; target: number; dayMeals: typeof completedMeals }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = formatLocalDateKey(d);
      // Use short day of week label (e.g. Wed, Thu, Fri, Sat, Sun, Mon, Today) - no "Yesterday"
      const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayMeals = completedMeals.filter((m) => {
        if (!m.loggedAt) return false;
        return formatLocalDateKey(new Date(m.loggedAt)) === dateStr;
      });
      const dayCals = dayMeals.reduce((acc, m) => acc + (m.calories ?? 0), 0);

      days.push({
        label: dayLabel,
        dateStr,
        calories: dayCals,
        target: dailyTarget,
        dayMeals,
      });
    }

    // Aggregate totals strictly for meals logged in the 7-day window
    const sevenDayMeals = days.flatMap((d) => d.dayMeals);
    const totalCals = sevenDayMeals.reduce((acc, m) => acc + (m.calories ?? 0), 0);
    const totalProtein = sevenDayMeals.reduce((acc, m) => acc + (m.proteinG ?? 0), 0);
    const totalCarbs = sevenDayMeals.reduce((acc, m) => acc + (m.carbsG ?? 0), 0);
    const totalFat = sevenDayMeals.reduce((acc, m) => acc + (m.fatG ?? 0), 0);

    const loggedDaysCount = days.filter((d) => d.calories > 0).length;
    const avgCalories = loggedDaysCount > 0 ? Math.round(totalCals / loggedDaysCount) : 0;

    // Macro energy distribution: protein (4kcal/g), carbs (4kcal/g), fat (9kcal/g)
    const pEnergy = totalProtein * 4;
    const cEnergy = totalCarbs * 4;
    const fEnergy = totalFat * 9;
    const sumEnergy = Math.max(1, pEnergy + cEnergy + fEnergy);

    const pPct = Math.round((pEnergy / sumEnergy) * 100);
    const cPct = Math.round((cEnergy / sumEnergy) * 100);
    const fPct = Math.max(0, 100 - pPct - cPct);

    // Max calories in 7-day chart for bar height normalization
    const maxChartCals = Math.max(dailyTarget * 1.2, ...days.map((d) => d.calories));

    return {
      days,
      totalCals,
      avgCalories,
      loggedDaysCount,
      totalProtein,
      totalCarbs,
      totalFat,
      pPct,
      cPct,
      fPct,
      maxChartCals,
    };
  }, [meals, dailyTarget]);

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Analytics & Insights</Text>
          <Text style={styles.pageSub}>Track your nutrition trends & consistency</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Palette.brand} />
            <Text style={styles.loadingText}>Calculating analytics...</Text>
          </View>
        ) : (
          <>
            {/* Highlights Grid */}
            <View style={styles.highlightGrid}>
              <View style={[styles.highlightCard, { backgroundColor: Palette.brandTint }]}>
                <View style={styles.highlightHeader}>
                  <Flame size={20} color={Palette.brand} fill={Palette.brand} />
                  <Text style={styles.highlightLabel}>Daily Avg</Text>
                </View>
                <Text style={styles.highlightValue}>{analyticsData.avgCalories}</Text>
                <Text style={styles.highlightSub}>Target: {dailyTarget} kcal</Text>
              </View>

              <View style={[styles.highlightCard, { backgroundColor: '#FDF0D5' }]}>
                <View style={styles.highlightHeader}>
                  <Zap size={20} color="#D97706" />
                  <Text style={styles.highlightLabel}>Active Days</Text>
                </View>
                <Text style={[styles.highlightValue, { color: '#B45309' }]}>
                  {analyticsData.loggedDaysCount}/7
                </Text>
                <Text style={styles.highlightSub}>Logged this week</Text>
              </View>
            </View>

            {/* Weekly Calorie Intake Bar Chart Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <BarChart3 size={20} color={Palette.brand} />
                  <Text style={styles.cardTitle}>Weekly Calorie Intake</Text>
                </View>
                <Text style={styles.chartSub}>7-Day View</Text>
              </View>

              {/* Bar Chart Container */}
              <View style={styles.chartContainer}>
                {analyticsData.days.map((day, idx) => {
                  const fillHeightPct = Math.min(100, Math.round((day.calories / analyticsData.maxChartCals) * 100));
                  const isToday = day.label === 'Today';
                  const isOverTarget = day.calories > dailyTarget;

                  return (
                    <View key={idx} style={styles.chartCol}>
                      <Text style={styles.colVal}>
                        {day.calories > 0 ? `${Math.round(day.calories)}` : ''}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(8, fillHeightPct)}%`,
                              backgroundColor: isToday
                                ? Palette.brand
                                : isOverTarget
                                ? '#EF4444'
                                : day.calories > 0
                                ? '#4ADE80'
                                : Palette.track,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.colLabel, isToday && styles.colLabelActive]}>
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Macro Ratio Breakdown */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <PieChart size={20} color={Palette.brand} />
                  <Text style={styles.cardTitle}>Macro Distribution</Text>
                </View>
              </View>

              {/* Multi-segment Progress Bar */}
              <View style={styles.macroSegmentTrack}>
                <View
                  style={[
                    styles.macroSegment,
                    {
                      width: `${analyticsData.pPct}%`,
                      backgroundColor: Macro.protein.color,
                      borderTopLeftRadius: 10,
                      borderBottomLeftRadius: 10,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.macroSegment,
                    {
                      width: `${analyticsData.cPct}%`,
                      backgroundColor: Macro.carbs.color,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.macroSegment,
                    {
                      width: `${analyticsData.fPct}%`,
                      backgroundColor: Macro.fat.color,
                      borderTopRightRadius: 10,
                      borderBottomRightRadius: 10,
                    },
                  ]}
                />
              </View>

              {/* Macro Cards Breakdown */}
              <View style={styles.macroGrid}>
                <View style={[styles.macroCard, { backgroundColor: Macro.protein.tint }]}>
                  <View style={styles.macroCardHeader}>
                    <View style={[styles.dot, { backgroundColor: Macro.protein.color }]} />
                    <Text style={styles.macroName}>Protein</Text>
                  </View>
                  <Text style={[styles.macroVal, { color: Macro.protein.color }]}>
                    {analyticsData.totalProtein}g
                  </Text>
                  <Text style={styles.macroPct}>{analyticsData.pPct}% energy</Text>
                </View>

                <View style={[styles.macroCard, { backgroundColor: Macro.carbs.tint }]}>
                  <View style={styles.macroCardHeader}>
                    <View style={[styles.dot, { backgroundColor: Macro.carbs.color }]} />
                    <Text style={styles.macroName}>Carbs</Text>
                  </View>
                  <Text style={[styles.macroVal, { color: Macro.carbs.color }]}>
                    {analyticsData.totalCarbs}g
                  </Text>
                  <Text style={styles.macroPct}>{analyticsData.cPct}% energy</Text>
                </View>

                <View style={[styles.macroCard, { backgroundColor: Macro.fat.tint }]}>
                  <View style={styles.macroCardHeader}>
                    <View style={[styles.dot, { backgroundColor: Macro.fat.color }]} />
                    <Text style={styles.macroName}>Fat</Text>
                  </View>
                  <Text style={[styles.macroVal, { color: Macro.fat.color }]}>
                    {analyticsData.totalFat}g
                  </Text>
                  <Text style={styles.macroPct}>{analyticsData.fPct}% energy</Text>
                </View>
              </View>
            </View>

            {/* Streak & Achievements Card */}
            <View style={[styles.card, styles.streakCard]}>
              <View style={styles.streakLeft}>
                <View style={styles.awardCircle}>
                  <Award size={26} color="#FFFFFF" />
                </View>
                <View style={styles.streakTextCol}>
                  <Text style={styles.streakTitle}>Consistency Streak</Text>
                  <Text style={styles.streakSub}>
                    You&apos;ve logged meals {analyticsData.loggedDaysCount} out of 7 days this week!
                  </Text>
                </View>
              </View>
            </View>
          </>
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
    gap: 16,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: 2,
    marginBottom: 4,
    paddingHorizontal: 4,
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
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  highlightGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  highlightCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 4,
    ...CardShadow,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  highlightValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.brand,
    fontFamily: NumeralFont,
  },
  highlightSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...CardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  chartSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 20,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  colVal: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textSecondary,
    fontFamily: NumeralFont,
  },
  barTrack: {
    width: 22,
    flex: 1,
    backgroundColor: Palette.track,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  colLabelActive: {
    color: Palette.brand,
    fontWeight: '800',
  },
  macroSegmentTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 10,
    backgroundColor: Palette.track,
    overflow: 'hidden',
  },
  macroSegment: {
    height: '100%',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 12,
    gap: 4,
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  macroName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.text,
  },
  macroVal: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: NumeralFont,
  },
  macroPct: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  streakCard: {
    backgroundColor: Palette.brand,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  awardCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTextCol: {
    flex: 1,
    gap: 2,
  },
  streakTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
});
