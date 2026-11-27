import { before, test } from 'node:test';
import assert from 'node:assert/strict';
let data:Record<string,any>={},listener:any,installed:any;
before(async()=>{
  (globalThis as any).chrome={
    storage:{local:{async get(){return structuredClone(data);},async set(v:any){Object.assign(data,structuredClone(v));},async remove(keys:any){for(const k of Array.isArray(keys)?keys:[keys])delete data[k];}}},
    runtime:{id:'test-extension',getURL:(s:string)=>'chrome-extension://test-extension/'+s,onMessage:{addListener(fn:any){listener=fn;}},onInstalled:{addListener(fn:any){installed=fn;}}},
    alarms:{async clear(){},async create(){},onAlarm:{addListener(){}}},tabs:{async create(){throw new Error('unexpected external navigation');}},
  };
  await import('../../background.mjs');
});
function send(type:string,body:Record<string,any>={}){return new Promise<any>(resolve=>{listener({type,...body},{id:'test-extension',url:'chrome-extension://test-extension/popup.html'},resolve);});}
const tabs=[{id:1,title:'Title',url:'https://example.com/a'},{id:2,title:'Duplicate',url:'https://example.com/a'}];
test('worker enforces free features even if settings page flags were manipulated',async()=>{
  data={removeDuplicates:true,markdownStyle:'ordered',scope:'window',format:'markdown'};
  const r=await send('prepareCopy',{tabs,scope:'window'});assert.equal(r.ok,true);assert.equal(r.result.count,2);assert.ok(!r.result.text.startsWith('1.'));
  await send('releaseCopy',{operation:r.result.operation});
  assert.equal((await send('prepareCopy',{tabs,scope:'group'})).error,'PRO_REQUIRED');
});
test('worker serializes concurrent free copies and charges only committed copies',async()=>{
  data={};
  const results=await Promise.all(Array.from({length:4},()=>send('prepareCopy',{tabs,scope:'window'})));
  assert.equal(results.filter(r=>r.ok).length,3);assert.equal(results[3].error,'QUOTA_EXHAUSTED');
  const operations=results.slice(0,3).map(r=>r.result.operation);
  await send('commitCopy',{operation:operations[0]});await send('commitCopy',{operation:operations[0]});
  await send('releaseCopy',{operation:operations[1]});await send('releaseCopy',{operation:operations[2]});
  assert.equal(data.copyQuota.used,1);assert.equal((await send('state')).result.remaining,2);
});
test('upgrade-only provisional legacy policy preserves originals without unlocking groups',async()=>{
  data={};installed({reason:'update',previousVersion:'1.2.0'});
  const r=await send('state');assert.equal(r.result.access.unlimited,true);assert.equal(r.result.access.groups,false);
  assert.equal(r.result.settings.markdownStyle,'bullet');assert.equal(r.result.settings.removeDuplicates,true);
});
test('unconfigured payments fail closed without opening external checkout',async()=>{
  data={};const r=await send('buy');assert.equal(r.ok,false);assert.equal(r.error,'PAYMENT_NOT_CONFIGURED');
});

test('slow payment polling never blocks cached state or local copy actions',async()=>{
  const original=globalThis.fetch;let finish:any;
  globalThis.fetch=(()=>new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>({status:'created'})});})) as any;
  data={purchaseId:'pending',pollToken:'private'};
  try{
    const result=await Promise.race([send('state'),new Promise((_,reject)=>setTimeout(()=>reject(Error('state blocked on network')),500))]) as any;
    assert.equal(result.ok,true);
    const copy=await send('prepareCopy',{tabs,scope:'window'});assert.equal(copy.ok,true);
    await send('releaseCopy',{operation:copy.result.operation});
  }finally{finish?.();await new Promise(resolve=>setTimeout(resolve,0));globalThis.fetch=original;}
});
