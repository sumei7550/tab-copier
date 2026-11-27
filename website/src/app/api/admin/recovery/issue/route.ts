import {adminConfig,adminRoute} from '@/lib/admin';
import {checkAdminToken} from '@/lib/admin-security';
import {adminReview} from '@/lib/admin-recovery';
import {reviewScope} from '@/lib/recovery-review';
import {ApiError,appUrl,body,hash,rateLimit,rpc,token} from '@/lib/server';
export const runtime='nodejs';
export const POST=adminRoute(async req=>{
  await rateLimit(req,'admin-recovery-issue',5);
  const input=await body(req);
  if(input.ownershipVerified!==true||typeof input.note!=='string'||input.note.trim().length<8||input.note.length>300)throw new ApiError('OWNERSHIP_CHECK_REQUIRED');
  // Recheck payment, request and license immediately before issuing, including refunds since preview.
  const review=await adminReview(input);
  if(!checkAdminToken(input.previewToken,'recovery-preview',reviewScope(review),adminConfig()))throw new ApiError('PREVIEW_EXPIRED',409);
  const ticket=token();
  const expiresAt=await rpc('issue_recovery',{p_session:review.sessionId,p_order:review.orderId,p_ticket:hash(ticket),p_note:`Admin page; ${review.supportId}; ${input.note.trim()}`});
  return {recoveryUrl:`${appUrl()}/recovery#ticket=${ticket}`,expiresAt,supportId:review.supportId};
});
