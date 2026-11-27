import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';

export const ADMIN_SESSION_SECONDS=3600;
const passwordPattern=/^scrypt-v1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;
export function validAdminHash(hash:string){return passwordPattern.test(hash);}
export function hashAdminPassword(password:string){
  if(password.length<16||password.length>128)throw Error('管理员密码需为 16–128 个字符');
  const salt=randomBytes(16).toString('hex');
  return `scrypt-v1$${salt}$${scryptSync(password,salt,64).toString('hex')}`;
}
export function verifyAdminPassword(password:unknown,hash:string){
  const match=passwordPattern.exec(hash);
  if(!match||typeof password!=='string'||password.length<16||password.length>128)return false;
  return timingSafeEqual(scryptSync(password,match[1],64),Buffer.from(match[2],'hex'));
}
type Config={secret:string;passwordHash:string;origin:string};
function mac(payload:string,config:Config){
  return createHmac('sha256',config.secret).update(`tc-admin-v1:${config.origin}:${config.passwordHash}:${payload}`).digest('base64url');
}
export function adminToken(purpose:string,scope:string,config:Config,ttl=ADMIN_SESSION_SECONDS,now=Date.now()){
  const data=Buffer.from(JSON.stringify({purpose,scope,issued:now,expires:now+ttl*1000,nonce:randomBytes(16).toString('hex')})).toString('base64url');
  return data+'.'+mac(data,config);
}
export function checkAdminToken(raw:unknown,purpose:string,scope:string,config:Config,now=Date.now()){
  if(typeof raw!=='string'||raw.length>2048)return false;
  const parts=raw.split('.');if(parts.length!==2||!/^[A-Za-z0-9_-]{43}$/.test(parts[1]))return false;
  const expected=Buffer.from(mac(parts[0],config));const signature=Buffer.from(parts[1]);
  if(signature.length!==expected.length||!timingSafeEqual(signature,expected))return false;
  try{
    const data=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
    return data.purpose===purpose&&data.scope===scope&&Number.isFinite(data.issued)&&Number.isFinite(data.expires)&&data.issued<=now&&data.expires>now&&data.expires-data.issued<=ADMIN_SESSION_SECONDS*1000;
  }catch{return false;}
}
