import { useAuth } from '@clerk/expo';
import { useEffect, useRef } from 'react';

import {
  clearPendingOnboarding,
  readPendingOnboarding,
} from '@/lib/onboarding-storage';

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
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || inFlight.current) return;

    inFlight.current = true;

    (async () => {
      try {
        const answers = await readPendingOnboarding();
        if (!answers) return; // Returning user — nothing to sync.

        const token = await getToken();
        if (!token) return;

        // Relative URLs resolve against the Expo dev server in development and
        // against the `origin` configured for expo-router in production.
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(answers),
        });

        if (!response.ok) {
          // Keep the answers so the next launch retries.
          console.error(
            '[profile-sync] Failed to save profile:',
            response.status,
            await response.text()
          );
          return;
        }

        await clearPendingOnboarding();
      } catch (error) {
        console.error('[profile-sync] Sync failed:', error);
      } finally {
        inFlight.current = false;
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  return null;
}
