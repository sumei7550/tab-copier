import { isPlan, price } from './plans.ts';

// Provider payloads are untrusted even after browser approval.
export function verifiedCapture(payload: any, order: { id: string; provider_order_id: string; plan: string }, merchantId: string) {
  if (!isPlan(order.plan) || !merchantId || payload.id !== order.provider_order_id || payload.status !== 'COMPLETED') throw new Error('PAYMENT_MISMATCH');
  const units = payload.purchase_units;
  if (!Array.isArray(units) || units.length !== 1) throw new Error('PAYMENT_MISMATCH');
  const unit = units[0];
  const captures = unit.payments?.captures;
  if (unit.custom_id !== order.id || unit.payee?.merchant_id !== merchantId ||
      !Array.isArray(captures) || captures.length !== 1) throw new Error('PAYMENT_MISMATCH');
  const capture = captures[0];
  if (capture.status !== 'COMPLETED' || capture.final_capture !== true ||
      capture.amount?.currency_code !== 'USD' || capture.amount?.value !== price(order.plan) ||
      typeof capture.id !== 'string' || !capture.id) throw new Error('PAYMENT_MISMATCH');
  return { captureId: capture.id, payerId: typeof payload.payer?.payer_id === 'string' ? payload.payer.payer_id : null };
}
