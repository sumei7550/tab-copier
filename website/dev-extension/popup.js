import { verifyEntitlement } from './entitlement.js';
const base = 'http://localhost:3000';
const $ = id => document.getElementById(id);
const show = s => { $('status').textContent = s; };
async function storage() {
  const s = await chrome.storage.local.get(null);
  if (!s.installationId) { s.installationId = crypto.randomUUID(); await chrome.storage.local.set({ installationId: s.installationId }); }
  return s;
}
async function api(path, data, credential) {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: 'Bearer ' + credential } : {}) }, body: JSON.stringify(data) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || '请求失败'); return result;
}
async function verify(envelope) {
  const { publicKey } = await storage(); if (!publicKey) throw new Error('请先保存沙盒签名公钥');
  return verifyEntitlement(envelope, publicKey);
}
function action(id, fn) { $(id).onclick = async () => { $(id).disabled = true; try { await fn(); } catch (e) { show('未成功：' + e.message + '\n保留原购买凭证，可重试；网络错误不代表未购买。'); } finally { $(id).disabled = false; } }; }
action('save', async () => { await chrome.storage.local.set({ publicKey: $('publicKey').value.trim() }); show('已保存沙盒公钥。'); });
action('buy', async () => {
  const s = await storage(); if (!s.publicKey) throw new Error('请先配置沙盒公钥');
  if (s.purchaseId && !s.refreshToken) throw new Error('已有购买会话，请先检查结果。需要新会话时在扩展管理中清理本调试扩展数据，不要重复付款。');
  const p = await api('/api/purchases', { installationId: s.installationId });
  await chrome.storage.local.set({ purchaseId: p.purchaseId, pollToken: p.pollToken });
  await chrome.tabs.create({ url: p.checkoutUrl }); show('购买页已打开。完成沙盒付款后返回此处检查。');
});
action('check', async () => {
  const s = await storage(); if (!s.purchaseId || !s.pollToken) throw new Error('没有本设备购买会话');
  const p = await api(`/api/purchases/${s.purchaseId}/status`, {}, s.pollToken);
  if (p.status !== 'paid') { show('订单状态：' + p.status + '\n待确认时请稍后再检查，不要重复付款。'); return; }
  const activated = await api(`/api/purchases/${s.purchaseId}/activate`, { installationId: s.installationId }, s.pollToken);
  const claims = await verify(activated.entitlement);
  await chrome.storage.local.set({ refreshToken: activated.refreshToken, entitlement: activated.entitlement });
  show('Pro 已自动激活 · ' + claims.plan + '\n到期时间：' + (claims.expiresAt || '买断，无套餐到期时间'));
});
action('refresh', async () => {
  const s = await storage(); if (!s.refreshToken) throw new Error('未找到本设备授权凭证，请联系客服人工恢复');
  const p = await api('/api/licenses/refresh', { installationId: s.installationId }, s.refreshToken);
  const claims = await verify(p.entitlement); await chrome.storage.local.set({ entitlement: p.entitlement });
  show('授权有效 · ' + claims.plan);
});
action('recoveryRequest', async () => {
  const s = await storage();
  if (s.refreshToken) {
    // Transport failures must not be treated as a missing purchase.
    const current = await api('/api/licenses/refresh', { installationId: s.installationId }, s.refreshToken);
    await verify(current.entitlement);
    await chrome.storage.local.set({ entitlement: current.entitlement }); show('本设备 Pro 权益已恢复。'); return;
  }
  if (s.recoveryId && s.recoverySecret && Date.parse(s.recoveryExpiresAt) > Date.now()) { show('请联系客服恢复购买。请在邮件中补充购买信息。'); return; }
  const result = await api('/api/recovery/requests', { installationId: s.installationId });
  await chrome.storage.local.set({ recoveryId: result.recoveryId, recoverySecret: result.recoverySecret, recoveryExpiresAt: result.expiresAt });
  show('已准备好恢复，请联系客服并提供购买信息。请在邮件中补充购买信息。');
});
async function supportTemplate() {
  const s = await storage();
  return '问题描述：\n\n参考编号：TC-' + s.installationId + '\n\n仅付款或恢复购买问题需补充：\n购买邮箱：\nPayPal 交易号：\n\n请勿提供密码或内部授权凭证。';
}
action('email', async () => {
  const body = await supportTemplate();
  const url = 'mailto:sumei7550@outlook.com?subject=' + encodeURIComponent('Tab Copier 客服支持') + '&body=' + encodeURIComponent(body);
  await chrome.tabs.create({ url });
  show('已请求打开邮件应用，请补充并自行发送。若未打开，请在网页邮箱联系 sumei7550@outlook.com。');
});
action('copyEmail', async () => { await navigator.clipboard.writeText('sumei7550@outlook.com'); show('支持邮箱已复制。'); });
action('copyTemplate', async () => { await navigator.clipboard.writeText(await supportTemplate()); show('邮件模板已复制，普通问题只需补充问题描述。'); });
action('recoveryRedeem', async () => {
  const s = await storage(); if (!s.recoveryId || !s.recoverySecret) throw new Error('请先点击恢复购买并联系支持');
  const result = await api(`/api/recovery/${s.recoveryId}/redeem`, { installationId: s.installationId }, s.recoverySecret);
  const claims = await verify(result.entitlement);
  await chrome.storage.local.set({ refreshToken: result.refreshToken, entitlement: result.entitlement });
  await chrome.storage.local.remove(['purchaseId', 'pollToken']);
  show('恢复成功 · ' + claims.plan + '\n原到期时间：' + (claims.expiresAt || '买断，无套餐到期时间'));
});
storage().then(s => { $('publicKey').value = s.publicKey || ''; show(s.refreshToken ? '本设备已保存授权，可刷新验证。' : s.purchaseId ? '已有购买会话，请检查结果。' : '尚未开始。'); });
