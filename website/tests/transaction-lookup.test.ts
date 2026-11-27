import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveTransaction,selectedEmailOrder,reportingWindow,type LookupStore} from '../src/lib/transaction-lookup.ts';
import {probeTransactionPair} from '../src/lib/paypal-probe.ts';
const buyer='BUYER123456789012',seller='SELLER12345678901';
const order={id:'order',provider_order_id:'provider',provider_capture_id:seller,plan:'trial',status:'paid',purchase_email:'contact@example.com',paypal_payer_email:'payer@example.com',paid_at:new Date().toISOString()};
function fixture(){
  const store:LookupStore={byCapture:async id=>id===seller?order:null,byAlias:async()=>null,byProviderOrder:async id=>id==='provider'?order:null};
  const row={transaction_info:{transaction_id:buyer,paypal_account_id:'MERCHANT',transaction_status:'S',transaction_event_code:'T0006',paypal_reference_id_type:'ODR',paypal_reference_id:'provider',transaction_amount:{currency_code:'USD',value:'0.99'}}};
  return {store,row};
}
test('seller and saved buyer references resolve without reporting API or email',async()=>{
  const {store}=fixture();const noCall=async()=>{throw Error('unexpected API');};
  assert.equal((await resolveTransaction({transactionId:seller},store,noCall,'MERCHANT')).matchMethod,'seller_transaction');
  store.byAlias=async id=>id===buyer?order:null;
  assert.equal((await resolveTransaction({transactionId:buyer},store,noCall,'MERCHANT')).matchMethod,'saved_buyer_transaction');
});
test('API matching requires exact requested ID, seller account, successful credit, amount and explicit order reference',async()=>{
  const {store,row}=fixture();let path='';
  const result=await resolveTransaction({transactionId:buyer},store,async p=>{path=p;return {transaction_details:[row],total_pages:1};},'MERCHANT');
  assert.equal(result.id,'order');assert.equal(result.matchMethod,'paypal_reporting');assert.match(path,/transaction_id=BUYER/);
  for(const patch of [{transaction_id:'UNRELATED12345678'},{paypal_account_id:'OTHER'},{transaction_status:'V'},{transaction_event_code:'T1107'},{transaction_amount:{currency_code:'USD',value:'99.00'}},{paypal_reference_id_type:'TXN'}]){
    await assert.rejects(resolveTransaction({transactionId:buyer},store,async()=>({transaction_details:[{transaction_info:{...row.transaction_info,...patch}}]}),'MERCHANT'),/TRANSACTION_MANUAL_REVIEW_REQUIRED/);
  }
});
test('empty, forbidden, unavailable or paginated reporting never means unpaid',async()=>{
  const {store}=fixture();
  for(const call of [async()=>({transaction_details:[]}),async()=>{throw Error('PAYPAL_REPORTING_FORBIDDEN');},async()=>{throw Error('network');},async()=>({transaction_details:[],total_pages:2})])await assert.rejects(resolveTransaction({transactionId:buyer},store,call,'MERCHANT'),/TRANSACTION_MANUAL_REVIEW_REQUIRED/);
});
test('manual association requires an explicit seller capture and administrator confirmation',async()=>{
  const {store}=fixture();const noCall=async()=>{throw Error('unexpected API');};
  await assert.rejects(resolveTransaction({transactionId:buyer,manualCaptureId:seller},store,noCall,'MERCHANT'),/TRANSACTION_MANUAL_REVIEW_REQUIRED/);
  assert.equal((await resolveTransaction({transactionId:buyer,manualCaptureId:seller,manualVerified:true},store,noCall,'MERCHANT')).matchMethod,'manual_paypal_dashboard');
});
test('email only narrows a chosen candidate; it cannot override a known exact transaction match',()=>{
  assert.equal(selectedEmailOrder(order,'contact@example.com',undefined).matchMethod,'email_candidate');
  assert.equal(selectedEmailOrder(order,undefined,'payer@example.com').id,'order');
  assert.throws(()=>selectedEmailOrder(order,'wrong@example.com',undefined),/ORDER_SELECTION_INVALID/);
  assert.throws(()=>selectedEmailOrder(order,'contact@example.com',undefined,{...order,id:'other'}),/ORDER_SELECTION_INVALID/);
});
test('probe needs a working seller positive control and never generalizes empty/denied responses',async()=>{
  const args={buyerId:buyer,sellerId:seller,providerOrderId:'provider',merchantId:'MERCHANT'};
  const {row}=fixture();
  const good=async(path:string)=>({transaction_details:[{transaction_info:{...row.transaction_info,transaction_id:path.includes(buyer)?buyer:seller}}]});
  assert.equal((await probeTransactionPair(args,good)).conclusion,'buyer_match_observed');
  assert.equal((await probeTransactionPair(args,async()=>({transaction_details:[]}))).conclusion,'inconclusive');
  assert.equal((await probeTransactionPair(args,async()=>{throw Error('PAYPAL_REPORTING_FORBIDDEN');})).conclusion,'reporting_permission_required');
  assert.equal((await probeTransactionPair(args,async path=>path.includes(buyer)?{transaction_details:[]}:good(path))).conclusion,'buyer_not_matched_in_this_test');
});
test('reporting dates respect the documented 31-day maximum and reject invalid dates',()=>{
  const window=reportingWindow(undefined);assert.ok(Date.parse(window.end)-Date.parse(window.start)<=31*86400000);
  assert.throws(()=>reportingWindow('2026-02-30'),/INVALID_PAYMENT_DATE/);
});
