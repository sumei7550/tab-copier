import 'server-only';
import { ApiError, env, sandboxOnly } from './server';
export async function paypal(path: string, method = 'GET', data?: unknown, requestId?: string) {
  sandboxOnly();
  const base = 'https://api-m.sandbox.paypal.com';
  const auth = await fetch(`${base}/v1/oauth2/token`, { method: 'POST', headers: {
    Authorization: `Basic ${Buffer.from(`${env('PAYPAL_CLIENT_ID')}:${env('PAYPAL_CLIENT_SECRET')}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }, body: 'grant_type=client_credentials', cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  if (!auth.ok) throw new ApiError('PAYPAL_AUTH_UNAVAILABLE', 503);
  const { access_token } = await auth.json();
  const response = await fetch(`${base}${path}`, { method, headers: {
    Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json',
    ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
  }, body: data === undefined ? undefined : JSON.stringify(data), cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new ApiError('PAYPAL_REQUEST_FAILED', 502);
  return response.status === 204 ? null : response.json();
}
