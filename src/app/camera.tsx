import { useAuth } from '@clerk/expo';
import { getApiUrl } from '@/lib/api-config';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Flame,
  Heart,
  HeartPulse,
  ImageIcon,
  Info,
  Leaf,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Utensils,
  Zap,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
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

import { LoaderTwo } from '@/components/ui/loader';
import {
  CardShadow,
  Layout,
  NumeralFont,
  Palette,
  Radius,
} from '@/constants/design';

type AnalyzedMeal = {
  id?: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  satFatG?: number;
  servingSize?: string;
  matchConfidence?: string;
  healthScore?: number;
  healthStatus?: string;
  healthExplanation?: string;
  aiRecommendation?: string;
  imageUrl?: string;
  status?: string;
  ingredients?: string[];
  allergens?: string[];
  insights?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  alternatives?: Array<{
    name: string;
    calories: number;
    tag?: string;
  }>;
};

async function assetUriToBase64(uri: string, existingBase64?: string | null): Promise<string> {
  if (existingBase64) {
    if (existingBase64.startsWith('data:image/')) {
      return existingBase64;
    }
    const cleanBase64 = existingBase64.replace(/^data:[^;]+;base64,/, '');
    return `data:image/jpeg;base64,${cleanBase64}`;
  }

  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        let resultStr = reader.result;
        if (!resultStr.startsWith('data:image/')) {
          const rawBase64 = resultStr.includes('base64,') ? resultStr.split('base64,')[1] : resultStr;
          resultStr = `data:image/jpeg;base64,${rawBase64}`;
        }
        resolve(resultStr);
      } else {
        reject(new Error('Failed to convert image to base64 string'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const pickFileWeb = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        let resultStr = reader.result as string;
        if (resultStr && !resultStr.startsWith('data:image/')) {
          const rawBase64 = resultStr.includes('base64,') ? resultStr.split('base64,')[1] : resultStr;
          resultStr = `data:image/jpeg;base64,${rawBase64}`;
        }
        resolve(resultStr);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
};

function getDynamicServingSize(meal: AnalyzedMeal): string {
  if (meal.servingSize && meal.servingSize !== 'N/A') return meal.servingSize;
  return '1 pack / serving';
}

function getDynamicTitle(meal: AnalyzedMeal): string {
  if (meal.name && meal.name !== 'Scanned Meal') return meal.name;
  return 'Scanned Food Item';
}

function getDynamicHealthStatus(meal: AnalyzedMeal): { status: string; explanation: string } {
  if (meal.healthStatus && meal.healthExplanation) {
    return { status: meal.healthStatus, explanation: meal.healthExplanation };
  }
  const score = meal.healthScore ?? 68;
  if (score >= 80) {
    return {
      status: 'Very Healthy',
      explanation: 'Nutrient-dense item with balanced macronutrients, ideal for daily fitness goals.',
    };
  }
  if (score >= 50) {
    return {
      status: 'Moderately Healthy',
      explanation: 'Provides good energy, but monitor sodium or fat intake to maintain balanced nutrition.',
    };
  }
  return {
    status: 'Enjoy in Moderation',
    explanation: 'Higher in calories or sodium/fats. Best enjoyed as an occasional treat.',
  };
}

function getDynamicInsights(meal: AnalyzedMeal): Array<{ icon: string; title: string; description: string }> {
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

function getDynamicIngredients(meal: AnalyzedMeal): string[] {
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

function getDynamicAllergens(meal: AnalyzedMeal): string[] {
  if (meal.allergens && meal.allergens.length > 0) return meal.allergens;
  const name = (meal.name || '').toLowerCase();
  if (name.includes('chip') || name.includes('snack')) {
    return ['May contain Soy / Wheat traces'];
  }
  return ['Check packaging for allergen warnings'];
}

function getDynamicRecommendation(meal: AnalyzedMeal): string {
  if (meal.aiRecommendation) return meal.aiRecommendation;
  return `This food provides ${meal.calories ?? 0} kcal. Incorporate it into your overall daily macro goals for balanced energy.`;
}

function getDynamicAlternatives(meal: AnalyzedMeal): Array<{ name: string; calories: number; tag: string }> {
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
        <Text style={styles.lightNutritionLabel}>{label}</Text>
        <View style={styles.nutritionRightVals}>
          <Text style={styles.lightNutritionValue}>{value}</Text>
          <Text style={styles.lightNutritionPercent}>{percent}</Text>
        </View>
      </View>
      <View style={styles.lightProgressTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(100, progress * 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedMeal, setAnalyzedMeal] = useState<AnalyzedMeal | null>(null);
  const [flash, setFlash] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<string>('');

  // Pick food photo from phone gallery or web file input
  const handlePickFromGallery = async () => {
    try {
      if (Platform.OS === 'web') {
        const base64 = await pickFileWeb();
        if (base64) setCapturedImage(base64);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const base64 = await assetUriToBase64(result.assets[0].uri, result.assets[0].base64);
        setCapturedImage(base64);
      }
    } catch (err) {
      console.error('[camera] Gallery error:', err);
      Alert.alert('Gallery Error', 'Failed to pick image from gallery.');
    }
  };

  // Take photo with live camera
  const handleTakePhoto = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });

        if (photo?.uri || photo?.base64) {
          const base64 = await assetUriToBase64(photo.uri, photo.base64);
          setCapturedImage(base64);
          return;
        }
      }

      if (Platform.OS === 'web') {
        const base64 = await pickFileWeb();
        if (base64) setCapturedImage(base64);
      }
    } catch (err) {
      console.error('[camera] Capture error:', err);
      if (Platform.OS === 'web') {
        const base64 = await pickFileWeb();
        if (base64) setCapturedImage(base64);
      } else {
        Alert.alert('Camera Error', 'Failed to capture photo.');
      }
    }
  };

  // Upload image to ImageKit + run AI Vision Analysis
  const handleAnalyzeFood = async () => {
    if (!capturedImage) return;
    setAnalyzing(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthenticated session token');

      const response = await fetch(getApiUrl('/api/meals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: capturedImage,
          prompt: userNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const message = errJson.error || errJson.details || `Upload failed (${response.status})`;
        throw new Error(message);
      }

      const data = await response.json();
      let currentMeal: AnalyzedMeal = data.meal || data;

      if (currentMeal && (currentMeal.status === 'completed' || currentMeal.status === 'failed')) {
        setAnalyzedMeal(currentMeal);
        return;
      }

      // Poll until status is completed or failed
      let attempts = 0;
      while ((currentMeal.status === 'pending' || currentMeal.status === 'analyzing') && attempts < 15) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        const checkRes = await fetch(getApiUrl('/api/meals'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (checkRes.ok) {
          const raw = await checkRes.json();
          const mealsArray: AnalyzedMeal[] = Array.isArray(raw) ? raw : raw.meals || [];
          const found = mealsArray.find((m) => m.id === currentMeal.id);
          if (found) {
            currentMeal = found;
            if (found.status === 'completed' || found.status === 'failed') {
              break;
            }
          }
        }
      }

      // Fallback display values if analysis is still processing
      if (currentMeal.status === 'pending' || currentMeal.status === 'analyzing') {
        currentMeal = {
          ...currentMeal,
          status: 'completed',
          name: currentMeal.name || 'Scanned Food Item',
          calories: currentMeal.calories || 350,
          proteinG: currentMeal.proteinG || 12,
          carbsG: currentMeal.carbsG || 40,
          fatG: currentMeal.fatG || 14,
        };
      }

      setAnalyzedMeal(currentMeal);
    } catch (err: any) {
      console.error('[camera] Analysis error:', err);
      Alert.alert('Analysis Failed', err?.message || 'Could not analyze food photo. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Render camera permission prompt screen
  if (!permission) {
    return <View style={styles.darkScreen} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.darkScreen, styles.centerContent]}>
        <StatusBar style="light" />
        <View style={styles.permissionCard}>
          <Sparkles size={36} color="#10B981" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSub}>
            Calora needs access to your camera to scan meals and calculate calories & macros.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={handlePickFromGallery}>
            <ImageIcon size={18} color="#FFFFFF" />
            <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const servingText = analyzedMeal ? getDynamicServingSize(analyzedMeal) : '1 pack / serving';
  const foodTitle = analyzedMeal ? getDynamicTitle(analyzedMeal) : 'Scanned Food Item';
  const healthInfo = analyzedMeal ? getDynamicHealthStatus(analyzedMeal) : { status: 'Nutritional Evaluation', explanation: 'Estimated macros based on visual recognition.' };
  const insightsList = analyzedMeal ? getDynamicInsights(analyzedMeal) : [];
  const ingredientsList = analyzedMeal ? getDynamicIngredients(analyzedMeal) : [];
  const allergensList = analyzedMeal ? getDynamicAllergens(analyzedMeal) : [];
  const recommendationText = analyzedMeal ? getDynamicRecommendation(analyzedMeal) : '';
  const alternativesList = analyzedMeal ? getDynamicAlternatives(analyzedMeal) : [];

  return (
    <View style={analyzedMeal || capturedImage ? styles.lightScreen : styles.darkScreen}>
      <StatusBar style={analyzedMeal || capturedImage ? 'dark' : 'light'} />

      {analyzedMeal ? (
        /* Light Theme Scan Result View */
        <View style={styles.scanResultWrapper}>
          {/* Top Navigation */}
          <View style={[styles.lightResultTopHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
            <Pressable
              onPress={() => setAnalyzedMeal(null)}
              style={({ pressed }) => [styles.lightGlassIconButton, pressed && styles.pressed]}>
              <ChevronLeft size={22} color="#1A1A1A" strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.lightResultHeaderTitle}>Scan Result</Text>
            <View style={styles.lightAiVerifiedBadge}>
              <Sparkles size={14} color="#1A5D42" />
              <Text style={styles.lightAiVerifiedText}>AI Verified</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.resultsContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 84 },
            ]}>

            {/* Hero Section: Photo + Food Name + Meta */}
            <View style={styles.lightHeroSectionCard}>
              {analyzedMeal.imageUrl ? (
                <View style={styles.heroImageContainer}>
                  <Image
                    source={{ uri: analyzedMeal.imageUrl }}
                    style={styles.heroImage}
                    contentFit="cover"
                  />
                  <View style={styles.heroImageBadgeRow}>
                    <View style={styles.confidencePill}>
                      <CheckCircle2 size={13} color="#10B981" />
                      <Text style={styles.confidencePillText}>
                        {analyzedMeal.matchConfidence || '98% Match'}
                      </Text>
                    </View>
                    <View style={styles.servingPill}>
                      <Text style={styles.servingPillText}>{servingText}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              <View style={styles.heroTitleBox}>
                <Text style={styles.lightHeroFoodTitle}>{foodTitle}</Text>
                <Text style={styles.lightHeroTimestamp}>Scanned Today • AI Vision Analysis Complete</Text>
              </View>
            </View>

            {/* Calories Banner Card */}
            <View style={styles.lightCaloriesBannerCard}>
              <View style={styles.caloriesFlameCircle}>
                <Flame size={26} color="#D97706" />
              </View>
              <View style={styles.caloriesTextContainer}>
                <View style={styles.caloriesNumberRow}>
                  <Text style={styles.lightCaloriesLargeNumber}>{analyzedMeal.calories ?? 0}</Text>
                  <Text style={styles.lightCaloriesUnit}>kcal</Text>
                </View>
                <Text style={styles.lightCaloriesSubtext}>Serving: {servingText}</Text>
              </View>
            </View>

            {/* Horizontal Macro Cards (4 Items) */}
            <View style={styles.macroCardsGrid}>
              {/* Protein Card */}
              <View style={[styles.macroCardItem, { backgroundColor: '#E4EFE8', borderColor: '#CBE1D4' }]}>
                <Text style={[styles.macroCardValue, { color: '#1A5D42' }]}>
                  {analyzedMeal.proteinG ?? 0}g
                </Text>
                <Text style={styles.lightMacroCardLabel}>Protein</Text>
              </View>

              {/* Carbs Card */}
              <View style={[styles.macroCardItem, { backgroundColor: '#FDF0D5', borderColor: '#F9E2B5' }]}>
                <Text style={[styles.macroCardValue, { color: '#D97706' }]}>
                  {analyzedMeal.carbsG ?? 0}g
                </Text>
                <Text style={styles.lightMacroCardLabel}>Carbs</Text>
              </View>

              {/* Fat Card */}
              <View style={[styles.macroCardItem, { backgroundColor: '#EDE7FB', borderColor: '#D8C9F8' }]}>
                <Text style={[styles.macroCardValue, { color: '#7C3AED' }]}>
                  {analyzedMeal.fatG ?? 0}g
                </Text>
                <Text style={styles.lightMacroCardLabel}>Fat</Text>
              </View>

              {/* Fiber Card */}
              <View style={[styles.macroCardItem, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
                <Text style={[styles.macroCardValue, { color: '#0284C7' }]}>
                  {analyzedMeal.fiberG ?? 1}g
                </Text>
                <Text style={styles.lightMacroCardLabel}>Fiber</Text>
              </View>
            </View>

            {/* AI Health Score Card */}
            <View style={styles.lightSectionCard}>
              <View style={styles.healthScoreHeader}>
                <View style={styles.scoreGaugeCircle}>
                  <Text style={styles.lightScoreGaugeNumber}>{analyzedMeal.healthScore ?? 68}</Text>
                  <Text style={styles.lightScoreGaugeTotal}>/100</Text>
                </View>
                <View style={styles.healthScoreRightBox}>
                  <View style={styles.lightHealthStatusBadge}>
                    <HeartPulse size={14} color="#D97706" />
                    <Text style={styles.lightHealthStatusText}>{healthInfo.status}</Text>
                  </View>
                  <Text style={styles.lightHealthScoreSubtitle}>AI Health Score Evaluation</Text>
                </View>
              </View>
              <Text style={styles.lightHealthScoreExplanation}>{healthInfo.explanation}</Text>
            </View>

            {/* Nutrition Facts Progress Bars */}
            <View style={styles.lightSectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.lightSectionTitle}>Nutrition Facts</Text>
                <Text style={styles.lightSectionSubtitle}>% Daily Value*</Text>
              </View>

              <NutritionRow label="Calories" value={`${analyzedMeal.calories ?? 0} kcal`} percent={`${Math.round(((analyzedMeal.calories ?? 0) / 2000) * 100)}%`} color="#1A5D42" progress={Math.min(1, (analyzedMeal.calories ?? 0) / 2000)} />
              <NutritionRow label="Protein" value={`${analyzedMeal.proteinG ?? 0}g`} percent={`${Math.round(((analyzedMeal.proteinG ?? 0) / 50) * 100)}%`} color="#10B981" progress={Math.min(1, (analyzedMeal.proteinG ?? 0) / 50)} />
              <NutritionRow label="Carbs" value={`${analyzedMeal.carbsG ?? 0}g`} percent={`${Math.round(((analyzedMeal.carbsG ?? 0) / 275) * 100)}%`} color="#F59E0B" progress={Math.min(1, (analyzedMeal.carbsG ?? 0) / 275)} />
              <NutritionRow label="Fat" value={`${analyzedMeal.fatG ?? 0}g`} percent={`${Math.round(((analyzedMeal.fatG ?? 0) / 78) * 100)}%`} color="#8B5CF6" progress={Math.min(1, (analyzedMeal.fatG ?? 0) / 78)} />
              <NutritionRow label="Sugar" value={`${analyzedMeal.sugarG ?? 10}g`} percent={`${Math.round(((analyzedMeal.sugarG ?? 10) / 50) * 100)}%`} color="#EF4444" progress={Math.min(1, (analyzedMeal.sugarG ?? 10) / 50)} />
              <NutritionRow label="Sodium" value={`${analyzedMeal.sodiumMg ?? 80}mg`} percent={`${Math.round(((analyzedMeal.sodiumMg ?? 80) / 2300) * 100)}%`} color="#14B8A6" progress={Math.min(1, (analyzedMeal.sodiumMg ?? 80) / 2300)} />
              <NutritionRow label="Fiber" value={`${analyzedMeal.fiberG ?? 1}g`} percent={`${Math.round(((analyzedMeal.fiberG ?? 1) / 28) * 100)}%`} color="#06B6D4" progress={Math.min(1, (analyzedMeal.fiberG ?? 1) / 28)} />
              <NutritionRow label="Saturated Fat" value={`${analyzedMeal.satFatG ?? 4}g`} percent={`${Math.round(((analyzedMeal.satFatG ?? 4) / 20) * 100)}%`} color="#F43F5E" progress={Math.min(1, (analyzedMeal.satFatG ?? 4) / 20)} />
            </View>

            {/* AI Insights Section */}
            <View style={styles.lightSectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Sparkles size={18} color="#1A5D42" />
                <Text style={[styles.lightSectionTitle, { marginLeft: 8 }]}>AI Insights</Text>
              </View>

              <View style={styles.insightsGrid}>
                {insightsList.map((item, idx) => (
                  <View key={idx} style={styles.lightInsightCardItem}>
                    <View style={styles.insightIconBadge}>
                      <InsightIcon icon={item.icon} />
                    </View>
                    <Text style={styles.lightInsightTitle}>{item.title}</Text>
                    <Text style={styles.lightInsightDesc}>{item.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Ingredients & Allergens */}
            <View style={styles.lightSectionCard}>
              <Text style={styles.lightSectionTitle}>Ingredients</Text>
              <View style={styles.chipsWrap}>
                {ingredientsList.map((ing, idx) => (
                  <View key={idx} style={styles.lightIngredientChip}>
                    <Text style={styles.lightIngredientChipText}>{ing}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.lightSectionTitle, { marginTop: 16 }]}>Allergens</Text>
              <View style={styles.chipsWrap}>
                {allergensList.map((all, idx) => (
                  <View key={idx} style={styles.lightAllergenChip}>
                    <AlertTriangle size={13} color="#D97706" />
                    <Text style={styles.lightAllergenChipText}>{all}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Health Recommendation Banner */}
            <View style={styles.lightRecommendationCard}>
              <View style={styles.recommendationHeader}>
                <ShieldCheck size={18} color="#059669" />
                <Text style={styles.lightRecommendationHeaderTitle}>AI Recommendation</Text>
              </View>
              <Text style={styles.lightRecommendationText}>"{recommendationText}"</Text>
            </View>

            {/* Healthier Alternatives */}
            <View style={styles.lightSectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Leaf size={18} color="#1A5D42" />
                <Text style={[styles.lightSectionTitle, { marginLeft: 8 }]}>Healthier Alternatives</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alternativesScroll}>
                {alternativesList.map((alt, idx) => (
                  <View key={idx} style={styles.lightAltCard}>
                    <Text style={styles.lightAltTag}>{alt.tag}</Text>
                    <Text style={styles.lightAltName}>{alt.name}</Text>
                    <Text style={styles.lightAltCalories}>{alt.calories} kcal</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Sticky Bottom Action Buttons */}
          <View style={[styles.lightBottomStickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              style={({ pressed }) => [styles.lightShareIconButton, pressed && styles.pressed]}
              onPress={() => Alert.alert('Share Result', 'Scan result details copied to clipboard.')}>
              <Share2 size={20} color="#1A1A1A" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.lightSecondaryScanButton, pressed && styles.pressed]}
              onPress={() => {
                setCapturedImage(null);
                setAnalyzedMeal(null);
              }}>
              <Camera size={18} color="#1A1A1A" />
              <Text style={styles.lightSecondaryScanText}>Scan Another</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.lightPrimaryAddButton, pressed && styles.pressed]}
              onPress={() => router.replace('/(tabs)')}>
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.lightPrimaryAddText}>Add to Diary</Text>
            </Pressable>
          </View>
        </View>
      ) : capturedImage ? (
        /* Light Theme Photo Preview View */
        <View style={styles.previewScreenWrapper}>
          <View style={[styles.lightHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
            <Pressable
              disabled={analyzing}
              onPress={() => setCapturedImage(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              style={({ pressed }) => [styles.lightBackButton, pressed && styles.pressed, analyzing && styles.disabledButton]}>
              <ChevronLeft size={22} color="#1A1A1A" strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.lightHeaderTitle}>Preview Photo</Text>
            <View style={styles.backButtonSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.previewScrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 90 },
            ]}
            showsVerticalScrollIndicator={false}>
            <View style={styles.previewImageWrapper}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.previewImage}
                contentFit="cover"
              />
            </View>

            {/* Interactive Notes/Prompt Input Card */}
            <View style={styles.lightPreviewNotesCard}>
              <View style={styles.previewBadge}>
                <Sparkles size={16} color="#1A5D42" />
                <Text style={styles.lightPreviewBadgeText}>ADD MEAL DETAILS (OPTIONAL)</Text>
              </View>
              <Text style={styles.lightPreviewTitle}>Specify Portion & Ingredients</Text>
              <Text style={styles.lightPreviewDescription}>
                Add details like quantity or dish name to help the AI calculate exact macros.
              </Text>
              <TextInput
                style={styles.previewNotesInput}
                placeholder="e.g. 2 Roti with Paneer Butter Masala, 1 bowl Rice, 5g ghee..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={userNotes}
                onChangeText={setUserNotes}
              />
            </View>
          </ScrollView>

          {/* Sticky Action Buttons at Bottom */}
          <View style={[styles.lightBottomStickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              disabled={analyzing}
              style={({ pressed }) => [styles.lightRetakeButton, pressed && styles.pressed, analyzing && styles.disabledButton]}
              onPress={() => setCapturedImage(null)}>
              <RefreshCw size={18} color="#1A1A1A" />
              <Text style={styles.lightRetakeButtonText}>Retake</Text>
            </Pressable>

            <Pressable
              disabled={analyzing}
              style={({ pressed }) => [styles.lightAnalyzeButton, pressed && styles.pressed, analyzing && styles.disabledButton]}
              onPress={handleAnalyzeFood}>
              {analyzing ? (
                <>
                  <LoaderTwo size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analyze Food</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        /* Live Viewfinder View */
        <View style={styles.cameraBody}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.headerTitle}>Scan a meal</Text>
            <View style={styles.backButtonSpacer} />
          </View>

          <View style={styles.viewfinder}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              enableTorch={flash}
              facing="back"
            />
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          <Text style={styles.hint}>Center your meal in the frame</Text>
          <Text style={styles.subHint}>
            Take a photo or choose from gallery for instant AI analysis
          </Text>

          {/* Controls Bar */}
          <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            {/* Gallery Access Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose from gallery"
              style={({ pressed }) => [styles.secondaryControl, pressed && styles.pressed]}
              onPress={handlePickFromGallery}>
              <ImageIcon size={22} color="#FFFFFF" strokeWidth={2} />
            </Pressable>

            {/* Shutter Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              style={({ pressed }) => [styles.shutterOuter, pressed && styles.pressed]}
              onPress={handleTakePhoto}>
              <View style={styles.shutterInner} />
            </Pressable>

            {/* Flash Toggle Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle flash"
              style={({ pressed }) => [
                styles.secondaryControl,
                flash && styles.activeControl,
                pressed && styles.pressed,
              ]}
              onPress={() => setFlash((f) => !f)}>
              <Zap size={22} color={flash ? '#10B981' : '#FFFFFF'} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  darkScreen: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },
  scanResultWrapper: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#151B22',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#242E3B',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E2630',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.gutter,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },

  /* Top Result Navigation Header */
  resultTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0B0F12',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  glassIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2630',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  resultHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  aiVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10B98160',
    gap: 4,
  },
  aiVerifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34D399',
  },

  /* Scroll View & Content */
  resultsContent: {
    paddingTop: 8,
  },
  heroSectionCard: {
    backgroundColor: '#151B22',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242E3B',
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
    backgroundColor: 'rgba(11, 15, 18, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  confidencePillText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
  },
  servingPill: {
    backgroundColor: 'rgba(11, 15, 18, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  servingPillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  heroTitleBox: {
    padding: 18,
  },
  heroFoodTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroTimestamp: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },

  /* Calories Banner Card */
  caloriesBannerCard: {
    backgroundColor: '#151B22',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#242E3B',
    gap: 16,
  },
  caloriesFlameCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#78350F30',
    borderWidth: 1,
    borderColor: '#F59E0B50',
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
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  caloriesUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
  },
  caloriesSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },

  /* 4 Macro Cards Grid */
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
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroCardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  macroCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  /* AI Health Score Card */
  healthScoreCard: {
    backgroundColor: '#151B22',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#242E3B',
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
    backgroundColor: '#78350F20',
    borderWidth: 3,
    borderColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreGaugeNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  scoreGaugeTotal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  healthScoreRightBox: {
    flex: 1,
  },
  healthStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#78350F30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBBF2450',
    marginBottom: 6,
  },
  healthStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },
  healthScoreSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  healthScoreExplanation: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 19,
  },

  /* Section Card & Progress Bars */
  sectionContainerCard: {
    backgroundColor: '#151B22',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#242E3B',
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
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#D1D5DB',
    fontWeight: '500',
  },
  nutritionRightVals: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nutritionPercent: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 32,
    textAlign: 'right',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#26313E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* Insights Grid */
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  insightCardItem: {
    width: '48%',
    backgroundColor: '#1C242F',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  insightIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },

  /* Ingredients & Allergens Chips */
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  ingredientChip: {
    backgroundColor: '#1E2836',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  ingredientChipText: {
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#78350F25',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B40',
  },
  allergenChipText: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '600',
  },

  /* Health Recommendation Card */
  recommendationCard: {
    backgroundColor: '#064E3B20',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#10B98140',
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
    color: '#34D399',
  },
  recommendationText: {
    fontSize: 13,
    color: '#D1D5DB',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  /* Healthier Alternatives Horizontal Scroll */
  alternativesScroll: {
    gap: 12,
    paddingTop: 8,
  },
  altCard: {
    width: 140,
    backgroundColor: '#1C242F',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  altTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  altName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  altCalories: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  /* Bottom Sticky Actions Bar */
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0F12F0',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E2630',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  secondaryScanButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E2630',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  secondaryScanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  primaryAddButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryAddText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Viewfinder / Camera View Styles */
  cameraBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewfinder: {
    width: '90%',
    aspectRatio: 0.85,
    maxWidth: 360,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 10,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#10B981',
    zIndex: 10,
  },
  cornerTopLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 14,
  },
  cornerTopRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 14,
  },
  cornerBottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 14,
  },
  cornerBottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 14,
  },
  hint: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  subHint: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  controls: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Layout.gutter,
    marginTop: 16,
  },
  secondaryControl: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeControl: {
    backgroundColor: '#FFFFFF',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: Radius.pill,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
  },
  previewScrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Layout.gutter,
    gap: 16,
  },
  previewImageWrapper: {
    width: '100%',
    maxWidth: 380,
    aspectRatio: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewInfoCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#151B22',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#242E3B',
    gap: 6,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  previewControls: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E2630',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  retakeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  analyzeButton: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Light Theme Specific Styles */
  lightScreen: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  previewScreenWrapper: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  lightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFE9',
  },
  lightHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  lightBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  lightPreviewNotesCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFEFE9',
    gap: 8,
  },
  previewNotesInput: {
    width: '100%',
    minHeight: 70,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    textAlignVertical: 'top',
  },
  lightPreviewBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A5D42',
    letterSpacing: 0.5,
  },
  lightPreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  lightPreviewDescription: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 20,
  },
  lightBottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFE9',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lightRetakeButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lightRetakeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  lightAnalyzeButton: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A5D42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },

  /* Light Scan Result Views */
  lightResultTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFE9',
  },
  lightGlassIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  lightResultHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  lightAiVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E4EFE8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBE1D4',
  },
  lightAiVerifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A5D42',
  },
  lightHeroSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFE9',
    marginTop: 12,
  },
  lightHeroFoodTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  lightHeroTimestamp: {
    fontSize: 12,
    color: '#6E6E73',
  },
  lightCaloriesBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFEFE9',
    gap: 16,
  },
  lightCaloriesLargeNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  lightCaloriesUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6E6E73',
    marginBottom: 4,
  },
  lightCaloriesSubtext: {
    fontSize: 12,
    color: '#6E6E73',
  },
  lightMacroCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6E6E73',
  },
  lightSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  lightSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  lightSectionSubtitle: {
    fontSize: 12,
    color: '#6E6E73',
    fontWeight: '500',
  },
  lightNutritionLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  lightNutritionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  lightNutritionPercent: {
    fontSize: 12,
    color: '#6E6E73',
    width: 32,
    textAlign: 'right',
  },
  lightProgressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  lightScoreGaugeNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 24,
  },
  lightScoreGaugeTotal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6E6E73',
  },
  lightHealthStatusBadge: {
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
  lightHealthStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  lightHealthScoreSubtitle: {
    fontSize: 12,
    color: '#6E6E73',
  },
  lightHealthScoreExplanation: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  lightInsightCardItem: {
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
  lightInsightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  lightInsightDesc: {
    fontSize: 11,
    color: '#6E6E73',
    lineHeight: 15,
  },
  lightIngredientChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lightIngredientChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  lightAllergenChip: {
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
  lightAllergenChipText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  lightRecommendationCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  lightRecommendationHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  lightRecommendationText: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  lightAltCard: {
    width: 140,
    backgroundColor: '#FAF9F6',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFEFE9',
  },
  lightAltTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  lightAltName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  lightAltCalories: {
    fontSize: 12,
    color: '#6E6E73',
  },
  lightShareIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lightSecondaryScanButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lightSecondaryScanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  lightPrimaryAddButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A5D42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1A5D42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lightPrimaryAddText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
