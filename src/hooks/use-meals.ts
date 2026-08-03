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
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const url = date ? `/api/meals?date=${encodeURIComponent(date)}` : '/api/meals';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => {
        console.warn('[use-meals] Fetch network error:', err);
        return null;
      });

      if (!res || !res.ok) return;
      const data = await res.json().catch(() => null);
      if (data) setMeals(data.meals || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.warn('[use-meals] Error fetching meals:', err);
      setError(err instanceof Error ? err.message : 'Error fetching meals');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, date]);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!isLoaded || !isSignedIn) {
        if (!isCancelled) setLoading(false);
        return;
      }
      try {
        const token = await getToken();
        if (!token || isCancelled) return;

        const url = date ? `/api/meals?date=${encodeURIComponent(date)}` : '/api/meals';
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => {
          console.warn('[use-meals] Fetch network error:', err);
          return null;
        });

        if (!res || !res.ok || isCancelled) return;
        const data = await res.json().catch(() => null);
        if (!isCancelled && data) {
          setMeals(data.meals || (Array.isArray(data) ? data : []));
        }
      } catch (err) {
        if (!isCancelled) setError(err instanceof Error ? err.message : 'Error');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void load();

    // Poll every 3 seconds if any meal is currently analyzing
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const hasAnalyzing = meals.some((m) => m.status === 'analyzing');
    if (hasAnalyzing) {
      intervalId = setInterval(() => {
        void load();
      }, 3000);
    }

    return () => {
      isCancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoaded, isSignedIn, getToken, date, meals]);

  const logMeal = useCallback(
    async (mealData: Partial<MealItem> & { image?: string }) => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Unauthorized');

        const res = await fetch('/api/meals', {
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
          setMeals((prev) => [newMeal, ...prev.filter((m) => m.id !== newMeal.id)]);
        }
        return newMeal;
      } catch (err) {
        console.error('[use-meals] Error logging meal:', err);
        throw err;
      }
    },
    [getToken]
  );

  return { meals, loading, error, reload: fetchMeals, logMeal };
}
