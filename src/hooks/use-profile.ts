import { getCache, setCache } from '@/lib/cache';
import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';

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
 * Uses Stale-While-Revalidate caching:
 * 1. Loads instantly from local storage (0ms spinner)
 * 2. Fetches updates silently in the background
 */
export function useProfile() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from local storage cache immediately on mount
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getCache<Profile>(`${CACHE_KEY}_${userId}`).then((cached) => {
      if (active && cached) {
        setProfile(cached);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const load = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (!response) return;

      if (response.status === 404) {
        setProfile(null);
        return;
      }

      if (!response.ok) return;

      const rawData = await response.json().catch(() => null);
      if (rawData) {
        const parsedProfile = (typeof rawData === 'object' && 'profile' in rawData ? rawData.profile : rawData) as Profile | null;
        setProfile(parsedProfile);
        if (parsedProfile && userId) {
          void setCache(`${CACHE_KEY}_${userId}`, parsedProfile);
        }
      }
    } catch (err) {
      console.warn('[use-profile] Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, userId]);

  useEffect(() => {
    let isCancelled = false;

    if (!isLoaded) return;

    async function fetchProfile() {
      if (!isSignedIn) {
        if (!isCancelled) setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token || isCancelled) {
          if (!isCancelled) setLoading(false);
          return;
        }

        const response = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => {
          console.warn('[use-profile] Network fetch exception:', err);
          return null;
        });

        if (!response || isCancelled) {
          if (!isCancelled) setLoading(false);
          return;
        }

        if (response.status === 404) {
          if (!isCancelled) setProfile(null);
          return;
        }

        if (!response.ok) {
          if (!isCancelled) setLoading(false);
          return;
        }

        const rawData = await response.json().catch(() => null);
        if (!isCancelled && rawData) {
          const parsedProfile = (typeof rawData === 'object' && 'profile' in rawData ? rawData.profile : rawData) as Profile | null;
          setProfile(parsedProfile);
          if (parsedProfile && userId) {
            void setCache(`${CACHE_KEY}_${userId}`, parsedProfile);
          }
        }
      } catch (err) {
        console.warn('[use-profile] Failed to load profile:', err);
        if (!isCancelled) setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void fetchProfile();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, userId]);

  return { profile, loading, error, reload: load };
}

/** `numeric` columns come back as strings; render-safe parse. */
export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
