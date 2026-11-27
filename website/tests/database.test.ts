import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

// Actual PostgreSQL/WASM, isolated in-memory. No Supabase or PayPal credentials used.
// This proves SQL/function behavior, not remote PostgREST settings or multi-connection races.
const db = new PGlite({ extensions: { pgcrypto } });
before(async () => {
  await db.exec('create role anon; create role authenticated; create role service_role;');
  for (const file of ['001_sandbox.sql', '002_manual_recovery.sql', '003_resume_checkout.sql','004_purchase_contact.sql','005_transaction_aliases.sql']) {
    await db.exec(await readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'));
  }
});
after(async () => { await db.close(); });
test('verified buyer aliases are idempotent, cannot be rebound and never bypass payment state',async()=>{
  const a=await seed(),b=await seed();await paid(a);await paid(b);
  assert.equal(await call('record_transaction_alias',['BUYER123456789012',a.order.id,'manual_paypal_dashboard','Checked seller dashboard']),true);
  assert.equal(await call('record_transaction_alias',['BUYER123456789012',a.order.id,'manual_paypal_dashboard','Retry same binding']),true);
  await assert.rejects(call('record_transaction_alias',['BUYER123456789012',b.order.id,'manual_paypal_dashboard','Wrong order association']),/TRANSACTION_ALIAS_CONFLICT/);
  const captures=await db.query<{provider_capture_id:string}>('select provider_capture_id from orders where id=$1',[a.order.id]);
  await assert.rejects(call('record_transaction_alias',[captures.rows[0].provider_capture_id,b.order.id,'manual_paypal_dashboard','Wrong capture association']),/TRANSACTION_ALIAS_CONFLICT/);
  const unpaid=await seed();await assert.rejects(call('record_transaction_alias',['BUYER999999999999',unpaid.order.id,'manual_paypal_dashboard','Unpaid must fail']),/NOT_PAID/);
  await db.exec('set role anon');try{await assert.rejects(db.query('select * from paypal_transaction_aliases'),/permission denied/);await assert.rejects(call('record_transaction_alias',['BUYER123456789012',a.order.id,'manual_paypal_dashboard','Anonymous must fail']),/permission denied/);}finally{await db.exec('reset role');}
});
test('verified capture stores PayPal email separately and retry never extends license',async()=>{
  const s=await seed();await call('record_capture',[s.order.id,s.capture,s.payer,'Payer@Example.com']);
  const first=await activate(s);await call('record_capture',[s.order.id,s.capture,s.payer,'Payer@Example.com']);const again=await activate(s);
  const r=await db.query<{paypal_payer_email:string;purchase_email:null}>('select paypal_payer_email,purchase_email from orders where id=$1',[s.order.id]);assert.equal(r.rows[0].paypal_payer_email,'payer@example.com');assert.equal(r.rows[0].purchase_email,null);assert.equal(first.expires_at,again.expires_at);
});
test('resume renews a single-use ticket while preserving the original order and poll credentials',async()=>{
  const s=await seed();
  const original=await db.query<{provider_order_id:string}>('select provider_order_id from orders where id=$1',[s.order.id]);
  await db.query("update purchase_sessions set created_at=now()-interval '2 days',ticket_created_at=now()-interval '2 days' where id=$1",[s.purchase]);
  await assert.rejects(call('resume_checkout',[s.purchase,'wrong','new-ticket']),/UNAUTHORIZED/);
  await call('resume_checkout',[s.purchase,s.poll,'new-ticket']);
  assert.equal(await call('exchange_checkout',['new-ticket','new-website']),s.purchase);
  await assert.rejects(call('exchange_checkout',['new-ticket','new-website']),/UNAUTHORIZED/);
  const order=await call('reserve_order',[s.purchase,'new-website','month',499]);
  assert.equal(order.id,s.order.id);assert.equal(order.provider_order_id,original.rows[0].provider_order_id);
  await paid(s);assert.equal((await call('resume_checkout',[s.purchase,s.poll,'unused'])).status,'paid');
});
async function call(name: string, params: unknown[]) {
  const r = await db.query<{ result: any }>(`select ${name}(${params.map((_, i) => '$' + (i + 1)).join(',')}) as result`, params);
  return r.rows[0].result;
}
async function seed(plan = 'month', payer = randomUUID()) {
  const installation = randomUUID(), purchase = randomUUID(), poll = randomUUID(), website = randomUUID();
  await db.query('insert into purchase_sessions(id,installation_id,poll_hash,ticket_hash,website_hash,ticket_used_at) values($1,$2,$3,$4,$5,now())', [purchase, installation, poll, randomUUID(), website]);
  const order = await call('reserve_order', [purchase, website, plan, plan === 'trial' ? 99 : plan === 'lifetime' ? 1200 : 499]);
  await db.query('update orders set provider_order_id=$2 where id=$1', [order.id, 'P' + randomUUID()]);
  return { installation, purchase, poll, order, payer, capture: 'C' + randomUUID(), refresh: randomUUID() };
}
async function paid(s: Awaited<ReturnType<typeof seed>>) { return call('record_capture', [s.order.id, s.capture, s.payer]); }
async function activate(s: Awaited<ReturnType<typeof seed>>) { return call('activate_purchase', [s.purchase, s.poll, s.installation, s.refresh]); }
async function recovery(s: Awaited<ReturnType<typeof seed>>) {
  const id = randomUUID(), installation = randomUUID(), secret = randomUUID(), ticket = randomUUID(), refresh = randomUUID();
  await db.query('insert into recovery_sessions(id,installation_id,secret_hash) values($1,$2,$3)', [id, installation, secret]);
  await call('issue_recovery', [id, s.order.id, ticket, 'Sandbox ownership checked']);
  return { id, installation, secret, ticket, refresh };
}

test('capture and activation retries create one license and preserve first expiry', async () => {
  const s = await seed(); await paid(s); await paid(s);
  const a = await activate(s), b = await activate(s);
  assert.equal(a.license_id, b.license_id); assert.equal(a.activation_id, b.activation_id); assert.equal(a.expires_at, b.expires_at);
  const r = await db.query<{ count: number }>('select count(*)::int count from licenses where order_id=$1', [s.order.id]);
  assert.equal(r.rows[0].count, 1);
});
test('unpaid orders and incorrect private purchase credentials cannot activate', async () => {
  const s = await seed(); await assert.rejects(activate(s), /NOT_PAID/); await paid(s);
  await assert.rejects(call('activate_purchase', [s.purchase, 'wrong', s.installation, s.refresh]), /UNAUTHORIZED/);
  await assert.rejects(call('activate_purchase', [s.purchase, s.poll, randomUUID(), s.refresh]), /UNAUTHORIZED/);
});
test('repeated trial from the same verified payer goes to review without entitlement', async () => {
  const payer = randomUUID(), a = await seed('trial', payer), b = await seed('trial', payer);
  assert.equal((await paid(a)).status, 'paid'); assert.equal((await paid(b)).status, 'review');
  await assert.rejects(activate(b), /NOT_PAID/);
});
test('refund revokes existing credentials and late success cannot restore them', async () => {
  const s = await seed(); await paid(s); await activate(s);
  const r = await db.query<{ provider_order_id: string }>('select provider_order_id from orders where id=$1', [s.order.id]);
  await call('revoke_order', [r.rows[0].provider_order_id, 'refunded']);
  await assert.rejects(call('refresh_activation', [s.refresh, s.installation]), /REVOKED/);
  await assert.rejects(paid(s), /REVOKED/);
});
test('manual recovery requires confirmation AND the requesting installation secret', async () => {
  const s = await seed(); await paid(s); const original = await activate(s); const r = await recovery(s);
  await assert.rejects(call('redeem_recovery', [r.id, r.secret, r.installation, r.refresh]), /RECOVERY_PENDING/);
  await call('confirm_recovery', [r.ticket]);
  await assert.rejects(call('redeem_recovery', [r.id, 'wrong', r.installation, r.refresh]), /UNAUTHORIZED/);
  await assert.rejects(call('redeem_recovery', [r.id, r.secret, s.installation, r.refresh]), /UNAUTHORIZED/);
  const restored = await call('redeem_recovery', [r.id, r.secret, r.installation, r.refresh]);
  assert.equal(restored.expires_at, original.expires_at);
  const retry = await call('redeem_recovery', [r.id, r.secret, r.installation, r.refresh]);
  assert.equal(retry.activation_id, restored.activation_id);
  await assert.rejects(call('refresh_activation', [s.refresh, s.installation]), /REVOKED/);
  await assert.rejects(call('confirm_recovery', [r.ticket]), /RECOVERY_USED/);
});
test('expired or superseded recovery tickets are rejected', async () => {
  const s = await seed(); await paid(s); await activate(s); const r = await recovery(s);
  const newTicket = randomUUID(); await call('issue_recovery', [r.id, s.order.id, newTicket, 'replacement']);
  await assert.rejects(call('confirm_recovery', [r.ticket]), /EXPIRED/);
  await db.query('update recovery_tokens set expires_at=now()-interval \'1 second\' where ticket_hash=$1', [newTicket]);
  await assert.rejects(call('confirm_recovery', [newTicket]), /EXPIRED/);
});
test('expired subscriptions cannot refresh or receive recovery links', async () => {
  const s = await seed(); await paid(s); const a = await activate(s);
  await db.query('update licenses set expires_at=now()-interval \'1 second\' where id=$1', [a.license_id]);
  await assert.rejects(call('refresh_activation', [s.refresh, s.installation]), /EXPIRED/);
  await assert.rejects(recovery(s), /EXPIRED/);
});
test('one-time checkout tickets cannot be replayed', async () => {
  const ticket = randomUUID();
  await db.query('insert into purchase_sessions(installation_id,poll_hash,ticket_hash) values($1,$2,$3)', [randomUUID(), randomUUID(), ticket]);
  await call('exchange_checkout', [ticket, randomUUID()]);
  await assert.rejects(call('exchange_checkout', [ticket, randomUUID()]), /UNAUTHORIZED/);
});
test('anonymous clients cannot read orders or execute operator recovery RPCs', async () => {
  await db.exec('set role anon');
  try {
    await assert.rejects(db.query('select * from orders'), /permission denied/);
    await assert.rejects(call('issue_recovery', [randomUUID(), randomUUID(), 'x', 'x']), /permission denied/);
    await assert.rejects(call('reserve_order',[randomUUID(),'x','trial',99,'buyer@example.com']),/permission denied/);
  } finally { await db.exec('reset role'); }
});

test('checkout stores contact email atomically and retries cannot replace the original address',async()=>{
  const installation=randomUUID(),purchase=randomUUID(),website=randomUUID();
  await db.query('insert into purchase_sessions(id,installation_id,poll_hash,ticket_hash,website_hash,ticket_used_at) values($1,$2,$3,$4,$5,now())',[purchase,installation,randomUUID(),randomUUID(),website]);
  await assert.rejects(call('reserve_order',[purchase,website,'trial',99,'invalid']),/INVALID_PURCHASE_EMAIL/);
  const order=await call('reserve_order',[purchase,website,'trial',99,'Buyer@Example.com']);
  assert.equal(order.purchase_email,'buyer@example.com');
  assert.equal((await call('reserve_order',[purchase,website,'trial',99,'buyer@example.com'])).id,order.id);
  await assert.rejects(call('reserve_order',[purchase,website,'trial',99,'other@example.com']),/PURCHASE_EMAIL_LOCKED/);
  await assert.rejects(call('reserve_order',[purchase,'wrong','trial',99,'buyer@example.com']),/UNAUTHORIZED/);
  const previous=await seed();
  const result=await db.query<{purchase_email:string|null}>('select purchase_email from orders where id=$1',[previous.order.id]);assert.equal(result.rows[0].purchase_email,null);
});
