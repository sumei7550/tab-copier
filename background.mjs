import { config } from './extension/config.mjs';
import { defaults, rights, quotaState, localDay, reserveCopy, commitCopy, outputModel } from './extension/core.mjs';
import { verifyEntitlement } from './extension/verify.mjs';
let queue = Promise.resolve();
const serial = fn => { const run = queue.then(fn); queue = run.catch(() => {}); return run; };
async function api(path, data, credential) {
  const response = await fetch(config.apiBase + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: 'Bearer ' + credential } : {}) }, body: JSON.stringify(data), signal: AbortSignal.timeout(20_000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'SERVICE_UNAVAILABLE'); return result;
}
async function initialize() {
  const s = await chrome.storage.local.get(null), update = {};
  if (!s.installationId) update.installationId = crypto.randomUUID();
  if (!s.schema13) {
    for (const [k, v] of Object.entries(defaults)) if (s[k] === undefined) update[k] = k === 'scope' && s.allWindows ? 'all' : s.legacyOriginal && k === 'markdownStyle' ? 'bullet' : s.legacyOriginal && k === 'removeDuplicates' ? true : v;
    update.schema13 = true;
  }
  if (Object.keys(update).length) await chrome.storage.local.set(update);
}
async function verify(envelope) {
  if (!config.publicKey) throw new Error('PAYMENT_NOT_CONFIGURED');
  const claims = await verifyEntitlement(envelope, config.publicKey);
  if (claims.keyId !== config.keyId || claims.environment !== config.environment) throw new Error('UNTRUSTED_LICENSE');
  return claims;
}
async function state(refresh = false) {
  await initialize(); let s = await chrome.storage.local.get(null), networkIssue = false;
  if (refresh && s.refreshToken) {
    try {
      const r = await api('/api/licenses/refresh', { installationId: s.installationId }, s.refreshToken);
      await verify(r.entitlement); await chrome.storage.local.set({ entitlement: r.entitlement, lastLicenseCheck: Date.now() }); s = await chrome.storage.local.get(null);
    } catch (e) {
      if (['REVOKED', 'EXPIRED', 'UNAUTHORIZED'].includes(e.message)) {
        await chrome.storage.local.remove('entitlement'); s.entitlement = null;
      } else networkIssue = true;
    }
  }
  let claims = null;
  try { if (s.entitlement) claims = await verify(s.entitlement); } catch { /* No trusted active cached entitlement. */ }
  const access = rights(!!claims, !!s.legacyOriginal);
  const quota = quotaState(s.copyQuota, localDay(), Date.now());
  return { access, claims, networkIssue, remaining: Math.max(0, 3 - quota.used - quota.leases.length), settings: { ...defaults, ...Object.fromEntries(Object.keys(defaults).map(k => [k, s[k] ?? defaults[k]])) }, supportId: 'TC-' + s.installationId, paymentConfigured: !!config.publicKey };
}
async function checkPurchase() {
  const s = await chrome.storage.local.get(null);
  if (!s.purchaseId || !s.pollToken) return { status: 'not_created' };
  const order = await api(`/api/purchases/${s.purchaseId}/status`, {}, s.pollToken);
  if (order.status !== 'paid') return order;
  const r = await api(`/api/purchases/${s.purchaseId}/activate`, { installationId: s.installationId }, s.pollToken);
  await verify(r.entitlement);
  await chrome.storage.local.set({ refreshToken: r.refreshToken, entitlement: r.entitlement, lastLicenseCheck: Date.now() });
  await chrome.alarms.clear('purchase-check'); return { status: 'active' };
}
async function handle(message) {
  await initialize();
  if (message.type === 'state') {
    const s = await chrome.storage.local.get(['purchaseId', 'entitlement', 'lastLicenseCheck']);
    if (s.purchaseId && !s.entitlement) { try { await checkPurchase(); } catch { /* Keep pending credentials. */ } }
    return state(!s.lastLicenseCheck || Date.now() - s.lastLicenseCheck > 12 * 3_600_000);
  }
  if (message.type === 'buy') {
    if (!config.publicKey) throw new Error('PAYMENT_NOT_CONFIGURED');
    let s = await chrome.storage.local.get(null);
    if (s.refreshToken && (await state()).claims) throw new Error('ALREADY_ACTIVE');
    if (s.purchaseId && s.pollToken && !s.refreshToken) {
      const pending = await checkPurchase();
      if (pending.status === 'active') return { status: 'active' };
      throw new Error('PURCHASE_PENDING');
    }
    const p = await api('/api/purchases', { installationId: s.installationId });
    await chrome.storage.local.set({ purchaseId: p.purchaseId, pollToken: p.pollToken, purchaseStartedAt: Date.now() });
    await chrome.tabs.create({ url: p.checkoutUrl });
    await chrome.alarms.create('purchase-check', { delayInMinutes: 0.5, periodInMinutes: 0.5 });
    return { status: 'pending' };
  }
  if (message.type === 'checkPurchase') return checkPurchase();
  if (message.type === 'restore') {
    const s = await chrome.storage.local.get(null);
    if (s.refreshToken) { const current = await state(true); if (current.claims) return { status: 'active' }; if (current.networkIssue) throw new Error('SERVICE_UNAVAILABLE'); }
    if (s.recoveryId && s.recoverySecret && Date.parse(s.recoveryExpiresAt) > Date.now()) {
      try {
        const r = await api(`/api/recovery/${s.recoveryId}/redeem`, { installationId: s.installationId }, s.recoverySecret);
        await verify(r.entitlement); await chrome.storage.local.set({ refreshToken: r.refreshToken, entitlement: r.entitlement, lastLicenseCheck: Date.now() });
        await chrome.storage.local.remove(['purchaseId', 'pollToken']); return { status: 'active' };
      } catch (e) { if (e.message === 'RECOVERY_PENDING') return { status: 'contact' }; if (!['EXPIRED', 'REVOKED'].includes(e.message)) throw e; }
    }
    const r = await api('/api/recovery/requests', { installationId: s.installationId });
    await chrome.storage.local.set({ recoveryId: r.recoveryId, recoverySecret: r.recoverySecret, recoveryExpiresAt: r.expiresAt });
    return { status: 'contact' };
  }
  if (message.type === 'prepareCopy') {
    const current = await state(); const settings = { ...current.settings, scope: message.scope || current.settings.scope };
    if (settings.scope === 'group' && !current.access.groups) throw new Error('PRO_REQUIRED');
    const model = outputModel(message.tabs || [], settings, current.access, message.groupName || '');
    if (!model.items.length) throw new Error('EMPTY_SELECTION');
    const operation = crypto.randomUUID();
    if (!current.access.unlimited) {
      const s = await chrome.storage.local.get('copyQuota');
      await chrome.storage.local.set({ copyQuota: reserveCopy(s.copyQuota, localDay(), Date.now(), operation) });
    }
    return { text: model.text, count: model.items.length, operation, limited: !current.access.unlimited };
  }
  if (message.type === 'commitCopy' || message.type === 'releaseCopy') {
    const s = await chrome.storage.local.get('copyQuota');
    if (s.copyQuota) {
      const quota = message.type === 'commitCopy' ? commitCopy(s.copyQuota, message.operation) : { ...s.copyQuota, leases: s.copyQuota.leases.filter(l => l.id !== message.operation) };
      await chrome.storage.local.set({ copyQuota: quota });
    }
    return { ok: true };
  }
  throw new Error('UNKNOWN_ACTION');
}
chrome.runtime.onInstalled.addListener(details => { void serial(async () => {
  if (details.reason === 'update' && /^1\.[012]\./.test(details.previousVersion || '') && config.preserveOriginalOnUpgrade) await chrome.storage.local.set({ legacyOriginal: true });
  await initialize();
}); });
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(''))) return false;
  serial(() => handle(message)).then(result => sendResponse({ ok: true, result }), e => sendResponse({ ok: false, error: e.message })); return true;
});
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name !== 'purchase-check') return; void serial(async () => {
  const s = await chrome.storage.local.get('purchaseStartedAt');
  if (!s.purchaseStartedAt || Date.now() - s.purchaseStartedAt > 600_000) return chrome.alarms.clear('purchase-check');
  try { await checkPurchase(); } catch { /* Limited retry window; popup provides manual retry. */ }
}); });
