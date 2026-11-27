import {adminRoute} from '@/lib/admin';
import {adminReview} from '@/lib/admin-recovery';
import {paypalClient} from '@/lib/paypal';
import {probeTransactionPair} from '@/lib/paypal-probe';
import {ApiError,body,db,env,rateLimit} from '@/lib/server';
export const runtime='nodejs';
export const maxDuration=120;
export const POST=adminRoute(async req=>{
  await rateLimit(req,'admin-paypal-probe',3);
  const input=await body(req);
  if(typeof input.transactionId!=='string'||typeof input.manualCaptureId!=='string')throw new ApiError('INVALID_RECOVERY_INPUT');
  const buyerId=input.transactionId.trim().toUpperCase(),sellerId=input.manualCaptureId.trim().toUpperCase();
  if(!/^[A-Z0-9]{17,19}$/.test(buyerId)||!/^[A-Z0-9]{17,19}$/.test(sellerId)||buyerId===sellerId)throw new ApiError('INVALID_PROBE_PAIR');
  // Positive control must be an independently verified completed payment in our database.
  const review=await adminReview({supportId:input.supportId,transactionId:sellerId});
  const client=paypalClient();
  return {...await probeTransactionPair({buyerId,sellerId,providerOrderId:await providerOrder(review.orderId),merchantId:env('PAYPAL_MERCHANT_ID'),paymentDate:review.paidAt?.slice(0,10)},client),checkedAt:new Date().toISOString()};
});
async function providerOrder(id:string){
  const {data,error}=await db().from('orders').select('provider_order_id').eq('id',id).single();
  if(error||!data?.provider_order_id)throw new ApiError('STORAGE_UNAVAILABLE',503);
  return data.provider_order_id as string;
}
