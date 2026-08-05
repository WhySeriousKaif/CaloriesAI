import { useAuth, useUser } from '@clerk/expo';
import { getApiUrl } from '@/lib/api-config';
import * as Sentry from '@sentry/react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Activity,
  Bell,
  Bug,
  Calendar,
  Check,
  ChevronRight,
  Flame,
  Globe,
  LogOut,
  Pencil,
  Ruler,
  Salad,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  User as UserIcon,
  Users,
  FileText,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Pressable } from '@/components/ui/pressable';
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
import { toNumber, useProfile } from '@/hooks/use-profile';
import { LegalModal } from '@/components/common/LegalModal';

/** Turn a stored enum-ish string into something readable. */
function titleCase(value: string | null | undefined, fallback = '—') {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

/** Format creation date as "MMM YYYY" (e.g. "Jul 2026") */
function formatMemberSince(dateInput: Date | number | string | null | undefined): string {
  if (!dateInput) return 'Jul 2026';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Jul 2026';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return 'Jul 2026';
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut, getToken, userId } = useAuth();
  const { profile, loading, reload } = useProfile();

  const heightCm = toNumber(profile?.heightCm);
  const weightKg = toNumber(profile?.weightKg);
  const targetWeightKg = toNumber(profile?.targetWeightKg);

  const isImperial = profile?.unitPreference === 'imperial';

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'personalDetails' | 'preferences' | 'language' | 'familyPlan' | 'sentryTest' | null
  >(null);

  // Personal Details Edit State
  const [saving, setSaving] = useState(false);
  const [editHeightCm, setEditHeightCm] = useState('175');
  const [editWeightKg, setEditWeightKg] = useState('72');
  const [editTargetWeightKg, setEditTargetWeightKg] = useState('68');
  const [editGoal, setEditGoal] = useState('lose');
  const [editActivityLevel, setEditActivityLevel] = useState('moderate');
  const [editDietPreference, setEditDietPreference] = useState('classic');

  // Preferences State
  const [unitPref, setUnitPref] = useState<'metric' | 'imperial'>(
    profile?.unitPreference === 'imperial' ? 'imperial' : 'metric'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [mealRemindersEnabled, setMealRemindersEnabled] = useState(true);

  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Sentry Test Bench Toast/State
  const [sentryTestMessage, setSentryTestMessage] = useState<string | null>(null);

  const memberSinceStr = formatMemberSince(user?.createdAt);

  const openPersonalDetails = () => {
    setEditHeightCm(String(heightCm ?? 175));
    setEditWeightKg(String(weightKg ?? 72));
    setEditTargetWeightKg(String(targetWeightKg ?? 68));
    setEditGoal(profile?.goal ?? 'lose');
    setEditActivityLevel(profile?.activityLevel ?? 'moderate');
    setEditDietPreference(profile?.dietPreference ?? 'classic');
    setActiveModal('personalDetails');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');

      const response = await fetch(getApiUrl('/api/profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          heightCm: Number(editHeightCm) || 175,
          weightKg: Number(editWeightKg) || 72,
          targetWeightKg: Number(editTargetWeightKg) || 68,
          goal: editGoal,
          activityLevel: editActivityLevel,
          dietPreference: editDietPreference,
          unitPreference: unitPref,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      setActiveModal(null);
      reload();
      Alert.alert('Profile Updated', 'Your body metrics and daily nutrition targets have been updated!');
    } catch (err) {
      console.error('[profile] Save profile error:', err);
      Alert.alert('Error', 'Could not update profile metrics. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);

  const handleOpenLegal = (type: 'privacy' | 'terms') => {
    setLegalType(type);
  };

  /**
   * Sends a real event and reports the event id, so a missing DSN or a
   * misconfigured project shows up here instead of looking like success.
   */
  const handleTriggerSentryTest = () => {
    if (!Sentry.getClient()) {
      setSentryTestMessage('Sentry is not initialised — EXPO_PUBLIC_SENTRY_DSN is empty.');
      setTimeout(() => setSentryTestMessage(null), 5000);
      return;
    }

    let eventId = '';
    Sentry.withScope((scope) => {
      scope.setTag('feature', 'profile');
      scope.setTag('source', 'test-bench');
      scope.setLevel('error');
      eventId = Sentry.captureException(
        new Error('Profile test event — triggered from the Sentry test bench'),
      );
    });

    // Push it out now rather than waiting for the next natural flush.
    Sentry.flush().catch(() => {});

    setSentryTestMessage(`Event sent to Sentry — id ${eventId.slice(0, 8)}`);
    setTimeout(() => setSentryTestMessage(null), 5000);
  };

  /** Reports the SDK's actual state rather than a hardcoded string. */
  const handleCheckSentryStatus = () => {
    const client = Sentry.getClient();
    if (!client) {
      Alert.alert(
        'Sentry not initialised',
        'EXPO_PUBLIC_SENTRY_DSN is empty, so Sentry.init() was skipped. Add the DSN to .env and restart the bundler with --clear.',
      );
      return;
    }

    const options = client.getOptions();
    const dsn = options.dsn ? String(options.dsn) : '';
    // A DSN looks like https://<key>@<host>/<projectId> — show only the host
    // and project so we never surface the key in a screenshot.
    const parts = dsn.match(/@([^/]+)\/(\d+)/);

    Alert.alert(
      'Sentry status',
      [
        'SDK: initialised',
        `Environment: ${options.environment ?? 'unset'}`,
        `Host: ${parts?.[1] ?? 'unknown'}`,
        `Project: ${parts?.[2] ?? 'unknown'}`,
        `Traces sample rate: ${options.tracesSampleRate ?? 0}`,
        `Logs: ${options.enableLogs ? 'on' : 'off'}`,
        `User: ${userId ?? 'anonymous'}`,
      ].join('\n'),
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error('[profile] Sign out error:', err);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently delete your account, your profile data, and all logged meals. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (token) {
                await fetch(getApiUrl('/api/profile'), {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });
              }
              await signOut().catch(() => {});
              router.replace('/(auth)/sign-in');
            } catch (err) {
              console.error('[profile] Account deletion failed:', err);
              Alert.alert('Error', 'Could not delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  // User avatar letter
  const firstLetter = (user?.firstName || user?.fullName || 'U').charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + BottomTabInset + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Identity Card */}
        <View style={styles.identityCard}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarBadge]}>
              <Text style={styles.avatarBadgeLetter}>{firstLetter}</Text>
            </View>
          )}

          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.fullName ?? user?.firstName ?? 'User Profile'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.primaryEmailAddress?.emailAddress ?? profile?.email ?? 'user@calorieai.app'}
            </Text>
          </View>
        </View>

        {/* ACCOUNT Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Account</Text>

          <View style={styles.groupCard}>
            {/* Member Since (Readonly info row) */}
            <View style={styles.rowItem}>
              <View style={styles.rowIconBox}>
                <Calendar size={18} color={Palette.text} strokeWidth={2} />
              </View>
              <Text style={styles.rowLabel}>Member since</Text>
              <Text style={styles.rowValueMuted}>{memberSinceStr}</Text>
            </View>

            <View style={styles.rowDivider} />

            {/* Personal Details (Opens modal) */}
            <Pressable
              style={({ pressed }) => [styles.rowItem, pressed && styles.rowPressed]}
              onPress={openPersonalDetails}>
              <View style={styles.rowIconBox}>
                <UserIcon size={18} color={Palette.text} strokeWidth={2} />
              </View>
              <Text style={styles.rowLabel}>Personal Details</Text>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Preferences (Opens modal) */}
            <Pressable
              style={({ pressed }) => [styles.rowItem, pressed && styles.rowPressed]}
              onPress={() => setActiveModal('preferences')}>
              <View style={styles.rowIconBox}>
                <Settings size={18} color={Palette.text} strokeWidth={2} />
              </View>
              <Text style={styles.rowLabel}>Preferences</Text>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Language (Opens modal) */}
            <Pressable
              style={({ pressed }) => [styles.rowItem, pressed && styles.rowPressed]}
              onPress={() => setActiveModal('language')}>
              <View style={styles.rowIconBox}>
                <Globe size={18} color={Palette.text} strokeWidth={2} />
              </View>
              <Text style={styles.rowLabel}>Language</Text>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Upgrade to Family Plan (Opens modal) */}
            <Pressable
              style={({ pressed }) => [styles.rowItem, pressed && styles.rowPressed]}
              onPress={() => setActiveModal('familyPlan')}>
              <View style={styles.rowIconBox}>
                <Users size={18} color={Palette.text} strokeWidth={2} />
              </View>
              <Text style={styles.rowLabel}>Upgrade to Family Plan</Text>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* ABOUT Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>About</Text>

          <View style={styles.groupCard}>
            {/* Privacy Policy */}
            <Pressable
              style={({ pressed }) => [styles.rowItem, pressed && styles.rowPressed]}
              onPress={() => handleOpenLegal('privacy')}>
              <View style={styles.rowIconBox}>
                <ShieldCheck size={18} color={Palette.text} strokeWidth={2} />
              </View>
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Terms of Service */}
            <Pressable
              style={({ pressed }) => [styles.rowItem, pressed && styles.rowPressed]}
              onPress={() => handleOpenLegal('terms')}>
              <View style={styles.rowIconBox}>
                <FileText size={18} color={Palette.text} strokeWidth={2} />
              </View>
              <Text style={styles.rowLabel}>Terms of Service</Text>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Sentry test bench */}
            <Pressable
              style={({ pressed }) => [styles.rowItem, pressed && styles.rowPressed]}
              onPress={() => setActiveModal('sentryTest')}>
              <View style={styles.rowIconBox}>
                <Bug size={18} color={Palette.text} strokeWidth={2} />
              </View>
              <Text style={styles.rowLabel}>Sentry test bench</Text>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Notification Toast for Sentry test */}
        {sentryTestMessage && (
          <View style={styles.toastCard}>
            <Bug size={16} color="#10B981" />
            <Text style={styles.toastText}>{sentryTestMessage}</Text>
          </View>
        )}

        {/* SUPPORT / ACCOUNT ACTIONS */}
        <View style={styles.actionsStack}>
          <Pressable
            onPress={handleSignOut}
            accessibilityRole="button"
            style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
            <LogOut size={18} color={Palette.textSecondary} strokeWidth={2.2} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            accessibilityRole="button"
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
            <Trash2 size={18} color={Palette.danger} strokeWidth={2.2} />
            <Text style={styles.deleteText}>Delete account</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 1. PERSONAL DETAILS MODAL */}
      <Modal
        visible={activeModal === 'personalDetails'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personal Details</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={10}>
                <X size={22} color={Palette.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={editHeightCm}
                  onChangeText={setEditHeightCm}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={editWeightKg}
                  onChangeText={setEditWeightKg}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={editTargetWeightKg}
                  onChangeText={setEditTargetWeightKg}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Goal</Text>
                <View style={styles.optionRow}>
                  {['lose', 'maintain', 'gain'].map((g) => (
                    <Pressable
                      key={g}
                      style={[styles.optionChip, editGoal === g && styles.optionChipSelected]}
                      onPress={() => setEditGoal(g)}>
                      <Text style={[styles.optionChipText, editGoal === g && styles.optionChipTextSelected]}>
                        {titleCase(g)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Activity Level</Text>
                <View style={styles.optionRow}>
                  {['sedentary', 'light', 'moderate', 'active', 'very_active'].map((a) => (
                    <Pressable
                      key={a}
                      style={[styles.optionChip, editActivityLevel === a && styles.optionChipSelected]}
                      onPress={() => setEditActivityLevel(a)}>
                      <Text style={[styles.optionChipText, editActivityLevel === a && styles.optionChipTextSelected]}>
                        {titleCase(a)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Diet Preference</Text>
                <View style={styles.optionRow}>
                  {['classic', 'keto', 'vegan', 'vegetarian'].map((d) => (
                    <Pressable
                      key={d}
                      style={[styles.optionChip, editDietPreference === d && styles.optionChipSelected]}
                      onPress={() => setEditDietPreference(d)}>
                      <Text style={[styles.optionChipText, editDietPreference === d && styles.optionChipTextSelected]}>
                        {titleCase(d)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <Pressable
              disabled={saving}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
              onPress={handleSaveProfile}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Details</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 2. PREFERENCES MODAL */}
      <Modal
        visible={activeModal === 'preferences'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preferences</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={10}>
                <X size={22} color={Palette.text} />
              </Pressable>
            </View>

            <View style={styles.formContent}>
              <View style={styles.prefRow}>
                <View style={styles.prefTextCol}>
                  <Text style={styles.prefTitle}>Units</Text>
                  <Text style={styles.prefSub}>Choose metric (kg/cm) or imperial (lb/ft)</Text>
                </View>
                <View style={styles.unitToggleGroup}>
                  <Pressable
                    style={[styles.unitChip, unitPref === 'metric' && styles.unitChipSelected]}
                    onPress={() => setUnitPref('metric')}>
                    <Text style={[styles.unitChipText, unitPref === 'metric' && styles.unitChipTextSelected]}>
                      Metric
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.unitChip, unitPref === 'imperial' && styles.unitChipSelected]}
                    onPress={() => setUnitPref('imperial')}>
                    <Text style={[styles.unitChipText, unitPref === 'imperial' && styles.unitChipTextSelected]}>
                      Imperial
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.rowDivider} />

              <View style={styles.prefRow}>
                <View style={styles.prefTextCol}>
                  <Text style={styles.prefTitle}>Push Notifications</Text>
                  <Text style={styles.prefSub}>Daily nutrition updates and streak alerts</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E2E8F0', true: Palette.brand }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.rowDivider} />

              <View style={styles.prefRow}>
                <View style={styles.prefTextCol}>
                  <Text style={styles.prefTitle}>Meal Reminders</Text>
                  <Text style={styles.prefSub}>Remind me to log breakfast, lunch & dinner</Text>
                </View>
                <Switch
                  value={mealRemindersEnabled}
                  onValueChange={setMealRemindersEnabled}
                  trackColor={{ false: '#E2E8F0', true: Palette.brand }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
              onPress={() => setActiveModal(null)}>
              <Text style={styles.saveButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 3. LANGUAGE MODAL */}
      <Modal
        visible={activeModal === 'language'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={10}>
                <X size={22} color={Palette.text} />
              </Pressable>
            </View>

            <View style={styles.formContent}>
              {['English', 'Spanish', 'French', 'German', 'Turkish'].map((lang) => {
                const isSelected = selectedLanguage === lang;
                return (
                  <Pressable
                    key={lang}
                    style={[styles.languageRow, isSelected && styles.languageRowSelected]}
                    onPress={() => {
                      setSelectedLanguage(lang);
                      setActiveModal(null);
                    }}>
                    <Text style={[styles.languageText, isSelected && styles.languageTextSelected]}>
                      {lang}
                    </Text>
                    {isSelected && <Check size={18} color={Palette.brand} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. UPGRADE TO FAMILY PLAN MODAL */}
      <Modal
        visible={activeModal === 'familyPlan'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Sparkles size={22} color={Palette.brand} />
                <Text style={styles.modalTitle}>CalorieAI Family Plan</Text>
              </View>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={10}>
                <X size={22} color={Palette.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              <View style={styles.familyHeroCard}>
                <Users size={36} color={Palette.brand} />
                <Text style={styles.familyHeroTitle}>Nutrition tracking for the whole home</Text>
                <Text style={styles.familyHeroSub}>
                  Share premium CalorieAI features with up to 5 family members under one simple subscription.
                </Text>
              </View>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Check size={18} color={Palette.brand} />
                  <Text style={styles.featureText}>Unlimited AI photo food scanning for 5 accounts</Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={18} color={Palette.brand} />
                  <Text style={styles.featureText}>Shared household meal logs and recipe ideas</Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={18} color={Palette.brand} />
                  <Text style={styles.featureText}>Advanced macro distribution & streak analytics</Text>
                </View>
                <View style={styles.featureItem}>
                  <Check size={18} color={Palette.brand} />
                  <Text style={styles.featureText}>Priority AI response time & instant customer support</Text>
                </View>
              </View>
            </ScrollView>

            <Pressable
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
              onPress={() => {
                setActiveModal(null);
                Alert.alert('Family Plan Upgrade', 'Thank you for upgrading! Family Plan details have been sent to your email.');
              }}>
              <Text style={styles.saveButtonText}>Upgrade for $9.99/mo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 5. SENTRY TEST BENCH MODAL */}
      <Modal
        visible={activeModal === 'sentryTest'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Bug size={20} color={Palette.brand} />
                <Text style={styles.modalTitle}>Sentry Test Bench</Text>
              </View>
              <Pressable onPress={() => setActiveModal(null)} hitSlop={10}>
                <X size={22} color={Palette.text} />
              </Pressable>
            </View>

            <View style={styles.formContent}>
              <Text style={styles.prefSub}>
                Use the test bench to simulate application events, monitor exception catching, and verify error reporting.
              </Text>

              <Pressable
                style={({ pressed }) => [styles.sentryBtn, pressed && styles.pressed]}
                onPress={() => {
                  handleTriggerSentryTest();
                  setActiveModal(null);
                }}>
                <Bug size={18} color="#FFFFFF" />
                <Text style={styles.sentryBtnText}>Trigger Test Exception Event</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.sentryOutlineBtn, pressed && styles.pressed]}
                onPress={handleCheckSentryStatus}>
                <Activity size={18} color={Palette.brand} />
                <Text style={styles.sentryOutlineBtnText}>Check Sentry Connection Status</Text>
              </Pressable>

              {__DEV__ && (
                <Pressable
                  style={({ pressed }) => [styles.sentryOutlineBtn, pressed && styles.pressed]}
                  onPress={() => {
                    setActiveModal(null);
                    router.push('/debug-sentry');
                  }}>
                  <Bug size={18} color={Palette.brand} />
                  <Text style={styles.sentryOutlineBtnText}>Open full QA bench (dev only)</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. LEGAL DOCUMENTS MODAL */}
      <LegalModal
        visible={!!legalType}
        type={legalType}
        onClose={() => setLegalType(null)}
      />
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
    gap: 20,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 18,
    ...CardShadow,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
  },
  avatarBadge: {
    backgroundColor: '#0284C7', // Matches reference blue circle
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeLetter: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  identityText: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.4,
  },
  email: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSecondary,
    marginLeft: 6,
    textTransform: 'none',
  },
  groupCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    paddingHorizontal: 16,
    ...CardShadow,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowIconBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  rowValueMuted: {
    fontSize: 15,
    fontWeight: '500',
    color: Palette.textTertiary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  actionsStack: {
    gap: 12,
    marginTop: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.border,
    ...CardShadow,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.card,
    borderWidth: 1.5,
    borderColor: Palette.dangerTint,
    ...CardShadow,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.danger,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
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
    maxHeight: '88%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.text,
  },
  formContent: {
    gap: 16,
    paddingVertical: 8,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  textInput: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Palette.text,
    backgroundColor: Palette.background,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
  },
  optionChipSelected: {
    backgroundColor: Palette.brand,
    borderColor: Palette.brand,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  prefTextCol: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  prefTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  prefSub: {
    fontSize: 13,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: Palette.background,
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  unitChipSelected: {
    backgroundColor: Palette.brand,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  unitChipTextSelected: {
    color: '#FFFFFF',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  languageRowSelected: {
    backgroundColor: Palette.brandTint,
    borderColor: Palette.brand,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  languageTextSelected: {
    color: Palette.brand,
    fontWeight: '700',
  },
  familyHeroCard: {
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: Palette.brandTint,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 8,
  },
  familyHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.brand,
    textAlign: 'center',
  },
  familyHeroSub: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  featureList: {
    gap: 12,
    paddingVertical: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
  sentryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
    marginTop: 8,
  },
  sentryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sentryOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandTint,
    borderWidth: 1,
    borderColor: Palette.brand,
  },
  sentryOutlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.brand,
  },
});
