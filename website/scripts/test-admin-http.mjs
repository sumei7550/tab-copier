// Exercise the built Next.js HTTP routes against a local fake Supabase rate limiter.
// No live database, PayPal API, user data or deployment is contacted.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {hashAdminPassword} from '../src/lib/admin-security.ts';
const require=createRequire(import.meta.url),counts=new Map();let databaseCalls=0;
const store=createServer(async(req,res)=>{
  databaseCalls++;let raw='';for await(const chunk of req)raw+=chunk;
  res.setHeader('Content-Type','application/json');
  if(req.url?.includes('/rpc/consume_rate')){
    const {p_key,p_limit}=JSON.parse(raw),hits=(counts.get(p_key)||0)+1;counts.set(p_key,hits);res.end(JSON.stringify(hits<=p_limit));
  }else res.end('[]');
});
await new Promise(resolve=>store.listen(0,'127.0.0.1',resolve));
const supabase=`http://127.0.0.1:${store.address().port}`;
const reserve=createServer();await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));
const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
const origin=`http://127.0.0.1:${port}`,password='test-admin-only-password-2026';
const app=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{
  cwd:new URL('..',import.meta.url),env:{...process.env,APP_URL:origin,PAYPAL_ENV:'sandbox',PAYPAL_MERCHANT_ID:'TESTMERCHANT',ADMIN_PASSWORD_HASH:hashAdminPassword(password),TOKEN_DERIVATION_SECRET:'local-admin-http-test-secret-32-characters',SUPABASE_URL:supabase,SUPABASE_SERVICE_ROLE_KEY:'test-only-key'},stdio:['ignore','pipe','pipe'],windowsHide:true
});
let log='';app.stdout.on('data',s=>{log+=s;});app.stderr.on('data',s=>{log+=s;});
const request=(path,method='GET',cookie='',data,requestOrigin=origin)=>fetch(origin+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(method!=='GET'?{Origin:requestOrigin,'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(5000)});
try{
  let up=false;for(let i=0;i<80;i++){try{const r=await fetch(origin+'/admin/recovery');if(r.ok){up=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  assert.ok(up,'Next.js start failed: '+log.slice(-1500));
  let r=await request('/api/admin/session');assert.equal(r.status,401);
  const before=databaseCalls;
  for(const path of ['/api/admin/recovery/preview','/api/admin/recovery/issue']){r=await request(path,'POST','',{});assert.equal(r.status,401);}
  assert.equal(databaseCalls,before,'unauthenticated recovery must never query orders');
  r=await request('/api/admin/session','POST','',{password},'https://external.example');assert.equal(r.status,403);
  r=await request('/api/admin/session','POST','',{password:'wrong-password-123456'});assert.equal(r.status,401);assert.equal(r.headers.get('set-cookie'),null);
  r=await request('/api/admin/session','POST','',{password});assert.equal(r.status,200);
  const setCookie=r.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/SameSite=strict/i);assert.match(setCookie,/Max-Age=3600/i);
  const cookie=setCookie.split(';')[0];
  assert.equal((await request('/api/admin/session','GET',cookie)).status,200);
  assert.equal((await request('/api/admin/recovery/preview','POST',cookie,{},'https://external.example')).status,403);
  r=await request('/api/admin/recovery/preview','POST',cookie,{supportId:'TC-11111111-1111-4111-8111-111111111111',captureId:'CAPTURE123'});assert.equal(r.status,409);assert.equal((await r.json()).error,'RECOVERY_REQUEST_NOT_FOUND');
  r=await request('/api/admin/recovery/issue','POST',cookie,{});assert.equal(r.status,400);assert.equal((await r.json()).error,'OWNERSHIP_CHECK_REQUIRED');
  const tampered=cookie.slice(0,-1)+(cookie.endsWith('A')?'B':'A');assert.equal((await request('/api/admin/session','GET',tampered)).status,401);
  r=await request('/api/admin/session','DELETE',cookie);assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/i);
  for(let i=0;i<4;i++)r=await request('/api/admin/session','POST','',{password:'wrong-password-123456'});
  assert.equal(r.status,429,'repeated login attempts must be limited');
  const page=await (await request('/admin/recovery')).text();assert.match(page,/noindex/);assert.ok(!page.includes('local-admin-http-test-secret'));
  const checkout=await (await request('/checkout')).text();assert.match(checkout,/id="purchase-email"/);assert.match(checkout,/type="email"/);
  console.log('Admin HTTP smoke passed: login/cookies, anonymous denial, CSRF, tampering, rate limiting, recovery guards, logout and noindex.');
  if(process.argv.includes('--preview')){counts.clear();console.log('Local UI preview: '+origin+'/admin/recovery');await new Promise(resolve=>process.once('SIGINT',resolve));}
}finally{
  app.kill();store.closeAllConnections();await new Promise(resolve=>store.close(resolve));
}
