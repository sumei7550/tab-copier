import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pollPayment} from '../src/lib/payment-poll.ts';

test('return page automatically retries transient failures and delayed settlement until paid',async()=>{
  let calls=0,retries=0;const controller=new AbortController();
  const result=await pollPayment({signal:controller.signal,sleep:async()=>{},onRetry:()=>{retries++;},request:async()=>{
    calls++;if(calls===1)throw Error('PAYMENT_NOT_APPROVED');return {status:calls===2?'created':'paid'};
  }});
  assert.equal(result.status,'paid');assert.equal(calls,3);assert.equal(retries,2);
});
test('confirmation stops on review or permanent credential error',async()=>{
  let calls=0;
  const args={signal:new AbortController().signal,sleep:async()=>{},onRetry:()=>{throw Error('unexpected retry');}};
  assert.equal((await pollPayment({...args,request:async()=>{calls++;return {status:'review'};}})).status,'review');
  await assert.rejects(pollPayment({...args,request:async()=>{calls++;throw Error('UNAUTHORIZED');}}),/UNAUTHORIZED/);
  assert.equal(calls,2);
});
test('pending confirmation has a finite retry budget and unmount cancels further requests',async()=>{
  let calls=0;const controller=new AbortController();
  await assert.rejects(pollPayment({attempts:3,signal:controller.signal,sleep:async()=>{},onRetry:()=>{},request:async()=>{calls++;return {status:'created'};}}),/PAYMENT_CONFIRMATION_PENDING/);
  assert.equal(calls,3);calls=0;
  await assert.rejects(pollPayment({signal:controller.signal,onRetry:()=>{controller.abort();},request:async()=>{calls++;return {status:'created'};}}),{name:'AbortError'});
  assert.equal(calls,1);
});
