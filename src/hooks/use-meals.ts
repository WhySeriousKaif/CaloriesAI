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

export function useMeals() {
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

      const res = await fetch('/api/meals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch meals');
      const data = await res.json();
      setMeals(data.meals || []);
    } catch (err) {
      console.error('[use-meals] Error fetching meals:', err);
      setError(err instanceof Error ? err.message : 'Error fetching meals');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

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

        const res = await fetch('/api/meals', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch meals');
        const data = await res.json();
        if (!isCancelled) setMeals(data.meals || []);
      } catch (err) {
        if (!isCancelled) setError(err instanceof Error ? err.message : 'Error');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const logMeal = useCallback(
    async (mealData: Partial<MealItem>) => {
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
        if (data.meal) {
          setMeals((prev) => [data.meal, ...prev]);
        }
        return data.meal;
      } catch (err) {
        console.error('[use-meals] Error logging meal:', err);
        throw err;
      }
    },
    [getToken]
  );

  return { meals, loading, error, reload: fetchMeals, logMeal };
}
