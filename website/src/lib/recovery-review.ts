import {verifiedCapture} from './payment-validation.ts';
import {purchaseEmail} from './purchase-contact.ts';
import type {MatchMethod} from './transaction-lookup.ts';

export class RecoveryError extends Error{}
type Order={id:string;provider_order_id:string;provider_capture_id:string;plan:string;status:string;purchase_email:string|null;paypal_payer_email?:string|null;paid_at:string|null;matchMethod?:MatchMethod};
type Session={id:string;installation_id:string;expires_at:string};
type License={id:string;expires_at:string|null;revoked_at:string|null};
export type RecoveryStore={
  session:(installation:string)=>Promise<Session|null>;
  order:(capture:string)=>Promise<Order|null>;
  license:(order:string)=>Promise<License|null>;
};
export function recoveryInput(input:any){
  const supportId=typeof input?.supportId==='string'?input.supportId.trim():'';
  const raw=input?.transactionId??input?.captureId;
  const captureId=typeof raw==='string'?raw.trim().toUpperCase():'';
  let email:string|undefined;
  if(input?.email){try{email=purchaseEmail(input.email);}catch{throw new RecoveryError('INVALID_PURCHASE_EMAIL');}}
  let paypalEmail:string|undefined;
  if(input?.paypalEmail){try{paypalEmail=purchaseEmail(input.paypalEmail);}catch{throw new RecoveryError('INVALID_PURCHASE_EMAIL');}}
  if(!/^TC-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supportId)||(captureId&&!/^[A-Z0-9]{5,64}$/.test(captureId))||(!captureId&&!email&&!paypalEmail))throw new RecoveryError('INVALID_RECOVERY_INPUT');
  return {supportId:'TC-'+supportId.slice(3).toLowerCase(),installationId:supportId.slice(3).toLowerCase(),captureId,transactionId:captureId,email,paypalEmail};
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
  if(payment.captureId!==order.provider_capture_id)throw new RecoveryError('PAYMENT_MISMATCH');
  const paypalPayerEmail=payment.payerEmail??order.paypal_payer_email??null;
  return {...target,captureId:order.provider_capture_id,matchMethod:order.matchMethod??'seller_transaction',emailMatches:target.email&&order.purchase_email?target.email===order.purchase_email.toLowerCase():null,paypalEmailMatches:target.paypalEmail&&paypalPayerEmail?target.paypalEmail===paypalPayerEmail.toLowerCase():null,paypalPayerEmail,sessionId:session.id,orderId:order.id,licenseId:license.id,plan:order.plan,purchaseEmail:order.purchase_email,paidAt:order.paid_at,expiresAt:license.expires_at};
}
export function reviewScope(review:Awaited<ReturnType<typeof reviewRecovery>>){
  return JSON.stringify([review.sessionId,review.orderId,review.installationId,review.captureId,review.transactionId,review.matchMethod]);
}
