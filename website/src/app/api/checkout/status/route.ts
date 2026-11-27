import { checkout } from '@/lib/checkout';
import { ApiError, db, route } from '@/lib/server';
export const runtime = 'nodejs';
export const GET = route(async req => {
  const session = await checkout(req);
  const { data, error } = await db().from('orders').select('status,plan,purchase_email').eq('purchase_id', session.id).maybeSingle();
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  return { status: data?.status ?? 'not_created', plan: data?.plan ?? null,email:data?.purchase_email??null };
});
