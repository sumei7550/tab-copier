import { ApiError, body, hash, rateLimit, route, rpc, websiteOrigin } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async req => {
  websiteOrigin(req); await rateLimit(req, 'recovery-confirm', 15);
  const { ticket } = await body(req);
  if (typeof ticket !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(ticket)) throw new ApiError('INVALID_TICKET');
  await rpc('confirm_recovery', { p_ticket: hash(ticket) });
  return { confirmed: true };
});
