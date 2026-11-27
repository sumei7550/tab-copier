import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifiedCapture } from '../src/lib/payment-validation.ts';
const order = { id: 'local-order', provider_order_id: 'PAYPAL1', plan: 'month' };
function payload() { return { id: 'PAYPAL1', status: 'COMPLETED', payer: { payer_id: 'PAYER1' }, purchase_units: [{ custom_id: 'local-order', payee: { merchant_id: 'SELLER1' }, payments: { captures: [{ id: 'CAPTURE1', status: 'COMPLETED', final_capture: true, amount: { currency_code: 'USD', value: '4.99' } }] } }] }; }
test('only the exact completed, matched payment is accepted', () => {
  assert.deepEqual(verifiedCapture(payload(), order, 'SELLER1'), { captureId: 'CAPTURE1', payerId: 'PAYER1' });
});
test('a browser-approved order does not grant entitlement', () => {
  const p = payload(); p.status = 'APPROVED'; assert.throws(() => verifiedCapture(p, order, 'SELLER1'));
});
test('reject wrong merchant, local order or provider order', () => {
  assert.throws(() => verifiedCapture(payload(), order, 'OTHER'));
  assert.throws(() => verifiedCapture(payload(), { ...order, id: 'someone-else' }, 'SELLER1'));
  assert.throws(() => verifiedCapture(payload(), { ...order, provider_order_id: 'OTHER' }, 'SELLER1'));
});
test('reject price or currency tampering and partial capture', () => {
  for (const key of ['value', 'currency_code'] as const) {
    const p = payload(); p.purchase_units[0].payments.captures[0].amount[key] = key === 'value' ? '0.99' : 'EUR';
    assert.throws(() => verifiedCapture(p, order, 'SELLER1'));
  }
  const p = payload(); p.purchase_units[0].payments.captures[0].final_capture = false;
  assert.throws(() => verifiedCapture(p, order, 'SELLER1'));
});
test('reject refunded or multiple captures', () => {
  const p = payload(); p.purchase_units[0].payments.captures[0].status = 'REFUNDED';
  assert.throws(() => verifiedCapture(p, order, 'SELLER1'));
  const q = payload(); q.purchase_units[0].payments.captures.push(q.purchase_units[0].payments.captures[0]);
  assert.throws(() => verifiedCapture(q, order, 'SELLER1'));
});
