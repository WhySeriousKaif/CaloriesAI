import type { Plan, PlanInput } from '@/lib/plan';
import { getApiUrl } from '@/lib/api-config';

/**
 * Onboarding answers -> AI-generated target plan.
 * Unauthenticated: runs before sign-up during onboarding.
 */
export async function requestPlan(input: PlanInput): Promise<Plan & { source?: string }> {
  const response = await fetch(getApiUrl('/api/plan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Plan generation failed (${response.status})`);
  }

  return response.json();
}

/** Deletes the user profile, meals, and Clerk user. */
export async function deleteAccount(token: string | null) {
  if (!token) throw new Error('No auth session token');

  const response = await fetch(getApiUrl('/api/profile'), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Could not delete your account (${response.status})`);
  }
}
