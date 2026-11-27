import 'server-only';
import {ApiError,db,env} from './server';
import {paypal} from './paypal';
import {RecoveryError,reviewRecovery,type RecoveryStore} from './recovery-review';

export async function adminReview(input:unknown){
  const store=db();
  const repository:RecoveryStore={
    async session(installation){
      const {data,error}=await store.from('recovery_sessions').select('id,installation_id,expires_at').eq('installation_id',installation).gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);return data;
    },
    async order(capture){
      const {data,error}=await store.from('orders').select('id,provider_order_id,provider_capture_id,plan,status,purchase_email,paid_at').eq('provider_capture_id',capture).eq('environment','sandbox').maybeSingle();
      if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);return data;
    },
    async license(order){
      const {data,error}=await store.from('licenses').select('id,expires_at,revoked_at').eq('order_id',order).maybeSingle();
      if(error)throw new ApiError('STORAGE_UNAVAILABLE',503);return data;
    }
  };
  try{return await reviewRecovery(input,repository,id=>paypal(`/v2/checkout/orders/${encodeURIComponent(id)}`),env('PAYPAL_MERCHANT_ID'));}
  catch(e){if(e instanceof RecoveryError)throw new ApiError(e.message,409);throw e;}
}
