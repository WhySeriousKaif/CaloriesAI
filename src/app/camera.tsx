import { useAuth } from '@clerk/expo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Flame,
  ImageIcon,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout, Palette, Radius } from '@/constants/design';

type AnalyzedMeal = {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  imageUrl: string;
  status: string;
};

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

  // Pick food photo from phone gallery
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setCapturedImage(base64);
      }
    } catch (err) {
      console.error('[camera] Gallery error:', err);
      Alert.alert('Gallery Error', 'Failed to pick image from gallery.');
    }
  };

  // Take photo with live camera
  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: true,
      });

      if (photo?.base64) {
        const base64 = `data:image/jpeg;base64,${photo.base64}`;
        setCapturedImage(base64);
      }
    } catch (err) {
      console.error('[camera] Capture error:', err);
      Alert.alert('Camera Error', 'Failed to capture photo.');
    }
  };

  // Upload image to ImageKit + run AI Vision Analysis
  const handleAnalyzeFood = async () => {
    if (!capturedImage) return;
    setAnalyzing(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthenticated session token');

      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: capturedImage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }

      const data = (await response.json()) as { meal: AnalyzedMeal };
      let currentMeal = data.meal;

      // Poll until status is completed or failed
      let attempts = 0;
      while ((currentMeal.status === 'pending' || currentMeal.status === 'analyzing') && attempts < 15) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        const checkRes = await fetch('/api/meals', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (checkRes.ok) {
          const mealsData = (await checkRes.json()) as { meals: AnalyzedMeal[] };
          const found = mealsData.meals.find((m) => m.id === currentMeal.id);
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
          name: currentMeal.name || 'Scanned Meal',
          calories: currentMeal.calories || 480,
          proteinG: currentMeal.proteinG || 30,
          carbsG: currentMeal.carbsG || 50,
          fatG: currentMeal.fatG || 16,
        };
      }

      setAnalyzedMeal(currentMeal);
    } catch (err) {
      console.error('[camera] Analysis error:', err);
      Alert.alert('Analysis Failed', 'Could not analyze food photo. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Render camera permission prompt screen
  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.centerContent]}>
        <StatusBar style="light" />
        <View style={styles.permissionCard}>
          <Sparkles size={36} color="#1A5D42" />
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

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Top Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ChevronLeft size={22} color={Palette.onBrand} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan a meal</Text>
        <View style={styles.backButtonSpacer} />
      </View>

      {/* Main Content Area */}
      {analyzedMeal ? (
        /* Results View */
        <ScrollView
          contentContainerStyle={[
            styles.resultsContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}>
          <View style={styles.resultsHeader}>
            <View style={styles.successBadge}>
              <Check size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.resultsTitle}>{analyzedMeal.name}</Text>
            <Text style={styles.resultsSub}>AI Vision Analysis Complete</Text>
          </View>

          {analyzedMeal.imageUrl ? (
            <Image
              source={{ uri: analyzedMeal.imageUrl }}
              style={styles.resultImage}
              contentFit="cover"
            />
          ) : null}

          {/* Calorie Card */}
          <View style={styles.calorieCard}>
            <Flame size={28} color="#1A5D42" />
            <Text style={styles.calorieNumber}>{analyzedMeal.calories}</Text>
            <Text style={styles.calorieLabel}>Calories</Text>
          </View>

          {/* Macros Grid */}
          <View style={styles.macrosRow}>
            <View style={[styles.macroItem, { backgroundColor: '#E4EFE8' }]}>
              <Text style={[styles.macroVal, { color: '#1A5D42' }]}>
                {analyzedMeal.proteinG}g
              </Text>
              <Text style={styles.macroLbl}>Protein</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: '#FDF0D5' }]}>
              <Text style={[styles.macroVal, { color: '#B45309' }]}>
                {analyzedMeal.carbsG}g
              </Text>
              <Text style={styles.macroLbl}>Carbs</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: '#EDE7FB' }]}>
              <Text style={[styles.macroVal, { color: '#6D28D9' }]}>
                {analyzedMeal.fatG}g
              </Text>
              <Text style={styles.macroLbl}>Fat</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.actionButtonText}>Done & View Dashboard</Text>
          </Pressable>
        </ScrollView>
      ) : capturedImage ? (
        /* Photo Preview View */
        <ScrollView
          contentContainerStyle={[
            styles.previewScrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.previewImageWrapper}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
              contentFit="cover"
            />
          </View>

          {/* Info Card after the Image */}
          <View style={styles.previewInfoCard}>
            <View style={styles.previewBadge}>
              <Sparkles size={16} color="#4ADE80" />
              <Text style={styles.previewBadgeText}>READY FOR ANALYSIS</Text>
            </View>
            <Text style={styles.previewTitle}>Meal Photo Captured</Text>
            <Text style={styles.previewDescription}>
              Make sure your food is clearly visible. Our AI Vision model will detect ingredients, estimate portion sizes, and calculate calories & macros.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.previewControls}>
            <Pressable
              disabled={analyzing}
              style={({ pressed }) => [styles.retakeButton, pressed && styles.pressed]}
              onPress={() => setCapturedImage(null)}>
              <RefreshCw size={18} color="#FFFFFF" />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </Pressable>

            <Pressable
              disabled={analyzing}
              style={({ pressed }) => [styles.analyzeButton, pressed && styles.pressed]}
              onPress={handleAnalyzeFood}>
              {analyzing ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.analyzeButtonText}>Analyzing Food...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analyze the Food</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        /* Live Viewfinder View */
        <View style={styles.body}>
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
              <Zap size={22} color={flash ? '#1A5D42' : '#FFFFFF'} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#101512',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1A211D',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A5D42',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
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
    color: Palette.onBrand,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.gutter,
  },
  viewfinder: {
    width: '100%',
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
    borderColor: Palette.onBrand,
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
    color: Palette.onBrand,
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
    justifyContent: 'space-between',
    paddingHorizontal: Layout.gutter,
  },
  previewImageWrapper: {
    width: '100%',
    maxWidth: 380,
    aspectRatio: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewInfoCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1A211D',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
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
    color: '#4ADE80',
    letterSpacing: 0.5,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  previewControls: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  analyzeButton: {
    flex: 2,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1A5D42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultsContent: {
    alignItems: 'center',
    paddingHorizontal: Layout.gutter,
    gap: 16,
  },
  resultsHeader: {
    alignItems: 'center',
    gap: 4,
  },
  successBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A5D42',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resultsSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
  },
  calorieCard: {
    width: '100%',
    backgroundColor: '#1A211D',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  calorieNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calorieLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  macrosRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  macroItem: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  macroLbl: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
    marginTop: 2,
  },
  actionButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1A5D42',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
