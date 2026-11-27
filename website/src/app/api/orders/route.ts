import { checkout } from '@/lib/checkout';
import { isPlan, plans, price } from '@/lib/plans';
import { paypal } from '@/lib/paypal';
import { ApiError, appUrl, body, db, hash, rateLimit, route, rpc, websiteOrigin, env } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async req => {
  websiteOrigin(req); await rateLimit(req, 'order', 10);
  const session = await checkout(req), { plan } = await body(req);
  if (!isPlan(plan)) throw new ApiError('INVALID_PLAN');
  const order = await rpc('reserve_order', { p_purchase: session.id, p_website: hash(session.secret), p_plan: plan, p_amount: plans[plan].cents });
  if (order.status !== 'created') throw new ApiError('ORDER_ALREADY_PROCESSED', 409);
  // Stable idempotency key makes a lost create response safely retryable.
  const created = await paypal('/v2/checkout/orders', 'POST', {
    intent: 'CAPTURE', purchase_units: [{ custom_id: order.id, payee: { merchant_id: env('PAYPAL_MERCHANT_ID') }, amount: { currency_code: 'USD', value: price(plan) }, description: `Tab Copier Pro — ${plans[plan].name}` }],
    payment_source: { paypal: { experience_context: { shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW', return_url: `${appUrl()}/payment/return`, cancel_url: `${appUrl()}/checkout?cancelled=1` } } },
  }, order.id);
  const { error } = await db().from('orders').update({ provider_order_id: created.id }).eq('id', order.id).or(`provider_order_id.is.null,provider_order_id.eq.${created.id}`);
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  const approval = created.links?.find((x: any) => ['payer-action', 'approve'].includes(x.rel))?.href;
  if (!approval || new URL(approval).hostname !== 'www.sandbox.paypal.com') throw new ApiError('PAYPAL_APPROVAL_UNAVAILABLE', 502);
  return { orderId: order.id, approvalUrl: approval };
});
