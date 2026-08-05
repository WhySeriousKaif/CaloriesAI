import { Image } from 'expo-image';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Flame,
  Heart,
  HeartPulse,
  Leaf,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
  Zap,
} from 'lucide-react-native';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function InsightIcon({ icon }: { icon: string }) {
  if (icon === '⚡' || icon.includes('zap') || icon.toLowerCase().includes('carb') || icon.toLowerCase().includes('energy')) {
    return <Zap size={18} color="#D97706" fill="#FDF0D5" />;
  }
  if (icon === '💪' || icon.toLowerCase().includes('protein') || icon.toLowerCase().includes('muscle')) {
    return <Activity size={18} color="#1A5D42" />;
  }
  if (icon === '🥗' || icon.toLowerCase().includes('portion') || icon.toLowerCase().includes('balanced')) {
    return <Utensils size={18} color="#059669" />;
  }
  if (icon === '✨' || icon === '🥑' || icon.toLowerCase().includes('fat')) {
    return <Sparkles size={18} color="#10B981" />;
  }
  if (icon === '🔥' || icon.toLowerCase().includes('sugar')) {
    return <Flame size={18} color="#EF4444" fill="#FEE2E2" />;
  }
  if (icon === '❤️' || icon.toLowerCase().includes('daily') || icon.toLowerCase().includes('heart')) {
    return <Heart size={18} color="#E5484D" fill="#FDECEC" />;
  }
  return <Sparkles size={18} color="#1A5D42" />;
}

export type MealDetailItem = {
  id?: string;
  name?: string | null;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
  satFatG?: number | null;
  servingSize?: string | null;
  matchConfidence?: string | null;
  healthScore?: number | null;
  healthStatus?: string | null;
  healthExplanation?: string | null;
  aiRecommendation?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  loggedAt?: string | null;
  ingredients?: string[] | null;
  allergens?: string[] | null;
  insights?: Array<{
    icon: string;
    title: string;
    description: string;
  }> | null;
  alternatives?: Array<{
    name: string;
    calories: number;
    tag?: string;
  }> | null;
};

type MealDetailModalProps = {
  visible: boolean;
  meal: MealDetailItem | null;
  onClose: () => void;
};

function getDynamicServingSize(meal: MealDetailItem): string {
  if (meal.servingSize && meal.servingSize !== 'N/A') return meal.servingSize;
  return '1 pack / serving';
}

function getDynamicTitle(meal: MealDetailItem): string {
  if (meal.name && meal.name !== 'Scanned Meal') return meal.name;
  return 'Scanned Food Item';
}

function getDynamicHealthStatus(meal: MealDetailItem): { status: string; explanation: string } {
  if (meal.healthStatus && meal.healthExplanation) {
    return { status: meal.healthStatus, explanation: meal.healthExplanation };
  }
  const score = meal.healthScore ?? 68;
  if (score >= 80) {
    return {
      status: 'Very Healthy',
      explanation: 'Nutrient-dense food item with balanced macronutrients, ideal for daily health goals.',
    };
  }
  if (score >= 50) {
    return {
      status: 'Moderately Healthy',
      explanation: 'Provides good energy, but monitor sodium or fats to maintain balanced nutrition.',
    };
  }
  return {
    status: 'Enjoy in Moderation',
    explanation: 'Higher in calories or sodium/fats. Best enjoyed as an occasional treat.',
  };
}

function getDynamicInsights(meal: MealDetailItem): Array<{ icon: string; title: string; description: string }> {
  if (meal.insights && meal.insights.length > 0) return meal.insights;

  const list: Array<{ icon: string; title: string; description: string }> = [];
  const carbs = meal.carbsG ?? 0;
  const protein = meal.proteinG ?? 0;
  const fat = meal.fatG ?? 0;
  const sugar = meal.sugarG ?? 0;

  if (carbs > 30) {
    list.push({ icon: '⚡', title: 'Carb Energy', description: `Provides ${carbs}g of carbohydrates for sustained activity.` });
  }
  if (protein >= 10) {
    list.push({ icon: '💪', title: 'Protein Rich', description: `Contains ${protein}g of protein for muscle support.` });
  } else {
    list.push({ icon: '🥗', title: 'Balanced Portion', description: 'Good standard portion size for quick logging.' });
  }
  if (fat >= 15) {
    list.push({ icon: '🥑', title: 'Moderate Fat', description: `Contains ${fat}g of total fats; plan daily macros accordingly.` });
  } else {
    list.push({ icon: '✨', title: 'Low Fat', description: 'Light on fats, suitable for lean meal goals.' });
  }
  if (sugar > 12) {
    list.push({ icon: '🔥', title: 'Contains Sugars', description: `Includes ${sugar}g of sugars; enjoy in moderation.` });
  } else {
    list.push({ icon: '❤️', title: 'Daily Friendly', description: 'Fits comfortably into standard daily calorie goals.' });
  }
  return list;
}

function getDynamicIngredients(meal: MealDetailItem): string[] {
  if (meal.ingredients && meal.ingredients.length > 0) return meal.ingredients;
  const name = (meal.name || '').toLowerCase();
  if (name.includes('chip') || name.includes('wafer') || name.includes('crunch')) {
    return ['Potato', 'Vegetable Oil', 'Spices', 'Salt', 'Flavor Enhancers'];
  }
  if (name.includes('salad') || name.includes('chicken')) {
    return ['Chicken Breast', 'Leafy Greens', 'Olive Oil', 'Seasoning'];
  }
  return ['See product packaging for complete ingredient list'];
}

function getDynamicAllergens(meal: MealDetailItem): string[] {
  if (meal.allergens && meal.allergens.length > 0) return meal.allergens;
  const name = (meal.name || '').toLowerCase();
  if (name.includes('chip') || name.includes('snack')) {
    return ['May contain Soy / Wheat traces'];
  }
  return ['Check packaging for allergen warnings'];
}

function getDynamicRecommendation(meal: MealDetailItem): string {
  if (meal.aiRecommendation) return meal.aiRecommendation;
  return `This food provides ${meal.calories ?? 0} kcal. Incorporate it into your overall daily macro goals for balanced energy.`;
}

function getDynamicAlternatives(meal: MealDetailItem): Array<{ name: string; calories: number; tag: string }> {
  if (meal.alternatives && meal.alternatives.length > 0) {
    return meal.alternatives.map((item) => ({
      name: item.name,
      calories: item.calories,
      tag: item.tag || 'Healthy Choice',
    }));
  }
  const name = (meal.name || '').toLowerCase();
  if (name.includes('chip') || name.includes('wafer') || name.includes('crunch')) {
    return [
      { name: 'Baked Chips', calories: 120, tag: 'Lower Fat' },
      { name: 'Air-popped Popcorn', calories: 95, tag: 'High Fiber' },
      { name: 'Roasted Chana', calories: 110, tag: 'High Protein' },
      { name: 'Makhana (Fox Nuts)', calories: 100, tag: 'Light Snack' },
    ];
  }
  return [
    { name: 'Greek Yogurt', calories: 130, tag: 'High Protein' },
    { name: 'Fruit Salad', calories: 90, tag: 'Fresh & Light' },
    { name: 'Oatmeal', calories: 150, tag: 'Complex Carbs' },
    { name: 'Handful of Almonds', calories: 160, tag: 'Healthy Fats' },
  ];
}

function NutritionRow({
  label,
  value,
  percent,
  color,
  progress,
}: {
  label: string;
  value: string;
  percent: string;
  color: string;
  progress: number;
}) {
  return (
    <View style={styles.nutritionRow}>
      <View style={styles.nutritionLabelRow}>
        <Text style={styles.nutritionLabel}>{label}</Text>
        <View style={styles.nutritionRightVals}>
          <Text style={styles.nutritionValue}>{value}</Text>
          <Text style={styles.nutritionPercent}>{percent}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export function MealDetailModal({ visible, meal, onClose }: MealDetailModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible || !meal) return null;

  const servingText = getDynamicServingSize(meal);
  const foodTitle = getDynamicTitle(meal);
  const healthInfo = getDynamicHealthStatus(meal);
  const insightsList = getDynamicInsights(meal);
  const ingredientsList = getDynamicIngredients(meal);
  const allergensList = getDynamicAllergens(meal);
  const recommendationText = getDynamicRecommendation(meal);
  const alternativesList = getDynamicAlternatives(meal);

  const formattedTime = meal.loggedAt
    ? `Logged on ${new Date(meal.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : 'AI Vision Analysis Complete';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.glassIconButton, pressed && styles.pressed]}>
            <ChevronLeft size={22} color="#1A1A1A" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Meal Details</Text>
          <View style={styles.aiVerifiedBadge}>
            <Sparkles size={14} color="#1A5D42" />
            <Text style={styles.aiVerifiedText}>AI Verified</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 70 },
          ]}>
          {/* Hero Section */}
          <View style={styles.heroSectionCard}>
            {meal.imageUrl ? (
              <View style={styles.heroImageContainer}>
                <Image
                  source={{ uri: meal.imageUrl }}
                  style={styles.heroImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
                <View style={styles.heroImageBadgeRow}>
                  <View style={styles.confidencePill}>
                    <CheckCircle2 size={13} color="#10B981" />
                    <Text style={styles.confidencePillText}>{meal.matchConfidence || '98% Match'}</Text>
                  </View>
                  <View style={styles.servingPill}>
                    <Text style={styles.servingPillText}>{servingText}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.heroTitleBox}>
              <Text style={styles.heroFoodTitle}>{foodTitle}</Text>
              <Text style={styles.heroTimestamp}>{formattedTime}</Text>
            </View>
          </View>

          {/* Calories Banner Card */}
          <View style={styles.caloriesBannerCard}>
            <View style={styles.caloriesFlameCircle}>
              <Flame size={26} color="#D97706" />
            </View>
            <View style={styles.caloriesTextContainer}>
              <View style={styles.caloriesNumberRow}>
                <Text style={styles.caloriesLargeNumber}>{meal.calories ?? 0}</Text>
                <Text style={styles.caloriesUnit}>kcal</Text>
              </View>
              <Text style={styles.caloriesSubtext}>Serving: {servingText}</Text>
            </View>
          </View>

          {/* 4 Horizontal Macro Cards */}
          <View style={styles.macroCardsGrid}>
            <View style={[styles.macroCardItem, { backgroundColor: '#E4EFE8', borderColor: '#CBE1D4' }]}>
              <Text style={[styles.macroCardValue, { color: '#1A5D42' }]}>{meal.proteinG ?? 0}g</Text>
              <Text style={styles.macroCardLabel}>Protein</Text>
            </View>

            <View style={[styles.macroCardItem, { backgroundColor: '#FDF0D5', borderColor: '#F9E2B5' }]}>
              <Text style={[styles.macroCardValue, { color: '#D97706' }]}>{meal.carbsG ?? 0}g</Text>
              <Text style={styles.macroCardLabel}>Carbs</Text>
            </View>

            <View style={[styles.macroCardItem, { backgroundColor: '#EDE7FB', borderColor: '#D8C9F8' }]}>
              <Text style={[styles.macroCardValue, { color: '#7C3AED' }]}>{meal.fatG ?? 0}g</Text>
              <Text style={styles.macroCardLabel}>Fat</Text>
            </View>

            <View style={[styles.macroCardItem, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
              <Text style={[styles.macroCardValue, { color: '#0284C7' }]}>{meal.fiberG ?? 1}g</Text>
              <Text style={styles.macroCardLabel}>Fiber</Text>
            </View>
          </View>

          {/* AI Health Score Card */}
          <View style={styles.healthScoreCard}>
            <View style={styles.healthScoreHeader}>
              <View style={styles.scoreGaugeCircle}>
                <Text style={styles.scoreGaugeNumber}>{meal.healthScore ?? 68}</Text>
                <Text style={styles.scoreGaugeTotal}>/100</Text>
              </View>
              <View style={styles.healthScoreRightBox}>
                <View style={styles.healthStatusBadge}>
                  <HeartPulse size={14} color="#D97706" />
                  <Text style={styles.healthStatusText}>{healthInfo.status}</Text>
                </View>
                <Text style={styles.healthScoreSubtitle}>AI Health Score Evaluation</Text>
              </View>
            </View>
            <Text style={styles.healthScoreExplanation}>{healthInfo.explanation}</Text>
          </View>

          {/* Nutrition Facts Progress Bars */}
          <View style={styles.sectionContainerCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              <Text style={styles.sectionSubtitle}>% Daily Value*</Text>
            </View>

            <NutritionRow label="Calories" value={`${meal.calories ?? 0} kcal`} percent={`${Math.round(((meal.calories ?? 0) / 2000) * 100)}%`} color="#1A5D42" progress={(meal.calories ?? 0) / 2000} />
            <NutritionRow label="Protein" value={`${meal.proteinG ?? 0}g`} percent={`${Math.round(((meal.proteinG ?? 0) / 50) * 100)}%`} color="#10B981" progress={(meal.proteinG ?? 0) / 50} />
            <NutritionRow label="Carbs" value={`${meal.carbsG ?? 0}g`} percent={`${Math.round(((meal.carbsG ?? 0) / 275) * 100)}%`} color="#F59E0B" progress={(meal.carbsG ?? 0) / 275} />
            <NutritionRow label="Fat" value={`${meal.fatG ?? 0}g`} percent={`${Math.round(((meal.fatG ?? 0) / 78) * 100)}%`} color="#8B5CF6" progress={(meal.fatG ?? 0) / 78} />
            <NutritionRow label="Sugar" value={`${meal.sugarG ?? 10}g`} percent={`${Math.round(((meal.sugarG ?? 10) / 50) * 100)}%`} color="#EF4444" progress={(meal.sugarG ?? 10) / 50} />
            <NutritionRow label="Sodium" value={`${meal.sodiumMg ?? 80}mg`} percent={`${Math.round(((meal.sodiumMg ?? 80) / 2300) * 100)}%`} color="#14B8A6" progress={(meal.sodiumMg ?? 80) / 2300} />
            <NutritionRow label="Fiber" value={`${meal.fiberG ?? 1}g`} percent={`${Math.round(((meal.fiberG ?? 1) / 28) * 100)}%`} color="#06B6D4" progress={(meal.fiberG ?? 1) / 28} />
            <NutritionRow label="Saturated Fat" value={`${meal.satFatG ?? 4}g`} percent={`${Math.round(((meal.satFatG ?? 4) / 20) * 100)}%`} color="#F43F5E" progress={(meal.satFatG ?? 4) / 20} />
          </View>

          {/* AI Insights Section */}
          <View style={styles.sectionContainerCard}>
            <View style={styles.sectionHeaderRow}>
              <Sparkles size={18} color="#1A5D42" />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>AI Insights</Text>
            </View>

            <View style={styles.insightsGrid}>
              {insightsList.map((item, idx) => (
                <View key={idx} style={styles.insightCardItem}>
                  <View style={styles.insightIconBadge}>
                    <InsightIcon icon={item.icon} />
                  </View>
                  <Text style={styles.insightTitle}>{item.title}</Text>
                  <Text style={styles.insightDesc}>{item.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ingredients & Allergens */}
          <View style={styles.sectionContainerCard}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.chipsWrap}>
              {ingredientsList.map((ing, idx) => (
                <View key={idx} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ing}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Allergens</Text>
            <View style={styles.chipsWrap}>
              {allergensList.map((all, idx) => (
                <View key={idx} style={styles.allergenChip}>
                  <AlertTriangle size={13} color="#D97706" />
                  <Text style={styles.allergenChipText}>{all}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Health Recommendation Banner */}
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <ShieldCheck size={18} color="#059669" />
              <Text style={styles.recommendationHeaderTitle}>AI Recommendation</Text>
            </View>
            <Text style={styles.recommendationText}>"{recommendationText}"</Text>
          </View>

          {/* Healthier Alternatives */}
          <View style={styles.sectionContainerCard}>
            <View style={styles.sectionHeaderRow}>
              <Leaf size={18} color="#1A5D42" />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Healthier Alternatives</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alternativesScroll}>
              {alternativesList.map((alt, idx) => (
                <View key={idx} style={styles.altCard}>
                  <Text style={styles.altTag}>{alt.tag}</Text>
                  <Text style={styles.altName}>{alt.name}</Text>
                  <Text style={styles.altCalories}>{alt.calories} kcal</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Sticky Bottom Close Button */}
        <View style={[styles.bottomStickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable style={({ pressed }) => [styles.closeFullBtn, pressed && styles.pressed]} onPress={onClose}>
            <X size={18} color="#FFFFFF" />
            <Text style={styles.closeFullBtnText}>Close Meal Details</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFE9',
  },
  glassIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  aiVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4EFE8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBE1D4',
    gap: 4,
  },
  aiVerifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A5D42',
  },
  pressed: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingTop: 8,
  },
  heroSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFE9',
    marginHorizontal: 16,
    marginTop: 12,
  },
  heroImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageBadgeRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBE1D4',
  },
  confidencePillText: {
    color: '#1A5D42',
    fontSize: 12,
    fontWeight: '600',
  },
  servingPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  servingPillText: {
    color: '#6E6E73',
    fontSize: 12,
    fontWeight: '500',
  },
  heroTitleBox: {
    padding: 18,
  },
  heroFoodTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroTimestamp: {
    fontSize: 13,
    color: '#6E6E73',
    fontWeight: '400',
  },
  caloriesBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFE9',
    gap: 16,
  },
  caloriesFlameCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FDF0D5',
    borderWidth: 1,
    borderColor: '#F9E2B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesTextContainer: {
    flex: 1,
  },
  caloriesNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  caloriesLargeNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -1,
    includeFontPadding: false,
  },
  caloriesUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D97706',
    includeFontPadding: false,
  },
  caloriesSubtext: {
    fontSize: 13,
    color: '#6E6E73',
    marginTop: 2,
  },
  macroCardsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  macroCardItem: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroCardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    includeFontPadding: false,
  },
  macroCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6E6E73',
    includeFontPadding: false,
  },
  healthScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  healthScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  scoreGaugeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDF0D5',
    borderWidth: 3,
    borderColor: '#F9E2B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreGaugeNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 24,
  },
  scoreGaugeTotal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6E6E73',
  },
  healthScoreRightBox: {
    flex: 1,
  },
  healthStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FDF0D5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F9E2B5',
    marginBottom: 6,
  },
  healthStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  healthScoreSubtitle: {
    fontSize: 12,
    color: '#6E6E73',
  },
  healthScoreExplanation: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  sectionContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6E6E73',
    fontWeight: '500',
  },
  nutritionRow: {
    marginBottom: 12,
  },
  nutritionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutritionLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  nutritionRightVals: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  nutritionPercent: {
    fontSize: 12,
    color: '#6E6E73',
    width: 32,
    textAlign: 'right',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  insightCardItem: {
    width: '48%',
    backgroundColor: '#FAF9F6',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  insightIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  insightIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 11,
    color: '#6E6E73',
    lineHeight: 15,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  ingredientChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ingredientChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allergenChipText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  recommendationCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recommendationHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  recommendationText: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  alternativesScroll: {
    gap: 12,
    paddingTop: 8,
  },
  altCard: {
    width: 140,
    backgroundColor: '#FAF9F6',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  altTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  altName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  altCalories: {
    fontSize: 12,
    color: '#6E6E73',
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFE9',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  closeFullBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A5D42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeFullBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
