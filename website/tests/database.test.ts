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
  for (const file of ['001_sandbox.sql', '002_manual_recovery.sql']) {
    await db.exec(await readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8'));
  }
});
after(async () => { await db.close(); });
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
  } finally { await db.exec('reset role'); }
});
