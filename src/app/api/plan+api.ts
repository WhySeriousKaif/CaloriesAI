import { runs, tasks } from '@trigger.dev/sdk';

import { planInputSchema } from '@/lib/plan';
// Type-only: importing the task instance would bundle it into the server.
import type { generatePlan } from '../../../trigger/generate-plan';

/**
 * `POST /api/plan` — onboarding answers → daily targets.
 *
 * Deliberately unauthenticated: it runs before the user has an account and
 * writes nothing to the DB. `planInputSchema` is the whole trust boundary.
 *
 * The route triggers the `generate-plan` task and polls it rather than calling
 * OpenAI inline, so the model call, its retry and the Mifflin-St Jeor fallback
 * all live in one place (`trigger/generate-plan.ts`) and show up in the
 * Trigger.dev dashboard. The task never throws, so this poll always settles.
 */
export async function POST(request: Request) {
  const parsed = planInputSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid onboarding answers', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const handle = await tasks.trigger<typeof generatePlan>('generate-plan', parsed.data);
    const run = await runs.poll(handle, { pollIntervalMs: 500 });

    if (run.status !== 'COMPLETED' || !run.output) {
      console.error('[plan] generate-plan did not complete:', run.status, run.error);
      return Response.json({ error: 'Could not build your plan' }, { status: 502 });
    }

    return Response.json(run.output);
  } catch (error) {
    console.error('[plan] Could not reach Trigger.dev:', error);
    return Response.json({ error: 'Could not build your plan' }, { status: 502 });
  }
}
