// Shared by the sandbox harness and security tests. The production extension must pin its own public key.
function bytes(s) { return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
export async function verifyEntitlement(envelope, publicKey, now = Date.now()) {
  if (!envelope || typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string' || !publicKey) throw new Error('授权格式或公钥无效');
  const der = publicKey.replace(/-----[^-]+-----|\s/g, '');
  const key = await crypto.subtle.importKey('spki', bytes(der), 'Ed25519', false, ['verify']);
  if (!await crypto.subtle.verify('Ed25519', key, bytes(envelope.signature), new TextEncoder().encode(envelope.payload))) throw new Error('授权签名无效');
  const c = JSON.parse(new TextDecoder().decode(bytes(envelope.payload)));
  const issued = Date.parse(c.issuedAt), offline = Date.parse(c.offlineUntil), expires = c.expiresAt === null ? null : Date.parse(c.expiresAt);
  if (c.environment !== 'sandbox' || !Number.isFinite(issued) || !Number.isFinite(offline) ||
      (expires !== null && !Number.isFinite(expires)) || issued > now + 300_000 ||
      offline <= now || offline <= issued || offline > issued + 72 * 3_600_000 ||
      (expires !== null && (expires <= now || offline > expires)) ||
      !['trial', 'month', 'lifetime'].includes(c.plan) ||
      (c.plan !== 'lifetime' && expires === null) ||
      typeof c.activationId !== 'string' || typeof c.licenseId !== 'string' || !Array.isArray(c.features)) throw new Error('授权已到期、环境不符或时间边界无效');
  return c;
}
