import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashAdminPassword,verifyAdminPassword,adminToken,checkAdminToken} from '../src/lib/admin-security.ts';
import {purchaseEmail} from '../src/lib/purchase-contact.ts';

const password='local-test-password-2026!',hash=hashAdminPassword(password);
const config={passwordHash:hash,secret:'test-only-derivation-secret-32-bytes-long',origin:'https://sandbox.example'};
test('admin login verifies salted scrypt hashes and rejects wrong, oversized or missing passwords',()=>{
  assert.ok(verifyAdminPassword(password,hash));assert.ok(!verifyAdminPassword(password+'x',hash));assert.ok(!verifyAdminPassword(undefined,hash));assert.ok(!verifyAdminPassword('x'.repeat(129),hash));assert.ok(!verifyAdminPassword(password,'plaintext'));
  assert.notEqual(hashAdminPassword(password),hash);assert.throws(()=>hashAdminPassword('weak'));
});
test('session rejects tampering, expiry, cross-purpose, changed password and another deployment',()=>{
  const now=1000,token=adminToken('session','admin',config,3600,now);
  assert.ok(checkAdminToken(token,'session','admin',config,now+1));
  assert.ok(!checkAdminToken(token,'session','admin',config,now+3_600_000));
  assert.ok(!checkAdminToken(token+'x','session','admin',config,now));
  assert.ok(!checkAdminToken(token,'recovery-preview','admin',config,now));
  assert.ok(!checkAdminToken(token,'session','admin',{...config,passwordHash:hashAdminPassword('another-test-password-2026')},now));
  assert.ok(!checkAdminToken(token,'session','admin',{...config,origin:'https://evil.example'},now));
  assert.ok(!checkAdminToken(undefined,'session','admin',config,now));
});
test('preview proof is short-lived and bound to exactly the reviewed order and target installation',()=>{
  const now=1000,token=adminToken('recovery-preview','order-a|install-a',config,300,now);
  assert.ok(checkAdminToken(token,'recovery-preview','order-a|install-a',config,now));
  assert.ok(!checkAdminToken(token,'recovery-preview','order-b|install-a',config,now));
  assert.ok(!checkAdminToken(token,'recovery-preview','order-a|install-b',config,now));
  assert.ok(!checkAdminToken(token,'recovery-preview','order-a|install-a',config,now+300_000));
});
test('purchase contact input is normalized and invalid addresses never enter order creation',()=>{
  assert.equal(purchaseEmail(' Buyer@Example.com '),'buyer@example.com');
  for(const value of [null,'','plain','a@b','a b@example.com','<x>@example.com','x'.repeat(250)+'@example.com'])assert.throws(()=>purchaseEmail(value),/INVALID_PURCHASE_EMAIL/);
});
