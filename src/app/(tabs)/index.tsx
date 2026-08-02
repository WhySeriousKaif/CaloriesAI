import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, Flame, Plus, Target, Utensils } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <Logo variant="lockup" height={38} />
          <Pressable
            style={({ pressed }) => [styles.scanHeaderButton, pressed && styles.pressed]}
            onPress={() => router.push('/onboarding')}>
            <Camera size={18} color="#FFFFFF" />
            <Text style={styles.scanHeaderText}>Scan Food</Text>
          </Pressable>
        </View>

        {/* Daily Summary Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroTitle}>Today's Summary</Text>
              <Text style={styles.heroSubtitle}>Goal: 2,200 kcal</Text>
            </View>
            <View style={styles.flameBadge}>
              <Flame size={18} color="#EF4444" />
              <Text style={styles.flameText}>1,450 eaten</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: '66%' }]} />
          </View>
          <Text style={styles.remainingText}>750 kcal remaining</Text>

          {/* Macro Pills */}
          <View style={styles.macroRow}>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>110 / 165g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>145 / 220g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>42 / 60g</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            onPress={() => router.push('/onboarding')}>
            <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Camera size={24} color="#059669" />
            </View>
            <Text style={styles.actionTitle}>AI Food Scan</Text>
            <Text style={styles.actionSub}>Identify meal & macros instantly</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            onPress={() => router.push('/onboarding')}>
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Utensils size={24} color="#D97706" />
            </View>
            <Text style={styles.actionTitle}>Log Manual Meal</Text>
            <Text style={styles.actionSub}>Add items from database</Text>
          </Pressable>
        </View>

        {/* Food Camera Mockup Section */}
        <View style={styles.cameraBanner}>
          <Image
            source={require('@/assets/images/healthy-meal-camera.png')}
            style={styles.bannerImage}
            contentFit="cover"
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerTag}>
              <Target size={14} color="#073828" />
              <Text style={styles.bannerTagText}>Smart Vision</Text>
            </View>
            <Text style={styles.bannerTitle}>Instant Nutrition Analysis</Text>
            <Text style={styles.bannerSub}>Point your camera at any meal to track calories</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 10,
  },
  scanHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#073828',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  scanHeaderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  heroCard: {
    backgroundColor: '#073828',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  flameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  flameText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  remainingText: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  macroLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  macroValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3527',
    marginBottom: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A3527',
  },
  actionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cameraBanner: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginBottom: 6,
  },
  bannerTagText: {
    color: '#073828',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bannerSub: {
    color: '#E5E7EB',
    fontSize: 12,
    marginTop: 2,
  },
});
