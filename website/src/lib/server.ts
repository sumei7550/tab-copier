import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac, randomBytes, createPrivateKey, sign } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export class ApiError extends Error { constructor(public code: string, public status = 400) { super(code); } }
export function env(key: string) { const value = process.env[key]; if (!value) throw new ApiError('SERVER_NOT_CONFIGURED', 503); return value; }
export function sandboxOnly() { if (env('PAYPAL_ENV') !== 'sandbox') throw new ApiError('LIVE_DISABLED', 503); }
export function appUrl() {
  const url = new URL(env('APP_URL'));
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new ApiError('BAD_SERVER_CONFIG', 503);
  return url.origin;
}
export function db() { return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } }); }
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
export function refreshToken(purchase: string, poll: string) { return createHmac('sha256', env('TOKEN_DERIVATION_SECRET')).update(`sandbox:${purchase}:${poll}`).digest('base64url'); }
export const uuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export function bearer(req: NextRequest) { const s = req.headers.get('authorization'); if (!s?.startsWith('Bearer ') || s.length > 512) throw new ApiError('UNAUTHORIZED', 401); return s.slice(7); }
export async function body(req: NextRequest) {
  const raw = await req.text(); if (raw.length > 32_768) throw new ApiError('PAYLOAD_TOO_LARGE', 413);
  try { return JSON.parse(raw); } catch { throw new ApiError('INVALID_JSON'); }
}
export function websiteOrigin(req: NextRequest) { if (req.headers.get('origin') !== appUrl()) throw new ApiError('ORIGIN_DENIED', 403); }
export async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await db().rpc(name, args);
  if (error) {
    const code = error.message;
    if (['UNAUTHORIZED', 'EXPIRED', 'NOT_PAID', 'REVOKED', 'TRIAL_USED', 'DEVICE_LIMIT', 'RECOVERY_PENDING', 'RECOVERY_USED','INVALID_PURCHASE_EMAIL','PURCHASE_EMAIL_LOCKED','TRANSACTION_ALIAS_CONFLICT'].includes(code)) throw new ApiError(code, code === 'UNAUTHORIZED' ? 401 : 409);
    throw new ApiError('STORAGE_UNAVAILABLE', 503);
  }
  return data;
}
export async function rateLimit(req: NextRequest, action: string, max = 30) {
  // Vercel controls this header; other deployments must configure a trusted proxy.
  const ip = process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for') : 'local-development';
  const allowed = await rpc('consume_rate', { p_key: hash(`${action}:${ip || 'unknown'}`), p_limit: max });
  if (!allowed) throw new ApiError('RATE_LIMITED', 429);
}
export function signingKey() {
  const key = createPrivateKey(env('ENTITLEMENT_PRIVATE_KEY').replace(/\\n/g, '\n'));
  if (key.asymmetricKeyType !== 'ed25519') throw new ApiError('BAD_SIGNING_CONFIG', 503);
  return key;
}
export function entitlement(row: any) {
  const now = Date.now();
  const exp = row.expires_at ? Date.parse(row.expires_at) : null;
  const claims = { environment: 'sandbox', activationId: row.activation_id, licenseId: row.license_id,
    plan: row.plan, features: ['unlimited', 'tab_groups', 'deduplicate', 'markdown_styles'],
    issuedAt: new Date(now).toISOString(), expiresAt: row.expires_at,
    offlineUntil: new Date(Math.min(now + 72 * 3_600_000, exp ?? Infinity)).toISOString(), keyId: env('ENTITLEMENT_KEY_ID') };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const key = signingKey();
  return { payload, signature: sign(null, Buffer.from(payload), key).toString('base64url') };
}
export function route(fn: (req: NextRequest, context: any) => Promise<unknown>) {
  return async (req: NextRequest, context: any) => {
    try { sandboxOnly(); return NextResponse.json(await fn(req, context), { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }); }
    catch (e) { const error = e instanceof ApiError ? e : new ApiError('INTERNAL_ERROR', 500); return NextResponse.json({ error: error.code }, { status: error.status, headers: { 'Cache-Control': 'no-store' } }); }
  };
}
