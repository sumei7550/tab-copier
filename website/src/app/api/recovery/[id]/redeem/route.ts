import { ApiError, bearer, body, entitlement, env, hash, rateLimit, refreshToken, route, rpc, signingKey, uuid } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async (req, context) => {
  await rateLimit(req, 'recovery-redeem', 20);
  signingKey(); env('ENTITLEMENT_KEY_ID');
  const { id } = await context.params, { installationId } = await body(req), secret = bearer(req);
  if (!uuid(id) || !uuid(installationId)) throw new ApiError('INVALID_INSTALLATION');
  const refresh = refreshToken(`recovery:${id}`, secret);
  const row = await rpc('redeem_recovery', { p_session: id, p_secret: hash(secret), p_installation: installationId, p_refresh: hash(refresh) });
  return { refreshToken: refresh, entitlement: entitlement(row) };
});
