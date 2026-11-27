import {price,isPlan} from './plans.ts';
export type MatchMethod='seller_transaction'|'saved_buyer_transaction'|'paypal_reporting'|'manual_paypal_dashboard'|'email_candidate';
export class TransactionLookupRequired extends Error{
  reason:string;
  constructor(reason:string){super('TRANSACTION_MANUAL_REVIEW_REQUIRED');this.reason=reason;}
}
export class OrderChoicesRequired extends Error{
  candidates:LookupOrder[];reason:string;
  constructor(candidates:LookupOrder[],reason:string){super('ORDER_SELECTION_REQUIRED');this.candidates=candidates;this.reason=reason;}
}
export type LookupOrder={id:string;provider_order_id:string;provider_capture_id:string;plan:string;status:string;purchase_email:string|null;paypal_payer_email?:string|null;paid_at:string|null;matchMethod?:MatchMethod};
export type LookupStore={byCapture:(id:string)=>Promise<LookupOrder|null>;byAlias:(id:string)=>Promise<LookupOrder|null>;byProviderOrder:(id:string)=>Promise<LookupOrder|null>};
export function selectedEmailOrder(order:LookupOrder|null,email:string|undefined,paypalEmail:string|undefined,knownTransactionOrder:LookupOrder|null=null){
  if(!order||!((email&&order.purchase_email?.toLowerCase()===email)||(paypalEmail&&order.paypal_payer_email?.toLowerCase()===paypalEmail))||(knownTransactionOrder&&knownTransactionOrder.id!==order.id))throw Error('ORDER_SELECTION_INVALID');
  return {...order,matchMethod:'email_candidate' as const};
}
export function reportingWindow(date:string|undefined,now=Date.now()){
  if(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('INVALID_PAYMENT_DATE');
    const day=Date.parse(date+'T00:00:00Z');
    if(!Number.isFinite(day)||new Date(day).toISOString().slice(0,10)!==date||day>now+86_400_000||day<now-3*366*86_400_000)throw Error('INVALID_PAYMENT_DATE');
    return {start:new Date(day-86_400_000).toISOString(),end:new Date(Math.min(day+2*86_400_000,now)).toISOString()};
  }
  return {start:new Date(now-30*86_400_000).toISOString(),end:new Date(now).toISOString()};
}
export async function reportingQuery(transactionId:string,date:string|undefined,call:(path:string)=>Promise<any>){
  if(!/^[A-Z0-9]{17,19}$/.test(transactionId))throw new TransactionLookupRequired('invalid_reporting_id');
  const window=reportingWindow(date);
  const params=new URLSearchParams({transaction_id:transactionId,start_date:window.start,end_date:window.end,fields:'transaction_info',balance_affecting_records_only:'N',page_size:'100',page:'1'});
  try{
    const response=await call('/v1/reporting/transactions?'+params);
    if(!Array.isArray(response.transaction_details)||Number(response.total_pages??1)>1)throw new TransactionLookupRequired('ambiguous_response');
    return response.transaction_details;
  }catch(e){
    if(e instanceof TransactionLookupRequired)throw e;
    const code=e instanceof Error?e.message:'';
    throw new TransactionLookupRequired(code==='PAYPAL_REPORTING_FORBIDDEN'?'reporting_permission_denied':'reporting_unavailable');
  }
}
export async function resolveTransaction({transactionId,paymentDate,manualCaptureId,manualVerified}:{transactionId:string;paymentDate?:string;manualCaptureId?:string;manualVerified?:boolean},store:LookupStore,call:(path:string)=>Promise<any>,merchantId:string){
  const direct=await store.byCapture(transactionId);
  if(direct)return {...direct,matchMethod:'seller_transaction' as const};
  const saved=await store.byAlias(transactionId);
  if(saved)return {...saved,matchMethod:'saved_buyer_transaction' as const};
  if(manualCaptureId){
    if(!manualVerified||manualCaptureId===transactionId)throw new TransactionLookupRequired('manual_verification_required');
    const manual=await store.byCapture(manualCaptureId);
    if(!manual)throw new TransactionLookupRequired('manual_capture_not_found');
    return {...manual,matchMethod:'manual_paypal_dashboard' as const};
  }
  const records=await reportingQuery(transactionId,paymentDate,call);
  const candidates=new Map<string,LookupOrder>();
  for(const record of records){
    const info=record?.transaction_info;
    // A returned reference is not automatically the other side's ID. Require an exact
    // requested ID, seller account, successful credit and an explicit order relationship.
    if(info?.transaction_id!==transactionId||info.paypal_account_id!==merchantId||info.transaction_status!=='S'||!/^T00\d{2}$/.test(info.transaction_event_code??''))continue;
    const order=await store.byCapture(info.transaction_id)|| (info.paypal_reference_id_type==='ODR'&&typeof info.paypal_reference_id==='string'?await store.byProviderOrder(info.paypal_reference_id):null);
    if(!order||!isPlan(order.plan)||info.transaction_amount?.currency_code!=='USD'||info.transaction_amount?.value!==price(order.plan))continue;
    candidates.set(order.id,order);
  }
  if(candidates.size!==1)throw new TransactionLookupRequired(candidates.size?'ambiguous_match':'no_verified_api_match');
  return {...[...candidates.values()][0],matchMethod:'paypal_reporting' as const};
}
