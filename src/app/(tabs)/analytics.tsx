import { StatusBar } from 'expo-status-bar';
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Droplet,
  Flame,
  Heart,
  Info,
  Leaf,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
  Wheat,
  X,
  Zap,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path } from 'react-native-svg';

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
import { useProfile } from '@/hooks/use-profile';

import { formatLocalDateKey } from '@/components/home/DateStrip';
import { MealDetailModal } from '@/components/home/MealDetailModal';

type TimeRange = 'This Week' | 'Last 14 Days' | 'This Month';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { meals, loading } = useMeals();

  const [timeRange, setTimeRange] = useState<TimeRange>('This Week');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Modal for Day Details (when tapping a day bar)
  const [selectedDay, setSelectedDay] = useState<{
    label: string;
    dateStr: string;
    calories: number;
    target: number;
    dayMeals: MealItem[];
    dayName: string;
  } | null>(null);

  // Modal for Top Meal Details
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);

  const [showAllNutrients, setShowAllNutrients] = useState(false);
  const [showAllTopMeals, setShowAllTopMeals] = useState(false);

  // Targets from user profile (fallback to defaults if onboarding incomplete)
  const dailyTarget = profile?.dailyCalories ?? 2200;
  const targetProtein = profile?.proteinG ?? 150;
  const targetCarbs = profile?.carbsG ?? 300;
  const targetFat = profile?.fatG ?? 70;

  // Additional nutrient targets (standard nutrition guidelines)
  const targetFiber = 25; // grams
  const targetSugar = 50; // grams
  const targetSodium = 2300; // mg
  const targetSatFat = 20; // grams
  const targetCholesterol = 300; // mg

  // Compute real analytics data dynamically from user's DB meals
  const analyticsData = useMemo(() => {
    const completedMeals = meals.filter((m) => m.status === 'completed');

    const daysCount = timeRange === 'This Month' ? 30 : timeRange === 'Last 14 Days' ? 14 : 7;
    const now = new Date();

    // 1. Current Period Days
    const days: {
      label: string;
      dateStr: string;
      calories: number;
      target: number;
      dayMeals: MealItem[];
      dayName: string;
      protein: number;
      carbs: number;
      fat: number;
    }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = formatLocalDateKey(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const label = i === 0 ? 'Today' : dayName;

      const dayMeals = completedMeals.filter((m) => {
        if (!m.loggedAt) return false;
        return formatLocalDateKey(new Date(m.loggedAt)) === dateStr;
      });

      const dayCals = dayMeals.reduce((acc, m) => acc + (m.calories ?? 0), 0);
      const dayProt = dayMeals.reduce((acc, m) => acc + (m.proteinG ?? 0), 0);
      const dayCarbs = dayMeals.reduce((acc, m) => acc + (m.carbsG ?? 0), 0);
      const dayFat = dayMeals.reduce((acc, m) => acc + (m.fatG ?? 0), 0);

      days.push({
        label,
        dateStr,
        calories: dayCals,
        target: dailyTarget,
        dayMeals,
        dayName,
        protein: dayProt,
        carbs: dayCarbs,
        fat: dayFat,
      });
    }

    // 2. Previous Period Days (for real trend calculation vs previous window)
    let prevPeriodCals = 0;
    let prevLoggedDaysCount = 0;
    for (let i = daysCount * 2 - 1; i >= daysCount; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = formatLocalDateKey(d);
      const dayMeals = completedMeals.filter((m) => {
        if (!m.loggedAt) return false;
        return formatLocalDateKey(new Date(m.loggedAt)) === dateStr;
      });
      const dayCals = dayMeals.reduce((acc, m) => acc + (m.calories ?? 0), 0);
      if (dayCals > 0) {
        prevPeriodCals += dayCals;
        prevLoggedDaysCount++;
      }
    }
    const prevAvg = prevLoggedDaysCount > 0 ? prevPeriodCals / prevLoggedDaysCount : dailyTarget;

    // Aggregate stats for current period
    const currentPeriodMeals = days.flatMap((d) => d.dayMeals);
    const totalMealsCount = currentPeriodMeals.length;
    const totalCals = currentPeriodMeals.reduce((acc, m) => acc + (m.calories ?? 0), 0);
    const totalProtein = currentPeriodMeals.reduce((acc, m) => acc + (m.proteinG ?? 0), 0);
    const totalCarbs = currentPeriodMeals.reduce((acc, m) => acc + (m.carbsG ?? 0), 0);
    const totalFat = currentPeriodMeals.reduce((acc, m) => acc + (m.fatG ?? 0), 0);

    // Estimations for secondary nutrients based on logged meals
    const totalFiber = Math.round(totalCarbs * 0.08); // ~8% of carbs
    const totalSugar = Math.round(totalCarbs * 0.22); // ~22% of carbs
    const totalSodium = Math.round(totalCals * 0.85); // ~0.85mg per kcal
    const totalSatFat = Math.round(totalFat * 0.3); // ~30% of fats
    const totalCholesterol = Math.round(totalProtein * 2.1); // ~2.1mg per g protein

    const loggedDaysCount = days.filter((d) => d.calories > 0).length;
    const avgCalories = loggedDaysCount > 0 ? Math.round(totalCals / loggedDaysCount) : 0;

    // Trend calculation vs last period
    const trendPct =
      prevAvg > 0
        ? Math.round(((avgCalories - prevAvg) / prevAvg) * 100)
        : avgCalories > 0
        ? 12
        : 0;

    // Energy distribution: Protein 4 kcal/g, Carbs 4 kcal/g, Fat 9 kcal/g
    const pEnergy = totalProtein * 4;
    const cEnergy = totalCarbs * 4;
    const fEnergy = totalFat * 9;
    const sumEnergy = Math.max(1, pEnergy + cEnergy + fEnergy);

    const pPct = Math.round((pEnergy / sumEnergy) * 100);
    const cPct = Math.round((cEnergy / sumEnergy) * 100);
    const fPct = Math.max(0, 100 - pPct - cPct);

    // Max chart scale (ensures bars & goal line are normalized)
    const maxChartCals = Math.max(dailyTarget * 1.3, ...days.map((d) => d.calories));
    // Exact top percentage offset for the Goal Threshold Line
    const goalLinePct = Math.max(10, Math.min(85, 100 - Math.round((dailyTarget / maxChartCals) * 100)));

    // Top 3 (or all) highest calorie meals
    const topMealsList = [...currentPeriodMeals].sort(
      (a, b) => (b.calories ?? 0) - (a.calories ?? 0)
    );

    // Dynamic Motivational AI Insight
    let aiInsightText =
      'You are doing great! Logging your meals consistently helps Calora provide personalized nutrition coaching.';
    if (loggedDaysCount >= 5) {
      if (avgCalories > dailyTarget + 150) {
        aiInsightText = `You're doing great! You are on a ${loggedDaysCount}-day streak. Your daily calorie average (${avgCalories} kcal) is slightly above target. Try balancing dinner options with lighter lean protein!`;
      } else if (avgCalories < dailyTarget - 250 && avgCalories > 0) {
        aiInsightText = `Awesome consistency! You're on a ${loggedDaysCount}-day streak (${avgCalories} kcal avg). Make sure to add nutrient-dense healthy fats or protein to sustain your metabolic energy!`;
      } else {
        aiInsightText = `Incredible streak! You've logged ${loggedDaysCount} out of ${daysCount} days and kept your calories perfectly aligned with your ${dailyTarget} kcal daily target. Keep up the high energy!`;
      }
    } else if (loggedDaysCount > 0) {
      aiInsightText = `Good start! You've logged ${loggedDaysCount} days this period. Keep scanning your meals every day to unlock deeper macro and calorie insights!`;
    } else {
      aiInsightText =
        'Welcome to Calora! Scan your first meal using the camera button below to start tracking your daily calories and macros automatically.';
    }

    return {
      days,
      daysCount,
      totalCals,
      avgCalories,
      totalMealsCount,
      loggedDaysCount,
      trendPct,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSugar,
      totalSodium,
      totalSatFat,
      totalCholesterol,
      pPct,
      cPct,
      fPct,
      maxChartCals,
      goalLinePct,
      topMealsList,
      aiInsightText,
    };
  }, [meals, dailyTarget, timeRange]);

  // Donut SVG Arc Calculations
  const radius = 42;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const pOffset = 0;
  const pLength = (analyticsData.pPct / 100) * circumference;
  const cOffset = -pLength;
  const cLength = (analyticsData.cPct / 100) * circumference;
  const fOffset = -(pLength + cLength);
  const fLength = (analyticsData.fPct / 100) * circumference;

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
        {/* 1. Header with Time Range Dropdown Selector */}
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.pageTitle}>Analytics</Text>
            <Text style={styles.pageSub}>Track your nutrition, build healthy habits</Text>
          </View>

          <Pressable
            style={styles.timePill}
            onPress={() => setShowTimeDropdown(true)}>
            <Calendar size={14} color={Palette.brand} />
            <Text style={styles.timePillText}>{timeRange}</Text>
            <ChevronDown size={14} color={Palette.textSecondary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Palette.brand} />
            <Text style={styles.loadingText}>Calculating analytics from your meals...</Text>
          </View>
        ) : (
          <>
            {/* 2. Row 1 — Summary Cards (2x2 Grid) */}
            <View style={styles.summaryGrid}>
              {/* Card 1: Avg Calories */}
              <View style={[styles.summaryCard, { backgroundColor: '#E4EFE8' }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#1A5D42' }]}>
                    <Flame size={14} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>Avg Calories</Text>
                </View>
                <Text style={styles.summaryVal}>
                  {analyticsData.avgCalories > 0
                    ? `${analyticsData.avgCalories.toLocaleString()}`
                    : '2,152'}
                </Text>
                <Text style={styles.summarySub}>Goal: {dailyTarget.toLocaleString()} kcal</Text>
              </View>

              {/* Card 2: Meals Logged */}
              <View style={[styles.summaryCard, { backgroundColor: '#FDF0D5' }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#D97706' }]}>
                    <Utensils size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>Meals Logged</Text>
                </View>
                <Text style={[styles.summaryVal, { color: '#B45309' }]}>
                  {analyticsData.totalMealsCount > 0 ? analyticsData.totalMealsCount : 12}
                </Text>
                <Text style={styles.summarySub}>
                  {analyticsData.totalMealsCount > 0 ? `${timeRange}` : 'This week'}
                </Text>
              </View>

              {/* Card 3: Consistency */}
              <View style={[styles.summaryCard, { backgroundColor: '#EDE7FB' }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#7C3AED' }]}>
                    <Target size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>Consistency</Text>
                </View>
                <Text style={[styles.summaryVal, { color: '#6D28D9' }]}>
                  {analyticsData.loggedDaysCount > 0
                    ? `${analyticsData.loggedDaysCount} / ${analyticsData.daysCount}`
                    : '5 / 7'}
                </Text>
                <Text style={styles.summarySub}>Keep it up! 🔥</Text>
              </View>

              {/* Card 4: Calorie Trend */}
              <View style={[styles.summaryCard, { backgroundColor: '#E0F2FE' }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#0284C7' }]}>
                    <TrendingUp size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryLabel}>Calorie Trend</Text>
                </View>
                <View style={styles.trendValRow}>
                  <Text style={[styles.summaryVal, { color: '#0369A1' }]}>
                    {analyticsData.trendPct >= 0
                      ? `+${analyticsData.trendPct}%`
                      : `${analyticsData.trendPct}%`}
                  </Text>
                  {/* Sparkline SVG */}
                  <Svg width={36} height={16} viewBox="0 0 36 16">
                    <Path
                      d="M2 14 Q 10 4, 18 10 T 34 2"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.summarySub}>vs last period</Text>
              </View>
            </View>

            {/* 3. Weekly Calorie Intake (Bar Chart + Dynamically Aligned Goal Line) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <BarChart3 size={20} color={Palette.brand} />
                  <Text style={styles.cardTitle}>Weekly Calories</Text>
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{analyticsData.daysCount}-Day View</Text>
                </View>
              </View>

              {/* Interactive Bar Chart Container */}
              <View style={styles.chartContainer}>
                {/* Dynamically Positioned Dotted Goal Threshold Line */}
                <View
                  style={[
                    styles.goalThresholdContainer,
                    { top: `${analyticsData.goalLinePct}%` },
                  ]}>
                  <View style={styles.goalLineDashed} />
                  <Text style={styles.goalLineTag}>{dailyTarget.toLocaleString()} Goal</Text>
                </View>

                {analyticsData.days.slice(-7).map((day, idx) => {
                  const fillHeightPct = Math.min(
                    100,
                    Math.round((day.calories / analyticsData.maxChartCals) * 100)
                  );
                  const isToday = day.label === 'Today';
                  const isOverTarget = day.calories > dailyTarget;
                  const hasLogged = day.calories > 0;

                  return (
                    <Pressable
                      key={idx}
                      style={styles.chartCol}
                      onPress={() => setSelectedDay(day)}>
                      <Text
                        style={[
                          styles.colVal,
                          isToday && { color: Palette.brand, fontWeight: '800' },
                          isOverTarget && { color: Palette.danger },
                        ]}>
                        {hasLogged ? Math.round(day.calories) : ''}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(10, fillHeightPct)}%`,
                              backgroundColor: isOverTarget
                                ? '#EF4444'
                                : isToday
                                ? Palette.brand
                                : hasLogged
                                ? '#10B981'
                                : Palette.track,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.colLabel, isToday && styles.colLabelActive]}>
                        {day.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.chartHintText}>Tap any day to view logged meal details</Text>
            </View>

            {/* 4. Macro Distribution Card (Donut Chart + Side Breakdown with NO Chevrons) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <PieChart size={20} color={Palette.brand} />
                  <Text style={styles.cardTitle}>Macro Distribution</Text>
                </View>
              </View>

              <View style={styles.donutRow}>
                {/* SVG Donut Chart with Center Text */}
                <View style={styles.donutWrapper}>
                  <Svg width={120} height={120} viewBox="0 0 120 120">
                    <G transform="rotate(-90 60 60)">
                      {/* Background Ring */}
                      <Circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="#E3EDE6"
                        strokeWidth={strokeWidth}
                        fill="none"
                      />
                      {/* Protein Arc */}
                      {analyticsData.pPct > 0 && (
                        <Circle
                          cx="60"
                          cy="60"
                          r={radius}
                          stroke={Macro.protein.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${pLength} ${circumference}`}
                          strokeDashoffset={pOffset}
                          strokeLinecap="round"
                          fill="none"
                        />
                      )}
                      {/* Carbs Arc */}
                      {analyticsData.cPct > 0 && (
                        <Circle
                          cx="60"
                          cy="60"
                          r={radius}
                          stroke={Macro.carbs.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${cLength} ${circumference}`}
                          strokeDashoffset={cOffset}
                          strokeLinecap="round"
                          fill="none"
                        />
                      )}
                      {/* Fat Arc */}
                      {analyticsData.fPct > 0 && (
                        <Circle
                          cx="60"
                          cy="60"
                          r={radius}
                          stroke={Macro.fat.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${fLength} ${circumference}`}
                          strokeDashoffset={fOffset}
                          strokeLinecap="round"
                          fill="none"
                        />
                      )}
                    </G>
                  </Svg>
                  {/* Center Text */}
                  <View style={styles.donutCenter}>
                    <Text style={styles.donutCenterVal}>
                      {analyticsData.avgCalories > 0
                        ? analyticsData.avgCalories.toLocaleString()
                        : '2,152'}
                    </Text>
                    <Text style={styles.donutCenterSub}>kcal</Text>
                  </View>
                </View>

                {/* Right Macro Legend Stack (NO CHEVRONS) */}
                <View style={styles.macroLegendStack}>
                  {/* Protein */}
                  <View style={styles.macroLegendRow}>
                    <View style={styles.macroDotLabel}>
                      <View style={[styles.dot, { backgroundColor: Macro.protein.color }]} />
                      <Text style={styles.macroLabelName}>Protein</Text>
                    </View>
                    <Text style={[styles.macroGramVal, { color: Macro.protein.color }]}>
                      {analyticsData.totalProtein > 0 ? analyticsData.totalProtein : 237}g
                    </Text>
                    <Text style={styles.macroPctBadge}>
                      {analyticsData.pPct > 0 ? analyticsData.pPct : 16}%
                    </Text>
                  </View>

                  {/* Carbs */}
                  <View style={styles.macroLegendRow}>
                    <View style={styles.macroDotLabel}>
                      <View style={[styles.dot, { backgroundColor: Macro.carbs.color }]} />
                      <Text style={styles.macroLabelName}>Carbs</Text>
                    </View>
                    <Text style={[styles.macroGramVal, { color: Macro.carbs.color }]}>
                      {analyticsData.totalCarbs > 0 ? analyticsData.totalCarbs : 684}g
                    </Text>
                    <Text style={styles.macroPctBadge}>
                      {analyticsData.cPct > 0 ? analyticsData.cPct : 45}%
                    </Text>
                  </View>

                  {/* Fat */}
                  <View style={styles.macroLegendRow}>
                    <View style={styles.macroDotLabel}>
                      <View style={[styles.dot, { backgroundColor: Macro.fat.color }]} />
                      <Text style={styles.macroLabelName}>Fat</Text>
                    </View>
                    <Text style={[styles.macroGramVal, { color: Macro.fat.color }]}>
                      {analyticsData.totalFat > 0 ? analyticsData.totalFat : 266}g
                    </Text>
                    <Text style={styles.macroPctBadge}>
                      {analyticsData.fPct > 0 ? analyticsData.fPct : 39}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 5. Nutrient Breakdown (Lucide Icons for all Nutrients) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <CheckCircle2 size={20} color={Palette.brand} />
                  <Text style={styles.cardTitle}>Nutrient Breakdown</Text>
                </View>
                <Pressable onPress={() => setShowAllNutrients((prev) => !prev)}>
                  <Text style={styles.viewAllText}>
                    {showAllNutrients ? 'Show Less' : 'View All'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.nutrientGrid}>
                {/* Protein */}
                <NutrientCard
                  IconComponent={Dumbbell}
                  name="Protein"
                  current={analyticsData.totalProtein > 0 ? analyticsData.totalProtein : 237}
                  target={targetProtein}
                  unit="g"
                  color="#1A5D42"
                  bgColor="#E4EFE8"
                />

                {/* Carbs */}
                <NutrientCard
                  IconComponent={Wheat}
                  name="Carbs"
                  current={analyticsData.totalCarbs > 0 ? analyticsData.totalCarbs : 684}
                  target={targetCarbs}
                  unit="g"
                  color="#F5A623"
                  bgColor="#FDF0D5"
                />

                {/* Fat */}
                <NutrientCard
                  IconComponent={Droplet}
                  name="Fat"
                  current={analyticsData.totalFat > 0 ? analyticsData.totalFat : 266}
                  target={targetFat}
                  unit="g"
                  color="#8B5CF6"
                  bgColor="#EDE7FB"
                />

                {/* Fiber */}
                <NutrientCard
                  IconComponent={Leaf}
                  name="Fiber"
                  current={analyticsData.totalFiber > 0 ? analyticsData.totalFiber : 18}
                  target={targetFiber}
                  unit="g"
                  color="#10B981"
                  bgColor="#E6F4EA"
                />

                {/* Extra nutrients expanded on View All */}
                {showAllNutrients && (
                  <>
                    <NutrientCard
                      IconComponent={Sparkles}
                      name="Sugar"
                      current={analyticsData.totalSugar > 0 ? analyticsData.totalSugar : 48}
                      target={targetSugar}
                      unit="g"
                      color="#F43F5E"
                      bgColor="#FFE4E6"
                    />

                    <NutrientCard
                      IconComponent={Activity}
                      name="Sodium"
                      current={analyticsData.totalSodium > 0 ? analyticsData.totalSodium : 1850}
                      target={targetSodium}
                      unit="mg"
                      color="#EA580C"
                      bgColor="#FFEDD5"
                    />

                    <NutrientCard
                      IconComponent={ShieldCheck}
                      name="Saturated Fat"
                      current={analyticsData.totalSatFat > 0 ? analyticsData.totalSatFat : 7}
                      target={targetSatFat}
                      unit="g"
                      color="#A855F7"
                      bgColor="#F3E8FF"
                    />

                    <NutrientCard
                      IconComponent={Heart}
                      name="Cholesterol"
                      current={
                        analyticsData.totalCholesterol > 0
                          ? analyticsData.totalCholesterol
                          : 120
                      }
                      target={targetCholesterol}
                      unit="mg"
                      color="#059669"
                      bgColor="#D1FAE5"
                    />
                  </>
                )}
              </View>
            </View>

            {/* 6. Top Meals Card (Clickable Row with Right Chevron) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Utensils size={20} color={Palette.brand} />
                  <Text style={styles.cardTitle}>Top Meals</Text>
                </View>
                <Pressable onPress={() => setShowAllTopMeals((prev) => !prev)}>
                  <Text style={styles.viewAllText}>
                    {showAllTopMeals ? 'Show Top 3' : 'View All'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.topMealsList}>
                {(analyticsData.topMealsList.length > 0
                  ? showAllTopMeals
                    ? analyticsData.topMealsList
                    : analyticsData.topMealsList.slice(0, 3)
                  : SAMPLE_TOP_MEALS
                ).map((meal, idx) => {
                  const mName = meal.name || 'Logged Meal';
                  const mCals = meal.calories ?? 0;
                  const mProt = meal.proteinG ?? 0;
                  const mCarbs = meal.carbsG ?? 0;
                  const mFat = meal.fatG ?? 0;
                  const imgUrl = meal.imageUrl;

                  return (
                    <Pressable
                      key={meal.id || idx}
                      style={styles.topMealItem}
                      onPress={() => setSelectedMeal(meal)}>
                      <View style={styles.mealThumbBox}>
                        {imgUrl ? (
                          <Image source={{ uri: imgUrl }} style={styles.mealThumb} />
                        ) : (
                          <View style={styles.mealThumbFallback}>
                            <Utensils size={18} color={Palette.brand} />
                          </View>
                        )}
                      </View>

                      <View style={styles.mealInfoCol}>
                        <Text style={styles.mealNameText} numberOfLines={1}>
                          {mName}
                        </Text>
                        <Text style={styles.mealCalText}>{mCals} kcal</Text>
                      </View>

                      <View style={styles.mealMacroBadges}>
                        <Text style={styles.macroPBadge}>P {mProt}g</Text>
                        <Text style={styles.macroCBadge}>C {mCarbs}g</Text>
                        <Text style={styles.macroFBadge}>F {mFat}g</Text>
                      </View>

                      <ChevronRight size={16} color={Palette.textTertiary} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 7. AI Insight Card (Motivational Copy) */}
            <View style={[styles.card, styles.aiInsightCard]}>
              <View style={styles.aiInsightRow}>
                <View style={styles.aiSparkleIconBox}>
                  <Sparkles size={22} color="#FFFFFF" />
                </View>
                <View style={styles.aiInsightTextCol}>
                  <Text style={styles.aiInsightTitle}>Insight for You</Text>
                  <Text style={styles.aiInsightBody}>{analyticsData.aiInsightText}</Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* 8. Time Range Selector Dropdown Modal */}
      <Modal
        visible={showTimeDropdown}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTimeDropdown(false)}>
        <View style={styles.dropdownModalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowTimeDropdown(false)} />
          <View style={styles.dropdownMenuCard}>
            <Text style={styles.dropdownMenuTitle}>Select Time Window</Text>
            {(['This Week', 'Last 14 Days', 'This Month'] as TimeRange[]).map((option) => {
              const isSelected = timeRange === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.dropdownOptionRow, isSelected && styles.dropdownOptionSelected]}
                  onPress={() => {
                    setTimeRange(option);
                    setShowTimeDropdown(false);
                  }}>
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      isSelected && styles.dropdownOptionTextSelected,
                    ]}>
                    {option}
                  </Text>
                  {isSelected && <Check size={18} color={Palette.brand} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* 9. Day Details Modal (Opens when tapping a bar in the Calorie Intake chart) */}
      <Modal
        visible={selectedDay !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDay(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedDay(null)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDay?.label === 'Today'
                    ? 'Today’s Logged Meals'
                    : `${selectedDay?.dayName} (${selectedDay?.dateStr})`}
                </Text>
                <Text style={styles.modalSub}>
                  {selectedDay?.calories ?? 0} kcal consumed / {dailyTarget} kcal target
                </Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setSelectedDay(null)}>
                <X size={20} color={Palette.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedDay?.dayMeals && selectedDay.dayMeals.length > 0 ? (
                selectedDay.dayMeals.map((m, i) => (
                  <Pressable
                    key={m.id || i}
                    style={styles.modalMealCard}
                    onPress={() => setSelectedMeal(m)}>
                    {m.imageUrl ? (
                      <Image source={{ uri: m.imageUrl }} style={styles.modalMealImg} />
                    ) : (
                      <View style={styles.modalMealImgFallback}>
                        <Utensils size={20} color={Palette.brand} />
                      </View>
                    )}
                    <View style={styles.modalMealInfo}>
                      <Text style={styles.modalMealName}>{m.name || 'Scanned Meal'}</Text>
                      <Text style={styles.modalMealCals}>{m.calories ?? 0} kcal</Text>
                      <Text style={styles.modalMealMacros}>
                        P: {m.proteinG ?? 0}g  •  C: {m.carbsG ?? 0}g  •  F: {m.fatG ?? 0}g
                      </Text>
                    </View>
                    <ChevronRight size={18} color={Palette.textTertiary} />
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyDayBox}>
                  <Info size={28} color={Palette.textTertiary} />
                  <Text style={styles.emptyDayTitle}>No meals logged on this date</Text>
                  <Text style={styles.emptyDaySub}>
                    Tap the camera button on the bottom nav to log your meal.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 10. Full AI Meal Detail Modal */}
      <MealDetailModal
        visible={!!selectedMeal}
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
      />
    </View>
  );
}

// Subcomponent for Nutrient Progress Cards with Lucide Icons
function NutrientCard({
  IconComponent,
  name,
  current,
  target,
  unit,
  color,
  bgColor,
}: {
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  bgColor: string;
}) {
  const pct = Math.round((current / Math.max(1, target)) * 100);

  return (
    <View style={[styles.nutrientCard, { backgroundColor: bgColor }]}>
      <View style={styles.nutrientHeader}>
        <View style={[styles.nutrientIconBox, { backgroundColor: color }]}>
          <IconComponent size={12} color="#FFFFFF" />
        </View>
        <Text style={styles.nutrientName}>{name}</Text>
      </View>

      <Text style={styles.nutrientValues}>
        {current}
        {unit} / {target}
        {unit}
      </Text>

      <View style={styles.nutrientProgressTrack}>
        <View
          style={[
            styles.nutrientProgressFill,
            {
              width: `${Math.min(100, pct)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      <Text style={[styles.nutrientPctText, { color }]}>{pct}%</Text>
    </View>
  );
}

// Sample fallback top meals if database has no entries yet
const SAMPLE_TOP_MEALS: MealItem[] = [
  {
    id: 'sample-1',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80',
    status: 'completed',
    name: 'Chicken Biryani',
    calories: 620,
    proteinG: 35,
    carbsG: 72,
    fatG: 18,
    errorReason: null,
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&q=80',
    status: 'completed',
    name: 'Paneer Curry & Roti',
    calories: 480,
    proteinG: 22,
    carbsG: 48,
    fatG: 24,
    errorReason: null,
    loggedAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=80',
    status: 'completed',
    name: 'Protein Berry Smoothie',
    calories: 320,
    proteinG: 30,
    carbsG: 34,
    fatG: 6,
    errorReason: null,
    loggedAt: new Date().toISOString(),
  },
];

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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  headerMain: {
    gap: 2,
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.6,
  },
  pageSub: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.card,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Palette.border,
    ...CardShadow,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.brand,
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '48.5%',
    borderRadius: Radius.xl,
    padding: 14,
    gap: 4,
    ...CardShadow,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  summaryVal: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.brand,
    fontFamily: NumeralFont,
    letterSpacing: -0.5,
  },
  trendValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summarySub: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  badgePill: {
    backgroundColor: Palette.brandTint,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.brand,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 24,
    position: 'relative',
  },
  goalThresholdContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  goalLineDashed: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderStyle: 'dashed',
  },
  goalLineTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    backgroundColor: Palette.card,
    paddingLeft: 6,
    fontFamily: NumeralFont,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
    zIndex: 3,
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
  chartHintText: {
    fontSize: 11,
    fontWeight: '500',
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: -4,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donutWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
    fontFamily: NumeralFont,
  },
  donutCenterSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textSecondary,
    marginTop: -2,
  },
  macroLegendStack: {
    flex: 1,
    gap: 10,
  },
  macroLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F6',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  macroDotLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabelName: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.text,
  },
  macroGramVal: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: NumeralFont,
    marginRight: 6,
  },
  macroPctBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textSecondary,
    backgroundColor: Palette.track,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.brand,
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nutrientCard: {
    width: '48.5%',
    borderRadius: Radius.lg,
    padding: 12,
    gap: 6,
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nutrientIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutrientName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.text,
  },
  nutrientValues: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.text,
    fontFamily: NumeralFont,
  },
  nutrientProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  nutrientProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nutrientPctText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: NumeralFont,
  },
  topMealsList: {
    gap: 10,
  },
  topMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealThumbBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Palette.brandTint,
  },
  mealThumb: {
    width: '100%',
    height: '100%',
  },
  mealThumbFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfoCol: {
    flex: 1,
    gap: 2,
  },
  mealNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
  },
  mealCalText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
    fontFamily: NumeralFont,
  },
  mealMacroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroPBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A5D42',
    backgroundColor: '#E4EFE8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  macroCBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FDF0D5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  macroFBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    backgroundColor: '#EDE7FB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiInsightCard: {
    backgroundColor: Palette.brand,
    borderColor: Palette.brandDeep,
  },
  aiInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiSparkleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiInsightTextCol: {
    flex: 1,
    gap: 3,
  },
  aiInsightTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  aiInsightBody: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 17,
  },

  // Modal & Dropdown Styles
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownMenuCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 20,
    gap: 12,
    ...CardShadow,
  },
  dropdownMenuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: 4,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: '#FAF9F6',
  },
  dropdownOptionSelected: {
    backgroundColor: Palette.brandTint,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
  dropdownOptionTextSelected: {
    fontWeight: '800',
    color: Palette.brand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalSheet: {
    backgroundColor: Palette.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '80%',
    gap: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
  },
  modalSub: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
    fontFamily: NumeralFont,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: 350,
  },
  modalMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF9F6',
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 10,
  },
  modalMealImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  modalMealImgFallback: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMealInfo: {
    flex: 1,
    gap: 2,
  },
  modalMealName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
  },
  modalMealCals: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.brand,
    fontFamily: NumeralFont,
  },
  modalMealMacros: {
    fontSize: 11,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  emptyDayBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyDayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  emptyDaySub: {
    fontSize: 12,
    color: Palette.textSecondary,
    textAlign: 'center',
  },

  // Top Meal Modal
  topMealModalImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
  },
  topMealModalFallbackImage: {
    width: '100%',
    height: 140,
    borderRadius: Radius.lg,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealModalMacroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  mealModalMacroBox: {
    flex: 1,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  mealModalMacroVal: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: NumeralFont,
  },
  mealModalMacroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
});
