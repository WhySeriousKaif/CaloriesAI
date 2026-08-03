import { useAuth, useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Activity,
  ChevronRight,
  Flame,
  LogOut,
  Ruler,
  Scale,
  Salad,
  Target,
  Trash2,
  User as UserIcon,
} from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { profile, loading } = useProfile();

  const heightCm = toNumber(profile?.heightCm);
  const weightKg = toNumber(profile?.weightKg);
  const targetWeightKg = toNumber(profile?.targetWeightKg);

  const isImperial = profile?.unitPreference === 'imperial';

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
        <Text style={styles.sectionTitle}>Your details</Text>
        <View style={styles.listCard}>
          <StatRow icon={Ruler} label="Height" value={height} />
          <StatRow icon={Scale} label="Current weight" value={formatWeight(weightKg)} />
          <StatRow icon={Target} label="Goal weight" value={formatWeight(targetWeightKg)} />
          <StatRow icon={Activity} label="Activity" value={titleCase(profile?.activityLevel)} />
          <StatRow icon={Salad} label="Diet" value={titleCase(profile?.dietPreference)} />
          <StatRow icon={Flame} label="Goal" value={titleCase(profile?.goal)} isLast />
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
  isLast,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      // Editing lands in Phase 6 alongside PATCH /api/profile.
      disabled
      style={[styles.statRow, !isLast && styles.statRowBordered]}>
      <View style={styles.statIcon}>
        <Icon size={17} color={Palette.textSecondary} strokeWidth={2} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <ChevronRight size={17} color={Palette.textTertiary} strokeWidth={2} />
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
});
