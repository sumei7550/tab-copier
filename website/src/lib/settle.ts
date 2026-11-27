import 'server-only';
import { db, ApiError, env, rpc } from './server';
import { paypal } from './paypal';
import { verifiedCapture } from './payment-validation';
export async function settle(providerId: string) {
  const { data: order, error } = await db().from('orders').select('*').eq('provider_order_id', providerId).maybeSingle();
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  if (!order) throw new ApiError('ORDER_NOT_FOUND', 404);
  const payload = await paypal(`/v2/checkout/orders/${encodeURIComponent(providerId)}`);
  let capture;
  try { capture = verifiedCapture(payload, order, env('PAYPAL_MERCHANT_ID')); }
  catch { throw new ApiError('PAYMENT_NOT_CONFIRMED', 409); }
  return rpc('record_capture', { p_order: order.id, p_capture: capture.captureId, p_payer: capture.payerId,p_payer_email:capture.payerEmail });
}
