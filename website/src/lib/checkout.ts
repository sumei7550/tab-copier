import 'server-only';
import { NextRequest } from 'next/server';
import { ApiError, db, hash } from './server';
export async function checkout(req: NextRequest) {
  const raw = req.cookies.get('tc_checkout')?.value;
  if (!raw || raw.length > 256) throw new ApiError('UNAUTHORIZED', 401);
  const [id, secret] = raw.split('.');
  const { data, error } = await db().from('purchase_sessions').select('id,ticket_used_at,expires_at').eq('id', id).eq('website_hash', hash(secret || '')).maybeSingle();
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  if (!data || !data.ticket_used_at || Date.parse(data.ticket_used_at) < Date.now() - 86_400_000 || Date.parse(data.expires_at) <= Date.now()) throw new ApiError('UNAUTHORIZED', 401);
  return { id: data.id, secret };
}
