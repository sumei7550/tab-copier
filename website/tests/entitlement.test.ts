import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { verifyEntitlement } from '../../extension/verify.mjs';
const keys = generateKeyPairSync('ed25519');
const pem = keys.publicKey.export({ format: 'pem', type: 'spki' }).toString();
const now = Date.now();
function claims() { return { activationId: 'activation', licenseId: 'license', environment: 'sandbox', plan: 'trial', features: ['unlimited'], issuedAt: new Date(now).toISOString(), offlineUntil: new Date(now + 3600_000).toISOString(), expiresAt: new Date(now + 72 * 3600_000).toISOString() }; }
function envelope(c: Record<string, unknown>) { const payload = Buffer.from(JSON.stringify(c)).toString('base64url'); return { payload, signature: sign(null, Buffer.from(payload), keys.privateKey).toString('base64url') }; }
test('accept a valid sandbox signed entitlement', async () => {
  assert.equal((await verifyEntitlement(envelope(claims()), pem, now)).plan, 'trial');
});
test('reject altered payload or signature, even when payload appears active', async () => {
  const p = envelope(claims()); p.payload = Buffer.from(JSON.stringify({ ...claims(), plan: 'lifetime' })).toString('base64url');
  await assert.rejects(verifyEntitlement(p, pem, now));
  const q = envelope(claims()); q.signature = Buffer.alloc(64).toString('base64url');
  await assert.rejects(verifyEntitlement(q, pem, now));
});
test('reject a signature from another key', async () => {
  const other = generateKeyPairSync('ed25519').publicKey.export({ format: 'pem', type: 'spki' }).toString();
  await assert.rejects(verifyEntitlement(envelope(claims()), other, now));
});
test('reject live credentials, expired cache and invalid dates', async () => {
  for (const patch of [{ environment: 'live' }, { offlineUntil: new Date(now).toISOString() }, { expiresAt: new Date(now - 1).toISOString() }, { offlineUntil: 'invalid' }, { issuedAt: new Date(now + 600_000).toISOString() }]) {
    await assert.rejects(verifyEntitlement(envelope({ ...claims(), ...patch }), pem, now));
  }
});
test('offline use never exceeds package validity or 72 hours', async () => {
  await assert.rejects(verifyEntitlement(envelope({ ...claims(), offlineUntil: new Date(now + 73 * 3600_000).toISOString() }), pem, now));
  await assert.rejects(verifyEntitlement(envelope({ ...claims(), expiresAt: new Date(now + 60_000).toISOString() }), pem, now));
  await assert.rejects(verifyEntitlement(envelope({ ...claims(), expiresAt: null }), pem, now));
  assert.equal((await verifyEntitlement(envelope({ ...claims(), plan: 'lifetime', expiresAt: null }), pem, now)).expiresAt, null);
});
