import {adminConfig,adminRoute} from '@/lib/admin';
import {adminToken} from '@/lib/admin-security';
import {adminReview} from '@/lib/admin-recovery';
import {reviewScope} from '@/lib/recovery-review';
import {body,rateLimit} from '@/lib/server';
import {TransactionLookupRequired,OrderChoicesRequired} from '@/lib/transaction-lookup';
export const runtime='nodejs';
export const maxDuration=120;
export const POST=adminRoute(async req=>{
  await rateLimit(req,'admin-recovery-preview',10);
  try{
    const review=await adminReview(await body(req));
    return {...review,lookupStatus:'matched',previewToken:adminToken('recovery-preview',reviewScope(review),adminConfig(),300)};
  }catch(e){if(e instanceof OrderChoicesRequired)return {lookupStatus:'order_selection_required',candidates:e.candidates,reason:e.reason};if(e instanceof TransactionLookupRequired)return {lookupStatus:'manual_review_required',reason:e.reason};throw e;}
});
