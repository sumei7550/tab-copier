import { createPrivateKey } from 'node:crypto';
const required = ['PAYPAL_ENV','APP_URL','PAYPAL_CLIENT_ID','PAYPAL_CLIENT_SECRET','PAYPAL_MERCHANT_ID','PAYPAL_WEBHOOK_ID','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','TOKEN_DERIVATION_SECRET','ENTITLEMENT_PRIVATE_KEY','ENTITLEMENT_KEY_ID'];
let failures = 0;
for (const name of required) { const ok = !!process.env[name]; if (!ok) failures++; console.log(`${name}: ${ok ? '已配置' : '缺失'}`); }
if (process.env.PAYPAL_ENV && process.env.PAYPAL_ENV !== 'sandbox') { failures++; console.log('此版本禁止 Live'); }
if (process.env.ENTITLEMENT_PRIVATE_KEY) {
  try { if (createPrivateKey(process.env.ENTITLEMENT_PRIVATE_KEY.replace(/\\n/g,'\n')).asymmetricKeyType !== 'ed25519') throw new Error(); }
  catch { failures++; console.log('签名私钥格式无效，需要 Ed25519 PKCS8 PEM'); }
}
console.log('只检查本地配置是否存在，不验证账号权限、不连接外部服务。');
process.exitCode = failures ? 1 : 0;
