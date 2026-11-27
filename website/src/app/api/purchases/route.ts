import { randomUUID } from 'node:crypto';
import { ApiError, appUrl, body, db, hash, rateLimit, route, token, uuid } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async req => {
  await rateLimit(req, 'purchase', 10);
  const { installationId } = await body(req);
  if (!uuid(installationId)) throw new ApiError('INVALID_INSTALLATION');
  const id = randomUUID(), pollToken = token(), ticket = token();
  const { error } = await db().from('purchase_sessions').insert({ id, installation_id: installationId, poll_hash: hash(pollToken), ticket_hash: hash(ticket) });
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  return { purchaseId: id, pollToken, checkoutUrl: `${appUrl()}/checkout#ticket=${ticket}` };
});
