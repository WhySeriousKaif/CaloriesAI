import { getCache, setCache } from '@/lib/cache';
import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';

type StreakData = {
  streak: number;
  lastLoggedDate: string | null;
};

export function useStreak() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();
  const [streak, setStreak] = useState<number>(0);
  const [lastLoggedDate, setLastLoggedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const cacheKey = `user_streak_${userId || 'anon'}`;

  // Load from local storage cache immediately on mount
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getCache<StreakData>(cacheKey).then((cached) => {
      if (active && cached) {
        setStreak(cached.streak);
        setLastLoggedDate(cached.lastLoggedDate);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [userId, cacheKey]);

  const fetchStreak = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/streak', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => {
        console.warn('[use-streak] Network error:', err);
        return null;
      });

      if (!res || !res.ok) return;
      const data = await res.json().catch(() => null);
      if (data && typeof data.streak === 'number') {
        setStreak(data.streak);
        setLastLoggedDate(data.lastLoggedDate || null);
        if (userId) {
          void setCache(cacheKey, {
            streak: data.streak,
            lastLoggedDate: data.lastLoggedDate || null,
          });
        }
      }
    } catch (err) {
      console.warn('[use-streak] Error fetching streak:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, userId, cacheKey]);

  useEffect(() => {
    void fetchStreak();
  }, [fetchStreak]);

  return { streak, lastLoggedDate, loading, refreshStreak: fetchStreak };
}
