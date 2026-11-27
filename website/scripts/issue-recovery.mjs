// Operator-only script. Requires private sandbox service credentials, never bundle for browsers.
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { verifiedCapture } from '../src/lib/payment-validation.ts';
const env = name => { if (!process.env[name]) throw new Error(`缺少 ${name}`); return process.env[name]; };
const args = process.argv.slice(2);
const arg = name => { const i = args.indexOf(name); return i < 0 ? '' : args[i + 1]; };
async function main() {
  if (env('PAYPAL_ENV') !== 'sandbox') throw new Error('此工具仅允许沙盒');
  if (!args.includes('--ownership-verified')) throw new Error('先人工核实购买归属，再使用 --ownership-verified。邮箱/交易号/截图本身不构成证明。');
  const installationId = arg('--support-id')?.replace(/^TC-/i, ''), captureId = arg('--capture-id'), note = arg('--note');
  if (!/^[0-9a-f-]{36}$/i.test(installationId || '') || !/^[A-Z0-9]+$/.test(captureId) || !note || note.length > 500) throw new Error('需提供 --support-id TC-UUID --capture-id PayPal收款交易号 --note 非敏感核查备注');
  const store = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sessions, error: sessionError } = await store.from('recovery_sessions').select('id').eq('installation_id', installationId).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1);
  if (sessionError || !sessions?.length) throw new Error('此序列号尚无有效恢复会话，请让用户在插件点击“恢复购买”后重试；普通反馈无需恢复会话。');
  const recoveryId = sessions[0].id;
  const { data: order, error } = await store.from('orders').select('id,provider_order_id,plan,status').eq('provider_capture_id', captureId).eq('environment', 'sandbox').single();
  if (error || order.status !== 'paid') throw new Error('未找到有效已付款订单，不能恢复');
  const auth = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', { method: 'POST', headers: {
    Authorization: `Basic ${Buffer.from(`${env('PAYPAL_CLIENT_ID')}:${env('PAYPAL_CLIENT_SECRET')}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(15_000) });
  if (!auth.ok) throw new Error('无法验证 PayPal 身份，未签发链接');
  const { access_token } = await auth.json();
  const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(order.provider_order_id)}`, { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error('无法向 PayPal 核实交易，未签发链接');
  const capture = verifiedCapture(await response.json(), order, env('PAYPAL_MERCHANT_ID'));
  if (capture.captureId !== captureId) throw new Error('交易关联不符，未签发链接');
  const app = new URL(env('APP_URL'));
  if (app.protocol !== 'https:' && !(app.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(app.hostname))) throw new Error('APP_URL 配置无效');
  const ticket = randomBytes(32).toString('base64url');
  const { data: expiresAt, error: issueError } = await store.rpc('issue_recovery', { p_session: recoveryId, p_order: order.id,
    p_ticket: createHash('sha256').update(ticket).digest('hex'), p_note: note });
  if (issueError) throw new Error('恢复请求已失效、授权不可恢复或数据库拒绝操作；未输出链接');
  console.log('请仅手动发送给已核实的购买者，不要保存到公共日志。');
  console.log(`有效至：${expiresAt}`);
  console.log(`${app.origin}/recovery#ticket=${ticket}`);
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
