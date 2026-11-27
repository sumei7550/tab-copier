import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {watchLocalState} from '../../extension/watch-state.mjs';

test('opening popup automatically activates a paid purchase and updates controls even during initial load',async()=>{
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  const config={apiBase:'https://sandbox.example',publicKey:publicKey.export({type:'spki',format:'pem'}),keyId:'test',environment:'sandbox'};
  const now=Date.now(),payload=Buffer.from(JSON.stringify({keyId:'test',environment:'sandbox',issuedAt:new Date(now).toISOString(),offlineUntil:new Date(now+3_600_000).toISOString(),expiresAt:new Date(now+72*3_600_000).toISOString(),plan:'trial',activationId:'activation',licenseId:'license',features:['unlimited','tab_groups','deduplicate','markdown_styles']})).toString('base64url');
  const entitlement={payload,signature:sign(null,Buffer.from(payload),privateKey).toString('base64url')};
  let data:any={schema13:true,installationId:'install',purchaseId:'purchase',pollToken:'private',markdownStyle:'ordered',removeDuplicates:true},handler:any;
  const listeners:any[]=[],calls:string[]=[];
  (globalThis as any).chrome={
    storage:{onChanged:{addListener(fn:any){listeners.push(fn);}},local:{async get(){return structuredClone(data);},async set(values:any){Object.assign(data,structuredClone(values));for(const fn of listeners)fn(Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{newValue:v}])),'local');},async remove(){}}},
    runtime:{id:'extension',getURL:(s:string)=>'chrome-extension://extension/'+s,onMessage:{addListener(fn:any){handler=fn;}},onInstalled:{addListener(){}}},
    alarms:{async create(){},async clear(){},onAlarm:{addListener(){}}},tabs:{async create(){throw Error('no checkout required');}}
  };
  const originalFetch=globalThis.fetch;let recoveryConfirmed=false;
  globalThis.fetch=(async(url:any)=>{
    calls.push(String(url));
    if(String(url).endsWith('/recovery/requests'))return {ok:true,json:async()=>({recoveryId:'request',recoverySecret:'secret',expiresAt:new Date(Date.now()+86400000).toISOString()})};
    if(String(url).endsWith('/redeem')&&!recoveryConfirmed)return {ok:false,json:async()=>({error:'RECOVERY_PENDING'})};
    return {ok:true,json:async()=>String(url).endsWith('/status')?{status:'paid'}:{entitlement,refreshToken:'refresh'}};
  }) as any;
  try{
    const entry=new URL('../../background.mjs',import.meta.url);
    const source=(await readFile(entry,'utf8')).replace("import { config } from './extension/config.mjs';",'const config='+JSON.stringify(config)+';').replace(/from '(\.\/[^']+)'/g,(_,path)=>"from '"+new URL(path,entry).href+"'");
    await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
    const send=(type:string,body:any={})=>new Promise<any>(resolve=>handler({type,...body},{id:'extension',url:'chrome-extension://extension/popup.html'},resolve));
    let rendered:any;
    const watcher=watchLocalState((globalThis as any).chrome.storage,async()=>{rendered=(await send('state')).result;},(e:any)=>{throw e;});
    await send('state');
    // Simulate activation completing while the first tab list is still loading.
    for(let i=0;i<50&&!data.entitlement;i++)await new Promise(resolve=>setTimeout(resolve,5));
    assert.ok(data.entitlement,'worker activated without a manual check');
    await watcher.ready();
    assert.equal(rendered.claims.plan,'trial');assert.equal(rendered.access.groups,true);assert.equal(rendered.access.dedup,true);assert.equal(rendered.access.lists,true);
    const copy=await send('prepareCopy',{scope:'group',groupName:'Research',tabs:[{title:'One',url:'https://example.com'},{title:'Duplicate',url:'https://example.com'}]});
    assert.equal(copy.ok,true);assert.equal(copy.result.count,1);assert.match(copy.result.text,/1\. \[One\]/);assert.equal(copy.result.limited,false);
    assert.equal((await send('restore')).result.status,'active');
    assert.ok(!calls.some(url=>url.includes('/recovery/')),'same-device restore refreshes existing entitlement');
    delete data.entitlement;delete data.refreshToken;
    assert.equal((await send('restore')).result.status,'active','same restore action also retrieves a locally known paid purchase');
    data={schema13:true,installationId:'new-install'};
    const results=await Promise.all([send('restore'),send('restore')]);
    assert.ok(results.every(result=>result.result.status==='contact'));
    assert.equal(calls.filter(url=>url.endsWith('/recovery/requests')).length,1,'repeat clicks create one recovery request');
    assert.equal((await send('restore')).result.status,'contact','unconfirmed link cannot activate');
    recoveryConfirmed=true;
    assert.equal((await send('restore')).result.status,'active','confirmed recovery uses the same entry to redeem');
  }finally{globalThis.fetch=originalFetch;}
});
