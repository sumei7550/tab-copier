import { ApiError, bearer, body, entitlement, hash, rateLimit, route, rpc, uuid } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async req => {
  await rateLimit(req, 'refresh', 30);
  const { installationId } = await body(req);
  if (!uuid(installationId)) throw new ApiError('INVALID_INSTALLATION');
  const row = await rpc('refresh_activation', { p_refresh: hash(bearer(req)), p_installation: installationId });
  return { entitlement: entitlement(row) };
});
