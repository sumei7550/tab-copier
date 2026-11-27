import {verifiedCapture} from './payment-validation.ts';

export class RecoveryError extends Error{}
type Order={id:string;provider_order_id:string;provider_capture_id:string;plan:string;status:string;purchase_email:string|null;paid_at:string|null};
type Session={id:string;installation_id:string;expires_at:string};
type License={id:string;expires_at:string|null;revoked_at:string|null};
export type RecoveryStore={
  session:(installation:string)=>Promise<Session|null>;
  order:(capture:string)=>Promise<Order|null>;
  license:(order:string)=>Promise<License|null>;
};
export function recoveryInput(input:any){
  const supportId=typeof input?.supportId==='string'?input.supportId.trim():'';
  const captureId=typeof input?.captureId==='string'?input.captureId.trim().toUpperCase():'';
  if(!/^TC-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supportId)||!/^[A-Z0-9]{5,64}$/.test(captureId))throw new RecoveryError('INVALID_RECOVERY_INPUT');
  return {supportId:'TC-'+supportId.slice(3).toLowerCase(),installationId:supportId.slice(3).toLowerCase(),captureId};
}
export async function reviewRecovery(input:unknown,store:RecoveryStore,provider:(id:string)=>Promise<unknown>,merchantId:string,now=Date.now()){
  const target=recoveryInput(input);
  const session=await store.session(target.installationId);
  if(!session||Date.parse(session.expires_at)<=now)throw new RecoveryError('RECOVERY_REQUEST_NOT_FOUND');
  const order=await store.order(target.captureId);
  if(!order)throw new RecoveryError('ORDER_NOT_FOUND');
  if(order.status!=='paid')throw new RecoveryError('NOT_PAID');
  const license=await store.license(order.id);
  if(!license||license.revoked_at)throw new RecoveryError('REVOKED');
  if(license.expires_at&&Date.parse(license.expires_at)<=now)throw new RecoveryError('EXPIRED');
  let payment;
  try{payment=verifiedCapture(await provider(order.provider_order_id),order,merchantId);}
  catch(e){if(e instanceof Error&&e.message==='PAYMENT_MISMATCH')throw new RecoveryError('PAYMENT_MISMATCH');throw e;}
  if(payment.captureId!==target.captureId)throw new RecoveryError('PAYMENT_MISMATCH');
  return {...target,sessionId:session.id,orderId:order.id,licenseId:license.id,plan:order.plan,purchaseEmail:order.purchase_email,paidAt:order.paid_at,expiresAt:license.expires_at};
}
export function reviewScope(review:Awaited<ReturnType<typeof reviewRecovery>>){
  return JSON.stringify([review.sessionId,review.orderId,review.installationId,review.captureId]);
}
