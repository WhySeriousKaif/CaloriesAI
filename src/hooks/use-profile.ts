import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getCache, setCache } from '@/lib/cache';
import { getApiUrl } from '@/lib/api-config';


/**
 * The `users` row as `GET /api/profile` returns it. Numeric columns arrive as
 * strings — Drizzle round-trips `numeric` that way to avoid float precision loss.
 */
export type Profile = {
  id: string;
  clerkUserId: string;
  email: string | null;
  timezone: string | null;
  unitPreference: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  heightCm: string | null;
  weightKg: string | null;
  goal: string | null;
  targetWeightKg: string | null;
  activityLevel: string | null;
  dietPreference: string | null;
  dailyCalories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  planRationale: string | null;
  onboardingCompletedAt: string | null;
};

const CACHE_KEY = 'user_profile';

/**
 * Reads the signed-in user's profile and targets.
 *
 * Stale-while-revalidate: the cached copy renders immediately, then a fetch
 * refreshes it in the background.
 *
 * The distinction that matters
 * ----------------------------
 * `profile === null` means **this user has genuinely never onboarded** — only a
 * 404 produces it. Any other failure (network drop, 5xx, unparseable body)
 * leaves `profile` untouched and sets `error` instead.
 *
 * That separation is load-bearing. `(tabs)/_layout.tsx` sends users with no
 * profile to onboarding, so if a failed request also cleared `profile`, a dead
 * database or a lost connection would silently throw a fully-onboarded user
 * back to step one and look like their account had been wiped.
 */
export function useProfile() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ignores responses from a request that a newer one has already superseded,
  // and from requests still in flight after unmount.
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Paint from cache first so the app doesn't hold a spinner over a round trip.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getCache<Profile>(`${CACHE_KEY}_${userId}`).then((cached) => {
      if (!active || !cached) return;
      setProfile((current) => current ?? cached);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Only ever runs for a signed-in user. The signed-out case is derived at the
  // return instead of stored, so nothing here touches state before the first
  // `await` — a synchronous setState in an effect body cascades renders.
  const load = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    const id = ++requestId.current;
    const isCurrent = () => mounted.current && requestId.current === id;

    try {
      const token = await getToken();
      if (!isCurrent()) return;

      if (!token) {
        // Clerk is signed in but hasn't minted a token yet. Not an error — the
        // hook re-runs when auth settles.
        setLoading(false);
        return;
      }

      const response = await fetch(getApiUrl('/api/profile'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isCurrent()) return;

      // The only response that legitimately means "no profile exists".
      if (response.status === 404) {
        setProfile(null);
        setError(null);
        return;
      }

      if (!response.ok) {
        setError(`Couldn't reach Calora (error ${response.status}).`);
        return;
      }

      const body = (await response.json()) as unknown;
      if (!isCurrent()) return;

      const parsed = (
        body && typeof body === 'object' && 'profile' in body
          ? (body as { profile: Profile | null }).profile
          : body
      ) as Profile | null;

      setProfile(parsed);
      setError(null);
      if (parsed && userId) {
        void setCache(`${CACHE_KEY}_${userId}`, parsed);
      }
    } catch (err) {
      if (!isCurrent()) return;
      console.warn('[use-profile] Failed to load profile:', err);
      // Paint from cache if available so network failure doesn't lock out valid user
      const cached = userId ? await getCache<Profile>(`${CACHE_KEY}_${userId}`) : null;
      if (cached) {
        setProfile(cached);
        setError(null);
      } else {
        setError("Couldn't reach Calora. Check your connection.");
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Signing out is a synchronous fact about auth, not something to fetch — so
  // it's derived rather than written into state by an effect.
  const signedOut = isLoaded && !isSignedIn;

  return {
    profile: signedOut ? null : profile,
    loading: signedOut ? false : loading,
    error: signedOut ? null : error,
    reload: load,
  };
}

/** `numeric` columns come back as strings; render-safe parse. */
export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
