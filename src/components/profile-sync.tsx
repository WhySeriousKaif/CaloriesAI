import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import {
  clearPendingOnboarding,
  readPendingOnboarding,
} from '@/lib/onboarding-storage';
import { useProfile } from '@/hooks/use-profile';

/**
 * Flushes the parked onboarding answers to `POST /api/profile` once Clerk has a
 * session, then clears them.
 *
 * Mounted at the root rather than fired from the sign-in screen on purpose: that
 * screen unmounts the instant `setActive` flips the auth guard, which would kill
 * an in-flight request. Running here also means a failed POST is simply retried
 * on the next app launch, because the answers stay in storage until a 2xx.
 */
export function ProfileSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { reload } = useProfile();
  const router = useRouter();
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || inFlight.current) return;

    let syncAttempted = false;

    (async () => {
      try {
        const answers = await readPendingOnboarding();
        if (!answers) return; // Returning user — nothing to sync.

        inFlight.current = true;
        syncAttempted = true;

        const token = await getToken();
        if (!token) {
          console.warn('[profile-sync] Session token not available yet, will retry.');
          return;
        }

        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(answers),
        });

        if (!response.ok) {
          console.error(
            '[profile-sync] Failed to save profile:',
            response.status,
            await response.text()
          );
          return;
        }

        await clearPendingOnboarding();
        console.log('[profile-sync] Onboarding profile successfully synced to Neon DB.');
        await reload();
        router.replace('/(tabs)');
      } catch (error) {
        console.error('[profile-sync] Sync failed:', error);
      } finally {
        if (syncAttempted) {
          inFlight.current = false;
        }
      }
    })();
  }, [isLoaded, isSignedIn, getToken, reload, router]);

  return null;
}
