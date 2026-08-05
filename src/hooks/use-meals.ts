import { getCache, setCache } from '@/lib/cache';
import { getApiUrl } from '@/lib/api-config';

import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';

export type MealItem = {
  id: string;
  userId: string;
  imageUrl: string;
  status: 'analyzing' | 'completed' | 'failed';
  name: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  errorReason: string | null;
  loggedAt: string;
};

export function useMeals(date?: string) {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `user_meals_${userId || 'anon'}_${date || 'all'}`;

  // Load from local storage cache immediately on mount
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getCache<MealItem[]>(cacheKey).then((cached) => {
      if (active && cached && Array.isArray(cached)) {
        setMeals(cached);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [userId, cacheKey]);

  const fetchMeals = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const path = date ? `/api/meals?date=${encodeURIComponent(date)}` : '/api/meals';
      const res = await fetch(getApiUrl(path), {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      if (!res || !res.ok) return;
      const data = await res.json().catch(() => null);
      if (data) {
        const list = data.meals || (Array.isArray(data) ? data : []);
        setMeals(list);
        if (userId) {
          void setCache(cacheKey, list);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching meals');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, date, userId, cacheKey]);

  useEffect(() => {
    void fetchMeals();
  }, [fetchMeals]);

  // Poll every 3 seconds if any meal is currently analyzing
  const hasAnalyzing = meals.some((m) => m.status === 'analyzing');
  useEffect(() => {
    if (!hasAnalyzing) return;
    const intervalId = setInterval(() => {
      void fetchMeals();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [hasAnalyzing, fetchMeals]);

  const logMeal = useCallback(
    async (mealData: Partial<MealItem> & { image?: string }) => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Unauthorized');

        const res = await fetch(getApiUrl('/api/meals'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(mealData),
        });

        if (!res.ok) throw new Error('Failed to log meal');
        const data = await res.json();
        const newMeal = data.meal || data;
        if (newMeal && newMeal.id) {
          setMeals((prev) => {
            const updated = [newMeal, ...prev.filter((m) => m.id !== newMeal.id)];
            if (userId) void setCache(cacheKey, updated);
            return updated;
          });
        }
        return newMeal;
      } catch (err) {
        console.error('[use-meals] Error logging meal:', err);
        throw err;
      }
    },
    [getToken, userId, cacheKey]
  );

  return { meals, loading, error, reload: fetchMeals, logMeal };
}
