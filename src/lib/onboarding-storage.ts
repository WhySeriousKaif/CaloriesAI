import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "calora.onboarding.pending";

/**
 * The onboarding questionnaire runs *before* the user has an account, so the
 * answers have nowhere to live until sign-up completes. They're parked here and
 * flushed to `POST /api/profile` by `<ProfileSync />` once Clerk hands us a session.
 *
 * AsyncStorage rather than component state because the OAuth flow bounces out to
 * a browser and back — and because a failed POST should still be retryable on the
 * next app launch instead of silently losing ten screens of input.
 */
export type PendingOnboarding = {
  gender: "male" | "female";
  heightCm: number;
  weightKg: number;
  goal: "lose" | "maintain" | "gain";
  targetWeightKg: number;
  activityLevel: string;
  dietPreference: string;
  /** Display preference only — storage is always metric. */
  unitPreference: "metric" | "imperial";
  /** IANA zone, e.g. "America/New_York". Needed to resolve the user's local day. */
  timezone: string;
  /** Targets from the Mifflin-St Jeor calculation shown on the plan reveal screen. */
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export async function savePendingOnboarding(answers: PendingOnboarding) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (error) {
    // Not fatal — the user still gets an account, just without their answers.
    console.error("[onboarding] Failed to persist answers:", error);
  }
}

export async function readPendingOnboarding(): Promise<PendingOnboarding | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingOnboarding) : null;
  } catch (error) {
    console.error("[onboarding] Failed to read pending answers:", error);
    return null;
  }
}

export async function clearPendingOnboarding() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[onboarding] Failed to clear pending answers:", error);
  }
}

/** The device's IANA timezone, with a safe fallback if Intl is unavailable. */
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
