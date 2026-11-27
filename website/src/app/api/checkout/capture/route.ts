import { checkout } from '@/lib/checkout';
import { paypal } from '@/lib/paypal';
import { settle } from '@/lib/settle';
import { ApiError, db, rateLimit, route, websiteOrigin } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async req => {
  websiteOrigin(req); await rateLimit(req, 'capture', 15);
  const session = await checkout(req);
  const { data: order, error } = await db().from('orders').select('*').eq('purchase_id', session.id).maybeSingle();
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  if (!order?.provider_order_id) throw new ApiError('ORDER_NOT_FOUND', 404);
  if (order.status !== 'created') return { status: order.status };
  const provider = await paypal(`/v2/checkout/orders/${encodeURIComponent(order.provider_order_id)}`);
  if (provider.status !== 'COMPLETED') {
    if (provider.status !== 'APPROVED') throw new ApiError('PAYMENT_NOT_APPROVED', 409);
    await paypal(`/v2/checkout/orders/${encodeURIComponent(order.provider_order_id)}/capture`, 'POST', {}, `capture-${order.id}`);
  }
  return settle(order.provider_order_id);
});
