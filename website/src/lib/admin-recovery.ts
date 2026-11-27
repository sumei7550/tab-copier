import 'server-only';
import {ApiError,db,env,uuid} from './server';
import {paypalClient} from './paypal';
import {RecoveryError,recoveryInput,reviewRecovery,type RecoveryStore} from './recovery-review';
import {resolveTransaction,selectedEmailOrder,TransactionLookupRequired,OrderChoicesRequired,type LookupStore,type LookupOrder} from './transaction-lookup';

export async function adminReview(input:unknown){
  const store=db();
  const fields='id,provider_order_id,provider_capture_id,plan,status,purchase_email,paypal_payer_email,paid_at';
  const supplied=input as any;
  const call=paypalClient(),merchant=env('PAYPAL_MERCHANT_ID');
  async function findOrder(column:string,value:string){
    const {data,error}=await store.from('orders').select(fields).eq(column,value).eq('environment','sandbox').maybeSingle();
    if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);return data;
  }
  const lookup:LookupStore={
    byCapture:id=>findOrder('provider_capture_id',id),
    byProviderOrder:id=>findOrder('provider_order_id',id),
    async byAlias(id){
      const {data,error}=await store.from('paypal_transaction_aliases').select('order_id').eq('transaction_id',id).maybeSingle();
      if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);
      return data?findOrder('id',data.order_id):null;
    }
  };
  const repository:RecoveryStore={
    async session(installation){
      const {data,error}=await store.from('recovery_sessions').select('id,installation_id,expires_at').eq('installation_id',installation).gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);return data;
    },
    async order(capture){
      const normalized=recoveryInput(supplied);
      if(supplied?.selectedOrderId){
        if(!uuid(supplied.selectedOrderId))throw new ApiError('INVALID_RECOVERY_INPUT');
        const selected=await findOrder('id',supplied.selectedOrderId);
        const known=capture?(await lookup.byCapture(capture)||await lookup.byAlias(capture)):null;
        try{return selectedEmailOrder(selected,normalized.email,normalized.paypalEmail,known);}catch{throw new ApiError('ORDER_SELECTION_INVALID',409);}
      }
      const manualCaptureId=typeof supplied?.manualCaptureId==='string'?supplied.manualCaptureId.trim().toUpperCase():undefined;
      if(manualCaptureId&&!/^[A-Z0-9]{5,64}$/.test(manualCaptureId))throw new ApiError('INVALID_RECOVERY_INPUT');
      let reason='email_lookup';
      if(capture){try{return await resolveTransaction({transactionId:capture,paymentDate:typeof supplied?.paymentDate==='string'&&supplied.paymentDate?supplied.paymentDate:undefined,manualCaptureId,manualVerified:supplied?.manualVerified===true},lookup,call,merchant);}catch(e){if(!(e instanceof TransactionLookupRequired))throw e;reason=e.reason;}}
      const candidates=new Map<string,LookupOrder>();
      for(const [column,value] of [['purchase_email',normalized.email],['paypal_payer_email',normalized.paypalEmail]] as const){
        if(!value)continue;
        const {data,error}=await store.from('orders').select(fields).eq(column,value).eq('environment','sandbox').eq('status','paid').order('paid_at',{ascending:false}).limit(20);
        if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);
        for(const row of data??[])candidates.set(row.id,row);
      }
      if(candidates.size)throw new OrderChoicesRequired([...candidates.values()],reason);
      throw new TransactionLookupRequired(capture?reason:'no_email_candidates');
    },
    async license(order){
      const {data,error}=await store.from('licenses').select('id,expires_at,revoked_at').eq('order_id',order).maybeSingle();
      if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);return data;
    }
  };
  try{
    recoveryInput(input);
    const reviewed=await reviewRecovery(input,repository,id=>call(`/v2/checkout/orders/${encodeURIComponent(id)}`),merchant);
    // Backfill historical PayPal email only after independent provider verification.
    if(reviewed.paypalPayerEmail){
      const {error}=await store.from('orders').update({paypal_payer_email:reviewed.paypalPayerEmail}).eq('id',reviewed.orderId).eq('status','paid').is('paypal_payer_email',null);
      if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);
    }
    return reviewed;
  }
  catch(e){if(e instanceof TransactionLookupRequired||e instanceof OrderChoicesRequired)throw e;if(e instanceof RecoveryError)throw new ApiError(e.message,409);if(e instanceof Error&&e.message==='INVALID_PAYMENT_DATE')throw new ApiError('INVALID_PAYMENT_DATE');throw e;}
}
