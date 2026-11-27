import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const path = '.env.local';
let text = readFileSync(existsSync(path) ? path : '.env.example', 'utf8');
if (/^ENTITLEMENT_PRIVATE_KEY=.+/m.test(text) || /^TOKEN_DERIVATION_SECRET=.+/m.test(text)) {
  console.error('发现已有签名/派生密钥，拒绝覆盖，避免已存在授权失效。'); process.exit(1);
}
const keys = generateKeyPairSync('ed25519', { publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
text = text.replace(/^ENTITLEMENT_PRIVATE_KEY=.*$/m, `ENTITLEMENT_PRIVATE_KEY="${keys.privateKey.replace(/\n/g, '\\n')}"`)
  .replace(/^TOKEN_DERIVATION_SECRET=.*$/m, `TOKEN_DERIVATION_SECRET=${randomBytes(32).toString('hex')}`);
writeFileSync(path, text, { mode: 0o600 });
writeFileSync('sandbox-public-key.pem', keys.publicKey);
console.log('已在未追踪的 .env.local 保存私钥；沙盒公钥：sandbox-public-key.pem。没有输出私钥。');
