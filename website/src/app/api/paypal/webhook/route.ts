import { ApiError, body, db, env, route, rpc } from '@/lib/server';
import { paypal } from '@/lib/paypal';
import { settle } from '@/lib/settle';
export const runtime = 'nodejs';
export const POST = route(async req => {
  const event = await body(req);
  const verification = await paypal('/v1/notifications/verify-webhook-signature', 'POST', {
    auth_algo: req.headers.get('paypal-auth-algo'), cert_url: req.headers.get('paypal-cert-url'),
    transmission_id: req.headers.get('paypal-transmission-id'), transmission_sig: req.headers.get('paypal-transmission-sig'),
    transmission_time: req.headers.get('paypal-transmission-time'), webhook_id: env('PAYPAL_WEBHOOK_ID'), webhook_event: event,
  });
  if (verification.verification_status !== 'SUCCESS') throw new ApiError('INVALID_WEBHOOK', 401);
  if (typeof event.id !== 'string' || typeof event.event_type !== 'string') throw new ApiError('INVALID_EVENT');
  const store = db();
  const { error: insertError } = await store.from('payment_events').upsert({ id: event.id, event_type: event.event_type }, { onConflict: 'id', ignoreDuplicates: true });
  if (insertError) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  const { data: saved, error: readError } = await store.from('payment_events').select('processed_at').eq('id', event.id).single();
  if (readError) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  if (saved.processed_at) return { received: true };
  const supported = ['PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED'];
  if (supported.includes(event.event_type)) {
    let orderId = event.resource?.supplementary_data?.related_ids?.order_id;
    if (!orderId) {
      // Refund resources may refer to the original capture through an 'up' link.
      const up = event.resource?.links?.find((x: any) => x.rel === 'up')?.href;
      const match = typeof up === 'string' ? up.match(/^https:\/\/api(?:-m)?\.sandbox\.paypal\.com\/v2\/payments\/captures\/([A-Z0-9]+)$/) : null;
      if (match) {
        const capture = await paypal(`/v2/payments/captures/${match[1]}`);
        orderId = capture.supplementary_data?.related_ids?.order_id;
      }
    }
    if (typeof orderId !== 'string' || !/^[A-Z0-9]+$/.test(orderId)) throw new ApiError('EVENT_REQUIRES_RECONCILIATION', 503);
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // A late success must never restore a refunded or revoked entitlement.
      const { data: o, error } = await store.from('orders').select('status').eq('provider_order_id', orderId).maybeSingle();
      if (error || !o) throw new ApiError('EVENT_REQUIRES_RECONCILIATION', 503);
      if (!['refunded', 'reversed', 'review'].includes(o.status)) await settle(orderId);
    } else {
      const found = await rpc('revoke_order', { p_provider_order: orderId, p_state: event.event_type.endsWith('REFUNDED') ? 'refunded' : 'reversed' });
      if (!found) throw new ApiError('EVENT_REQUIRES_RECONCILIATION', 503);
    }
  }
  const { error } = await store.from('payment_events').update({ processed_at: new Date().toISOString() }).eq('id', event.id);
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  return { received: true };
});
