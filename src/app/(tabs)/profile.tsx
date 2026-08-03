import { useAuth, useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Activity,
  ChevronRight,
  Flame,
  LogOut,
  Pencil,
  Ruler,
  Salad,
  Scale,
  Target,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { toNumber, useProfile } from '@/hooks/use-profile';

/** Turn a stored enum-ish string into something readable. */
function titleCase(value: string | null | undefined, fallback = '—') {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut, getToken } = useAuth();
  const { profile, loading, reload } = useProfile();

  const heightCm = toNumber(profile?.heightCm);
  const weightKg = toNumber(profile?.weightKg);
  const targetWeightKg = toNumber(profile?.targetWeightKg);

  const isImperial = profile?.unitPreference === 'imperial';

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editHeightCm, setEditHeightCm] = useState('175');
  const [editWeightKg, setEditWeightKg] = useState('72');
  const [editTargetWeightKg, setEditTargetWeightKg] = useState('68');
  const [editGoal, setEditGoal] = useState('lose');
  const [editActivityLevel, setEditActivityLevel] = useState('moderate');
  const [editDietPreference, setEditDietPreference] = useState('classic');

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');

      const response = await fetch('/api/profile', {
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
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      setIsEditing(false);
      reload();
      Alert.alert('Profile Updated', 'Your body metrics and daily nutrition targets have been updated!');
    } catch (err) {
      console.error('[profile] Save profile error:', err);
      Alert.alert('Error', 'Could not update profile metrics. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const height = heightCm
    ? isImperial
      ? `${Math.floor(heightCm / 30.48)}' ${Math.round((heightCm / 2.54) % 12)}"`
      : `${Math.round(heightCm)} cm`
    : '—';

  const formatWeight = (kg: number | null) =>
    kg ? (isImperial ? `${Math.round(kg * 2.20462)} lb` : `${kg} kg`) : '—';

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
                await fetch('/api/profile', {
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
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Identity */}
        <View style={styles.identityCard}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <UserIcon size={26} color={Palette.brand} strokeWidth={2} />
            </View>
          )}

          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.fullName ?? user?.firstName ?? 'Your account'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.primaryEmailAddress?.emailAddress ?? profile?.email ?? '—'}
            </Text>
          </View>
        </View>

        {/* Daily targets */}
        <Text style={styles.sectionTitle}>Daily targets</Text>
        <View style={styles.targetsCard}>
          <View style={styles.calorieRow}>
            <View style={styles.calorieIcon}>
              <Flame size={18} color={Palette.brand} strokeWidth={2.2} fill={Palette.brand} />
            </View>
            <Text style={styles.calorieLabel}>Calories</Text>
            <Text style={styles.calorieValue}>
              {profile?.dailyCalories ? `${profile.dailyCalories.toLocaleString()} kcal` : '—'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.macroGrid}>
            <TargetPill label={Macro.protein.label} value={profile?.proteinG} color={Macro.protein.color} tint={Macro.protein.tint} />
            <TargetPill label={Macro.carbs.label} value={profile?.carbsG} color={Macro.carbs.color} tint={Macro.carbs.tint} />
            <TargetPill label={Macro.fat.label} value={profile?.fatG} color={Macro.fat.color} tint={Macro.fat.tint} />
          </View>

          {profile?.planRationale ? (
            <Text style={styles.rationale}>{profile.planRationale}</Text>
          ) : null}
        </View>

        {/* Body stats */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your details</Text>
          <Pressable
            onPress={() => {
              setEditHeightCm(String(heightCm ?? 175));
              setEditWeightKg(String(weightKg ?? 72));
              setEditTargetWeightKg(String(targetWeightKg ?? 68));
              setEditGoal(profile?.goal ?? 'lose');
              setEditActivityLevel(profile?.activityLevel ?? 'moderate');
              setEditDietPreference(profile?.dietPreference ?? 'classic');
              setIsEditing(true);
            }}
            style={({ pressed }) => [styles.editHeaderBtn, pressed && styles.pressed]}>
            <Pencil size={15} color={Palette.brand} />
            <Text style={styles.editHeaderBtnText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.listCard}>
          <StatRow icon={Ruler} label="Height" value={height} onPress={() => setIsEditing(true)} />
          <StatRow icon={Scale} label="Current weight" value={formatWeight(weightKg)} onPress={() => setIsEditing(true)} />
          <StatRow icon={Target} label="Goal weight" value={formatWeight(targetWeightKg)} onPress={() => setIsEditing(true)} />
          <StatRow icon={Activity} label="Activity" value={titleCase(profile?.activityLevel)} onPress={() => setIsEditing(true)} />
          <StatRow icon={Salad} label="Diet" value={titleCase(profile?.dietPreference)} onPress={() => setIsEditing(true)} />
          <StatRow icon={Flame} label="Goal" value={titleCase(profile?.goal)} onPress={() => setIsEditing(true)} isLast />
        </View>

        {loading ? <Text style={styles.loadingText}>Loading your details…</Text> : null}

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
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Details</Text>
              <Pressable onPress={() => setIsEditing(false)} hitSlop={10}>
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
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TargetPill({
  label,
  value,
  color,
  tint,
}: {
  label: string;
  value: number | null | undefined;
  color: string;
  tint: string;
}) {
  return (
    <View style={[styles.targetPill, { backgroundColor: tint }]}>
      <Text style={[styles.targetPillValue, { color }]}>{value ? `${value}g` : '—'}</Text>
      <Text style={styles.targetPillLabel}>{label}</Text>
    </View>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  onPress,
  isLast,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.statRow, !isLast && styles.statRowBordered, pressed && styles.pressed]}>
      <View style={styles.statIcon}>
        <Icon size={17} color={Palette.textSecondary} strokeWidth={2} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingHorizontal: Layout.gutter,
    gap: 14,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: Layout.cardPadding,
    ...CardShadow,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: Radius.pill,
  },
  avatarFallback: {
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.4,
  },
  email: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textSecondary,
    marginTop: 8,
    marginLeft: 4,
  },
  targetsCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: Layout.cardPadding,
    ...CardShadow,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calorieIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  calorieValue: {
    fontSize: 19,
    fontWeight: '800',
    color: Palette.brand,
    fontFamily: NumeralFont,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.border,
    marginVertical: 16,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  targetPill: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  targetPillValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: NumeralFont,
  },
  targetPillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  rationale: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
    lineHeight: 19,
    marginTop: 14,
  },
  listCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    paddingHorizontal: Layout.cardPadding,
    ...CardShadow,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  statRowBordered: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  statIcon: {
    width: 30,
    alignItems: 'center',
  },
  statLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textTertiary,
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.border,
    marginTop: 10,
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
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: Palette.card,
    borderWidth: 1.5,
    borderColor: Palette.dangerTint,
    marginTop: 8,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingRight: 4,
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brandTint,
  },
  editHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.brand,
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
    maxHeight: '85%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
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
});
