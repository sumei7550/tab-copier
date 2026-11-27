import { ApiError, bearer, body, entitlement, hash, rateLimit, refreshToken, route, rpc, uuid, env, signingKey } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async (req, context) => {
  await rateLimit(req, 'activate', 20);
  // Validate signing configuration before first activation consumes the subscription time.
  signingKey(); env('ENTITLEMENT_KEY_ID');
  const { id } = await context.params, { installationId } = await body(req), poll = bearer(req);
  if (!uuid(id) || !uuid(installationId)) throw new ApiError('INVALID_INSTALLATION');
  const refresh = refreshToken(id, poll);
  const row = await rpc('activate_purchase', { p_purchase: id, p_poll: hash(poll), p_installation: installationId, p_refresh: hash(refresh) });
  return { refreshToken: refresh, entitlement: entitlement(row) };
});
