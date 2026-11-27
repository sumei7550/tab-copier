import { ApiError, bearer, db, hash, route, uuid, rateLimit } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async (req, context) => {
  await rateLimit(req, 'poll', 60);
  const { id } = await context.params;
  if (!uuid(id)) throw new ApiError('INVALID_PURCHASE');
  const { data: s, error } = await db().from('purchase_sessions').select('id,expires_at').eq('id', id).eq('poll_hash', hash(bearer(req))).maybeSingle();
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  if (!s || Date.parse(s.expires_at) <= Date.now()) throw new ApiError('UNAUTHORIZED', 401);
  const { data, error: e } = await db().from('orders').select('status,plan').eq('purchase_id', id).maybeSingle();
  if (e) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  return { status: data?.status ?? 'not_created', plan: data?.plan ?? null };
});
