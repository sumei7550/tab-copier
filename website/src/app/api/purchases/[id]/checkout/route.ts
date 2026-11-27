import { ApiError, appUrl, bearer, hash, rateLimit, route, rpc, token, uuid } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async (req, context) => {
  await rateLimit(req,'resume-checkout',15);
  const {id}=await context.params;if(!uuid(id))throw new ApiError('INVALID_PURCHASE');
  const ticket=token();
  const result=await rpc('resume_checkout',{p_purchase:id,p_poll:hash(bearer(req)),p_ticket:hash(ticket)});
  return result.status==='paid'?result:{...result,checkoutUrl:`${appUrl()}/checkout#ticket=${ticket}`};
});
