import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';

export function useStreak() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [streak, setStreak] = useState<number>(0);
  const [lastLoggedDate, setLastLoggedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      }
    } catch (err) {
      console.warn('[use-streak] Error fetching streak:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    void fetchStreak();
  }, [fetchStreak]);

  return { streak, lastLoggedDate, loading, refreshStreak: fetchStreak };
}
