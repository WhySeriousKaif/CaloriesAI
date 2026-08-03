import { verifyToken } from '@clerk/backend';

/**
 * Clerk user id for a request carrying `Authorization: Bearer <session token>`,
 * or null. Networkless — verifies the JWT signature against the secret key.
 *
 * Throws rather than returning null when the key is missing: an unconfigured
 * server answering 401 to every request looks exactly like a signed-out user,
 * which is the hardest possible way to notice a missing env var.
 */
export async function getAuthUserId(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('Add CLERK_SECRET_KEY to your .env file');

  const token = request.headers.get('Authorization')?.replace(/^Bearer /i, '');
  if (!token) return null;

  try {
    const { sub } = await verifyToken(token, { secretKey });
    return sub;
  } catch (error: any) {
    if (error?.reason !== 'token-expired') {
      console.error('Clerk token verification failed:', error);
    }
    return null;
  }
}

export const unauthorized = () => Response.json({ error: 'Unauthorized' }, { status: 401 });
