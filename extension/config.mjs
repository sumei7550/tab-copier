// Development defaults. Pin the deployed API and trusted public key before any release.
export const config = Object.freeze({
  apiBase: 'http://localhost:3000', environment: 'sandbox', publicKey: '', keyId: 'sandbox-v1',
  // Provisional migration policy; confirm before publishing. New installs use free limits.
  preserveOriginalOnUpgrade: true,
});
