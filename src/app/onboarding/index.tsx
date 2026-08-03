import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Activity,
  Armchair,
  ArrowRight,
  Bell,
  Camera,
  Dumbbell,
  Egg,
  Flame,
  Footprints,
  Leaf,
  Scale,
  Sprout,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Utensils,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClipboardHeader } from '@/components/onboarding/illustrations/ClipboardHeader';
import { GoalHeader } from '@/components/onboarding/illustrations/GoalHeader';
import { HeightHeader } from '@/components/onboarding/illustrations/HeightHeader';
import { WeightHeader } from '@/components/onboarding/illustrations/WeightHeader';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { RulerPicker } from '@/components/onboarding/RulerPicker';
import {
  deviceTimezone,
  savePendingOnboarding,
} from '@/lib/onboarding-storage';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Current onboarding step (1 to 10)
  const [step, setStep] = useState(1);

  // Form State (matching PLAN.md specification)
  const [gender, setGender] = useState<'male' | 'female'>('male');

  // Height State
  const [heightCm, setHeightCm] = useState<number>(175);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

  // Weight State
  const [weightKg, setWeightKg] = useState<number>(72.0);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');

  // Goal Weight State
  const [goalWeightKg, setGoalWeightKg] = useState<number>(65.0);

  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('lose');
  const [activityLevel, setActivityLevel] = useState<
    'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
  >('moderate');

  const [dietPreference, setDietPreference] = useState<
    'classic' | 'keto' | 'vegetarian' | 'vegan'
  >('classic');

  // AI Plan Calculation State
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const loadingMessages = [
    'Analyzing your body metrics...',
    'Calculating BMR & daily expenditure...',
    'Optimizing protein & macro ratios...',
    'Finalizing your custom plan...',
  ];

  // Calculated Results
  const [calculatedPlan, setCalculatedPlan] = useState<{
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    bmi: number;
  }>({
    calories: 2200,
    proteinG: 165,
    carbsG: 220,
    fatG: 60,
    bmi: 23.5,
  });

  // Calculate BMI
  const heightM = heightCm / 100;
  const currentBmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  // Determine BMI Category
  const getBmiCategory = (bmiVal: number) => {
    if (bmiVal < 18.5) return { label: 'Underweight', status: 'Below normal range' };
    if (bmiVal < 25.0) return { label: 'Healthy', status: "You're in the normal range." };
    if (bmiVal < 30.0) return { label: 'Overweight', status: 'Above normal range' };
    return { label: 'Obese', status: 'Significantly above normal' };
  };

  // Dynamic Height Value & Ruler Bounds
  const displayHeightValue =
    heightUnit === 'ft'
      ? Number((heightCm / 30.48).toFixed(1))
      : Math.round(heightCm);

  const heightMin = heightUnit === 'ft' ? 4.0 : 120;
  const heightMax = heightUnit === 'ft' ? 7.5 : 230;
  const heightStep = heightUnit === 'ft' ? 0.1 : 1;

  const handleHeightChange = (val: number) => {
    if (heightUnit === 'ft') {
      const convertedCm = Math.round(val * 30.48);
      setHeightCm(convertedCm);
    } else {
      setHeightCm(val);
    }
  };

  const toggleHeightUnit = (targetUnit: 'cm' | 'ft') => {
    if (targetUnit !== heightUnit) {
      setHeightUnit(targetUnit);
    }
  };

  // Dynamic Weight Value & Ruler Bounds
  const displayWeightValue =
    weightUnit === 'lb'
      ? Number((weightKg * 2.20462).toFixed(1))
      : Number(weightKg.toFixed(1));

  const displayGoalWeightValue =
    weightUnit === 'lb'
      ? Number((goalWeightKg * 2.20462).toFixed(1))
      : Number(goalWeightKg.toFixed(1));

  const weightMin = weightUnit === 'lb' ? 88 : 40;
  const weightMax = weightUnit === 'lb' ? 400 : 180;
  const weightStep = weightUnit === 'lb' ? 0.5 : 0.5;

  const handleWeightChange = (val: number) => {
    if (weightUnit === 'lb') {
      const convertedKg = Number((val / 2.20462).toFixed(1));
      setWeightKg(convertedKg);
    } else {
      setWeightKg(val);
    }
  };

  const handleGoalWeightChange = (val: number) => {
    if (weightUnit === 'lb') {
      const convertedKg = Number((val / 2.20462).toFixed(1));
      setGoalWeightKg(convertedKg);
    } else {
      setGoalWeightKg(val);
    }
  };

  const toggleWeightUnit = (targetUnit: 'kg' | 'lb') => {
    if (targetUnit !== weightUnit) {
      setWeightUnit(targetUnit);
    }
  };

  // Weight Delta Calculation
  const weightDeltaKg = Number((goalWeightKg - weightKg).toFixed(1));
  const displayDelta =
    weightUnit === 'lb'
      ? Number((weightDeltaKg * 2.20462).toFixed(1))
      : weightDeltaKg;

  // Compute Daily Calorie & Macro Targets (Mifflin-St Jeor)
  const computePlanTargets = () => {
    const age = 26; // Standard age assumption
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    bmr += gender === 'male' ? 5 : -161;

    let activityMultiplier = 1.2;
    if (activityLevel === 'light') activityMultiplier = 1.375;
    if (activityLevel === 'moderate') activityMultiplier = 1.55;
    if (activityLevel === 'very') activityMultiplier = 1.725;
    if (activityLevel === 'extra') activityMultiplier = 1.9;

    let tdee = bmr * activityMultiplier;

    if (goal === 'lose') tdee -= 450;
    if (goal === 'gain') tdee += 400;

    const calories = Math.max(1200, Math.round(tdee));

    // Macro Ratios based on Diet Preference
    let proteinRatio = 0.3;
    let fatRatio = 0.25;
    let carbsRatio = 0.45;

    if (dietPreference === 'keto') {
      proteinRatio = 0.25;
      fatRatio = 0.7;
      carbsRatio = 0.05;
    } else if (dietPreference === 'vegetarian' || dietPreference === 'vegan') {
      proteinRatio = 0.25;
      fatRatio = 0.25;
      carbsRatio = 0.5;
    }

    const proteinG = Math.round((calories * proteinRatio) / 4);
    const carbsG = Math.round((calories * carbsRatio) / 4);
    const fatG = Math.round((calories * fatRatio) / 9);

    setCalculatedPlan({
      calories,
      proteinG,
      carbsG,
      fatG,
      bmi: currentBmi,
    });
  };

  // Step 8: Simulated Loading Progress Timer
  useEffect(() => {
    if (step === 8) {
      const timer = setTimeout(() => {
        computePlanTargets();
        setLoadingTextIndex(0);
      }, 0);

      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => {
          if (prev >= 3) {
            clearInterval(interval);
            setTimeout(() => setStep(9), 600);
            return prev;
          }
          return prev + 1;
        });
      }, 700);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [step, gender, heightCm, weightKg, goalWeightKg, goal, activityLevel, dietPreference]);

  const handleNext = () => {
    if (step < 10) {
      setStep((s) => s + 1);
    } else {
      // Park the answers before handing off to Clerk. The user has no account
      // yet, so there is nowhere to persist them server-side — `<ProfileSync />`
      // picks them up and POSTs them once a session exists.
      void savePendingOnboarding({
        gender,
        heightCm,
        weightKg,
        goal,
        targetWeightKg: goalWeightKg,
        activityLevel,
        dietPreference,
        unitPreference: heightUnit === 'cm' ? 'metric' : 'imperial',
        timezone: deviceTimezone(),
        dailyCalories: calculatedPlan.calories,
        proteinG: calculatedPlan.proteinG,
        carbsG: calculatedPlan.carbsG,
        fatG: calculatedPlan.fatG,
      });

      router.push({
        pathname: '/(auth)/sign-in',
        params: { intent: 'signup' },
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const currentBmiCategory = getBmiCategory(currentBmi);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Header Bar for Question Steps 1-7 */}
      {step <= 7 ? (
        <View style={{ paddingTop: insets.top }}>
          <OnboardingHeader
            currentStep={step}
            totalSteps={7}
            onBack={handleBack}
            showBack={step > 1}
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 16,
            paddingTop: step > 7 ? insets.top + 16 : 0,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* ================= STEP 1: GENDER ================= */}
        {step === 1 ? (
          <View style={styles.stepContainer}>
            <ClipboardHeader />

            <View style={styles.headerBox}>
              <Text style={styles.title}>{"Let's get to know you better"}</Text>
              <Text style={styles.subtitle}>
                This helps us personalize your experience and recommendations.
              </Text>
            </View>

            <View style={styles.optionsList}>
              <OptionCard
                title="Male"
                description="Recommended calorie calculations for men."
                iconNode={<User size={24} color={gender === 'male' ? '#073828' : '#4B5563'} />}
                selected={gender === 'male'}
                onSelect={() => setGender('male')}
              />
              <OptionCard
                title="Female"
                description="Recommended calorie calculations for women."
                iconNode={<UserCheck size={24} color={gender === 'female' ? '#073828' : '#4B5563'} />}
                selected={gender === 'female'}
                onSelect={() => setGender('female')}
              />
            </View>
          </View>
        ) : null}

        {/* ================= STEP 2: HEIGHT ================= */}
        {step === 2 ? (
          <View style={styles.stepContainer}>
            <HeightHeader />

            <View style={styles.headerBox}>
              <Text style={styles.title}>{"What's your height?"}</Text>
              <Text style={styles.subtitle}>
                This helps us calculate your daily calorie needs.
              </Text>
            </View>

            {/* Unit Toggle Pill */}
            <View style={styles.unitToggleRow}>
              <Pressable
                style={[styles.unitPill, heightUnit === 'cm' && styles.activeUnitPill]}
                onPress={() => toggleHeightUnit('cm')}>
                <Text
                  style={[
                    styles.unitPillText,
                    heightUnit === 'cm' && styles.activeUnitPillText,
                  ]}>
                  cm
                </Text>
              </Pressable>
              <Pressable
                style={[styles.unitPill, heightUnit === 'ft' && styles.activeUnitPill]}
                onPress={() => toggleHeightUnit('ft')}>
                <Text
                  style={[
                    styles.unitPillText,
                    heightUnit === 'ft' && styles.activeUnitPillText,
                  ]}>
                  ft
                </Text>
              </Pressable>
            </View>

            {/* Ruler Picker with synced values */}
            <RulerPicker
              value={displayHeightValue}
              onChange={handleHeightChange}
              min={heightMin}
              max={heightMax}
              step={heightStep}
              unit={heightUnit}
            />
          </View>
        ) : null}

        {/* ================= STEP 3: CURRENT WEIGHT ================= */}
        {step === 3 ? (
          <View style={styles.stepContainer}>
            <WeightHeader />

            <View style={styles.headerBox}>
              <Text style={styles.title}>{"What's your current weight?"}</Text>
              <Text style={styles.subtitle}>{"We'll use this as your starting point."}</Text>
            </View>

            {/* Unit Toggle Pill */}
            <View style={styles.unitToggleRow}>
              <Pressable
                style={[styles.unitPill, weightUnit === 'kg' && styles.activeUnitPill]}
                onPress={() => toggleWeightUnit('kg')}>
                <Text
                  style={[
                    styles.unitPillText,
                    weightUnit === 'kg' && styles.activeUnitPillText,
                  ]}>
                  kg
                </Text>
              </Pressable>
              <Pressable
                style={[styles.unitPill, weightUnit === 'lb' && styles.activeUnitPill]}
                onPress={() => toggleWeightUnit('lb')}>
                <Text
                  style={[
                    styles.unitPillText,
                    weightUnit === 'lb' && styles.activeUnitPillText,
                  ]}>
                  lb
                </Text>
              </Pressable>
            </View>

            {/* Ruler Picker with synced values */}
            <RulerPicker
              value={displayWeightValue}
              onChange={handleWeightChange}
              min={weightMin}
              max={weightMax}
              step={weightStep}
              unit={weightUnit}
            />

            {/* Live BMI Status Card */}
            <View style={styles.infoBoxCard}>
              <View style={styles.infoBoxHeader}>
                <View style={styles.bmiBadgeIcon}>
                  <Scale size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Your BMI</Text>
                  <View style={styles.bmiValueRow}>
                    <Text style={styles.infoValueText}>{currentBmi}</Text>
                    <View style={styles.bmiTag}>
                      <Text style={styles.bmiTagText}>{currentBmiCategory.label}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.infoSubText}>{currentBmiCategory.status}</Text>
            </View>
          </View>
        ) : null}

        {/* ================= STEP 4: GOAL WEIGHT ================= */}
        {step === 4 ? (
          <View style={styles.stepContainer}>
            <GoalHeader />

            <View style={styles.headerBox}>
              <Text style={styles.title}>{"What's your goal weight?"}</Text>
              <Text style={styles.subtitle}>Where would you like to be?</Text>
            </View>

            {/* Unit Toggle Pill */}
            <View style={styles.unitToggleRow}>
              <Pressable
                style={[styles.unitPill, weightUnit === 'kg' && styles.activeUnitPill]}
                onPress={() => toggleWeightUnit('kg')}>
                <Text
                  style={[
                    styles.unitPillText,
                    weightUnit === 'kg' && styles.activeUnitPillText,
                  ]}>
                  kg
                </Text>
              </Pressable>
              <Pressable
                style={[styles.unitPill, weightUnit === 'lb' && styles.activeUnitPill]}
                onPress={() => toggleWeightUnit('lb')}>
                <Text
                  style={[
                    styles.unitPillText,
                    weightUnit === 'lb' && styles.activeUnitPillText,
                  ]}>
                  lb
                </Text>
              </Pressable>
            </View>

            {/* Ruler Picker with synced values */}
            <RulerPicker
              value={displayGoalWeightValue}
              onChange={handleGoalWeightChange}
              min={weightMin}
              max={weightMax}
              step={weightStep}
              unit={weightUnit}
            />

            {/* Goal Weight Delta Summary Card */}
            <View style={styles.infoBoxCard}>
              <View style={styles.deltaRow}>
                <View style={styles.deltaCol}>
                  <Text style={styles.deltaLabel}>Current</Text>
                  <Text style={styles.deltaVal}>
                    {displayWeightValue} {weightUnit}
                  </Text>
                </View>
                <ArrowRight size={18} color="#073828" strokeWidth={2.5} />
                <View style={styles.deltaCol}>
                  <Text style={styles.deltaLabel}>Goal</Text>
                  <Text style={styles.deltaVal}>
                    {displayGoalWeightValue} {weightUnit}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.estimatedRow}>
                <Text style={styles.estimatedLabel}>Estimated change</Text>
                <Text
                  style={[
                    styles.estimatedVal,
                    displayDelta < 0
                      ? styles.lossText
                      : displayDelta > 0
                      ? styles.gainText
                      : styles.neutralText,
                  ]}>
                  {displayDelta > 0 ? `+${displayDelta}` : displayDelta} {weightUnit}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ================= STEP 5: MAIN GOAL ================= */}
        {step === 5 ? (
          <View style={styles.stepContainer}>
            <View style={styles.headerBox}>
              <Text style={styles.title}>{"What's your main goal?"}</Text>
              <Text style={styles.subtitle}>This helps us create the right plan for you.</Text>
            </View>

            <View style={styles.optionsList}>
              <OptionCard
                title="Lose Weight"
                description="Burn fat and lose weight in a healthy way."
                iconNode={<TrendingDown size={22} color={goal === 'lose' ? '#073828' : '#4B5563'} />}
                selected={goal === 'lose'}
                onSelect={() => setGoal('lose')}
              />
              <OptionCard
                title="Maintain Weight"
                description="Stay healthy and maintain your current weight."
                iconNode={<Scale size={22} color={goal === 'maintain' ? '#073828' : '#4B5563'} />}
                selected={goal === 'maintain'}
                onSelect={() => setGoal('maintain')}
              />
              <OptionCard
                title="Gain Weight"
                description="Build healthy mass and gain weight."
                iconNode={<TrendingUp size={22} color={goal === 'gain' ? '#073828' : '#4B5563'} />}
                selected={goal === 'gain'}
                onSelect={() => setGoal('gain')}
              />
            </View>
          </View>
        ) : null}

        {/* ================= STEP 6: ACTIVITY LEVEL ================= */}
        {step === 6 ? (
          <View style={styles.stepContainer}>
            <View style={styles.headerBox}>
              <Text style={styles.title}>How active are you during the day?</Text>
              <Text style={styles.subtitle}>
                This helps us estimate your daily calorie needs.
              </Text>
            </View>

            <View style={styles.optionsList}>
              <OptionCard
                title="Sedentary"
                description="Little or no exercise"
                iconNode={<Armchair size={22} color={activityLevel === 'sedentary' ? '#073828' : '#4B5563'} />}
                selected={activityLevel === 'sedentary'}
                onSelect={() => setActivityLevel('sedentary')}
              />
              <OptionCard
                title="Lightly active"
                description="1-3 days per week"
                iconNode={<Footprints size={22} color={activityLevel === 'light' ? '#073828' : '#4B5563'} />}
                selected={activityLevel === 'light'}
                onSelect={() => setActivityLevel('light')}
              />
              <OptionCard
                title="Moderately active"
                description="3-5 days per week"
                iconNode={<Dumbbell size={22} color={activityLevel === 'moderate' ? '#073828' : '#4B5563'} />}
                selected={activityLevel === 'moderate'}
                onSelect={() => setActivityLevel('moderate')}
              />
              <OptionCard
                title="Very active"
                description="6-7 days per week"
                iconNode={<Activity size={22} color={activityLevel === 'very' ? '#073828' : '#4B5563'} />}
                selected={activityLevel === 'very'}
                onSelect={() => setActivityLevel('very')}
              />
              <OptionCard
                title="Extra active"
                description="Very intense daily activity or physical job"
                iconNode={<Flame size={22} color={activityLevel === 'extra' ? '#073828' : '#4B5563'} />}
                selected={activityLevel === 'extra'}
                onSelect={() => setActivityLevel('extra')}
              />
            </View>
          </View>
        ) : null}

        {/* ================= STEP 7: DIET PREFERENCE ================= */}
        {step === 7 ? (
          <View style={styles.stepContainer}>
            <View style={styles.headerBox}>
              <Text style={styles.title}>{"What's your diet preference?"}</Text>
              <Text style={styles.subtitle}>{"We'll build your plan around your eating style."}</Text>
            </View>

            <View style={styles.optionsList}>
              <OptionCard
                title="Classic"
                description="Balanced macros with all food groups"
                iconNode={<Utensils size={22} color={dietPreference === 'classic' ? '#073828' : '#4B5563'} />}
                selected={dietPreference === 'classic'}
                onSelect={() => setDietPreference('classic')}
              />
              <OptionCard
                title="Keto"
                description="Low carb, high fat diet"
                iconNode={<Leaf size={22} color={dietPreference === 'keto' ? '#073828' : '#4B5563'} />}
                selected={dietPreference === 'keto'}
                onSelect={() => setDietPreference('keto')}
              />
              <OptionCard
                title="Vegetarian"
                description="Plant-based with dairy & eggs"
                iconNode={<Egg size={22} color={dietPreference === 'vegetarian' ? '#073828' : '#4B5563'} />}
                selected={dietPreference === 'vegetarian'}
                onSelect={() => setDietPreference('vegetarian')}
              />
              <OptionCard
                title="Vegan"
                description="Strictly plant-based diet"
                iconNode={<Sprout size={22} color={dietPreference === 'vegan' ? '#073828' : '#4B5563'} />}
                selected={dietPreference === 'vegan'}
                onSelect={() => setDietPreference('vegan')}
              />
            </View>
          </View>
        ) : null}

        {/* ================= STEP 8: BUILDING YOUR PLAN ================= */}
        {step === 8 ? (
          <View style={styles.loadingContainer}>
            <View style={styles.spinnerCard}>
              <ActivityIndicator size="large" color="#073828" />
              <Text style={styles.buildingTitle}>Building your plan...</Text>
              <Text style={styles.loadingMessage}>{loadingMessages[loadingTextIndex]}</Text>
            </View>
          </View>
        ) : null}

        {/* ================= STEP 9: PLAN REVEAL ================= */}
        {step === 9 ? (
          <View style={styles.stepContainer}>
            <View style={styles.headerBox}>
              <GoalHeader />
              <Text style={styles.title}>Your daily calorie target</Text>
              <Text style={styles.subtitle}>
                {"Based on your info, here's your personalized target to reach your goal."}
              </Text>
            </View>

            {/* Big Calorie Display */}
            <View style={styles.calorieTargetCard}>
              <Text style={styles.calorieValueText}>
                {calculatedPlan.calories.toLocaleString()}
              </Text>
              <Text style={styles.calorieLabelText}>Calories / day</Text>

              {/* Macro Distribution Cards */}
              <View style={styles.macroRow}>
                <View style={styles.macroCard}>
                  <Text style={styles.macroEmoji}>🍗</Text>
                  <Text style={styles.macroVal}>{calculatedPlan.proteinG}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroEmoji}>🌾</Text>
                  <Text style={styles.macroVal}>{calculatedPlan.carbsG}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroEmoji}>🥑</Text>
                  <Text style={styles.macroVal}>{calculatedPlan.fatG}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
            </View>

            {/* Insight Banner */}
            <View style={styles.insightCard}>
              <Text style={styles.insightSparkle}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>This is just the beginning!</Text>
                <Text style={styles.insightSub}>
                  Unlock your personalized plan, AI insights and advanced tracking.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ================= STEP 10: PLAN PREVIEW / FEATURES ================= */}
        {step === 10 ? (
          <View style={styles.stepContainer}>
            <View style={styles.headerBox}>
              <Text style={styles.title}>{"Here's what your plan includes"}</Text>
              <Text style={styles.subtitle}>
                Your personalized plan to help you reach {displayGoalWeightValue} {weightUnit}.
              </Text>
            </View>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <Target size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Calorie Tracking</Text>
                  <Text style={styles.featureSub}>Track effortlessly and stay on target</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <Camera size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>AI Food Scanner</Text>
                  <Text style={styles.featureSub}>Scan meals and get instant nutrition</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <TrendingUp size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Progress Tracking</Text>
                  <Text style={styles.featureSub}>Monitor your progress and stay motivated</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconBox}>
                  <Bell size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Smart Reminders</Text>
                  <Text style={styles.featureSub}>Daily reminders to keep you consistent</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Bottom Action Button (Steps 1-7 & 9-10) */}
        {step !== 8 ? (
          <View style={styles.bottomActionBox}>
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
              onPress={handleNext}
              accessibilityRole="button">
              <Text style={styles.ctaText}>
                {step === 10 ? 'Get Started' : 'Continue'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  headerBox: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A3527',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151', // Dark high-contrast readable gray
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsList: {
    width: '100%',
  },
  unitToggleRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  unitPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeUnitPill: {
    backgroundColor: '#073828',
  },
  unitPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  activeUnitPillText: {
    color: '#FFFFFF',
  },
  infoBoxCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 18,
    marginTop: 12,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bmiBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  infoValueText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#073828',
  },
  bmiTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bmiTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  infoSubText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
    marginTop: 8,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  deltaCol: {
    alignItems: 'center',
  },
  deltaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  deltaVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#073828',
    marginTop: 2,
  },
  deltaArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#DCFCE7',
    marginVertical: 12,
  },
  estimatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimatedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  estimatedVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  lossText: {
    color: '#059669',
  },
  gainText: {
    color: '#D97706',
  },
  neutralText: {
    color: '#073828',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  spinnerCard: {
    alignItems: 'center',
    padding: 32,
  },
  buildingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A3527',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  calorieTargetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieValueText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#073828',
    letterSpacing: -1,
  },
  calorieLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
    marginBottom: 20,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  macroEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#073828',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 16,
    gap: 12,
  },
  insightSparkle: {
    fontSize: 22,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073828',
  },
  insightSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#047857',
    marginTop: 2,
  },
  featuresList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3527',
  },
  featureSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 2,
  },
  bottomActionBox: {
    marginTop: 24,
    width: '100%',
  },
  ctaButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#073828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#073828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
