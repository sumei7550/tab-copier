import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewRecovery,recoveryInput,type RecoveryStore} from '../src/lib/recovery-review.ts';

const installation='11111111-1111-4111-8111-111111111111';
const input={supportId:'TC-'+installation,captureId:'CAPTURE123'};
const order={id:'order',provider_order_id:'PAYPAL123',provider_capture_id:'CAPTURE123',plan:'trial',status:'paid',purchase_email:null,paid_at:new Date().toISOString()};
function fixture(){
  const session={id:'request',installation_id:installation,expires_at:new Date(Date.now()+86_400_000).toISOString()};
  const license={id:'license',expires_at:new Date(Date.now()+86_400_000).toISOString(),revoked_at:null as string|null};
  const payment={id:'PAYPAL123',status:'COMPLETED',purchase_units:[{custom_id:'order',payee:{merchant_id:'MERCHANT'},payments:{captures:[{id:'CAPTURE123',status:'COMPLETED',final_capture:true,amount:{currency_code:'USD',value:'0.99'}}]}}]};
  const store:RecoveryStore={session:async()=>session,order:async()=>({...order}),license:async()=>license};
  return {session,license,payment,store};
}
test('admin review resolves the current installation request and independently verifies PayPal payment',async()=>{
  const f=fixture();let checked=false;
  const review=await reviewRecovery(input,f.store,async id=>{assert.equal(id,'PAYPAL123');checked=true;return f.payment;},'MERCHANT');
  assert.ok(checked);assert.equal(review.sessionId,'request');assert.equal(review.installationId,installation);assert.equal(review.purchaseEmail,null);assert.equal(review.plan,'trial');
});
test('missing request, unpaid/refunded order, revoked or expired license cannot be restored',async()=>{
  const provider=async()=>{throw Error('must reject before contacting PayPal');};
  let f=fixture();f.store.session=async()=>null;await assert.rejects(reviewRecovery(input,f.store,provider,'MERCHANT'),/RECOVERY_REQUEST_NOT_FOUND/);
  f=fixture();f.store.order=async()=>({...order,status:'refunded'});await assert.rejects(reviewRecovery(input,f.store,provider,'MERCHANT'),/NOT_PAID/);
  f=fixture();f.license.revoked_at=new Date().toISOString();await assert.rejects(reviewRecovery(input,f.store,provider,'MERCHANT'),/REVOKED/);
  f=fixture();f.license.expires_at=new Date(Date.now()-1000).toISOString();await assert.rejects(reviewRecovery(input,f.store,provider,'MERCHANT'),/EXPIRED/);
});
test('admin cannot issue on wrong merchant, amount or capture even if a local paid row exists',async()=>{
  let f=fixture();await assert.rejects(reviewRecovery(input,f.store,async()=>f.payment,'OTHER'),/PAYMENT_MISMATCH/);
  f=fixture();f.payment.purchase_units[0].payments.captures[0].amount.value='99.00';await assert.rejects(reviewRecovery(input,f.store,async()=>f.payment,'MERCHANT'),/PAYMENT_MISMATCH/);
  f=fixture();f.payment.purchase_units[0].payments.captures[0].id='WRONG123';await assert.rejects(reviewRecovery(input,f.store,async()=>f.payment,'MERCHANT'),/PAYMENT_MISMATCH/);
  assert.throws(()=>recoveryInput({supportId:'arbitrary',captureId:'CAPTURE123'}),/INVALID_RECOVERY_INPUT/);
});
