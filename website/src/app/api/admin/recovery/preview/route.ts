import {adminConfig,adminRoute} from '@/lib/admin';
import {adminToken} from '@/lib/admin-security';
import {adminReview} from '@/lib/admin-recovery';
import {reviewScope} from '@/lib/recovery-review';
import {body,rateLimit} from '@/lib/server';
export const runtime='nodejs';
export const POST=adminRoute(async req=>{
  await rateLimit(req,'admin-recovery-preview',10);
  const review=await adminReview(await body(req));
  return {...review,previewToken:adminToken('recovery-preview',reviewScope(review),adminConfig(),300)};
});
