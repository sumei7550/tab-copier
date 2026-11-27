import { ApiError, body, db, hash, rateLimit, route, token, uuid } from '@/lib/server';
export const runtime = 'nodejs';
export const POST = route(async req => {
  await rateLimit(req, 'recovery-create', 5);
  const { installationId } = await body(req);
  if (!uuid(installationId)) throw new ApiError('INVALID_INSTALLATION');
  const secret = token();
  const { data, error } = await db().from('recovery_sessions').insert({ installation_id: installationId, secret_hash: hash(secret) }).select('id,expires_at').single();
  if (error) throw new ApiError('STORAGE_UNAVAILABLE', 503);
  return { recoveryId: data.id, recoverySecret: secret, expiresAt: data.expires_at };
});
