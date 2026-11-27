import {test} from 'node:test';
import assert from 'node:assert/strict';
import {watchLocalState} from '../../extension/watch-state.mjs';
import {bindDialogs} from '../../extension/client.mjs';

test('activation during initial load is delivered after initialization, with no concurrent redraws',async()=>{
  let listener:any,active=false,draws=0,inFlight=0,max=0,release:any;
  const first=new Promise<void>(resolve=>{release=resolve;});
  const watcher=watchLocalState({onChanged:{addListener(fn:any){listener=fn;}}},async()=>{
    max=Math.max(max,++inFlight);draws++;if(draws===1)await first;inFlight--;
  },(e:any)=>{throw e;});
  active=true;listener({entitlement:{newValue:active}},'local');
  assert.equal(draws,0);const ready=watcher.ready();
  listener({entitlement:{newValue:'newer'}},'local');release();await ready;
  assert.equal(draws,2);assert.equal(max,1);
});
test('active entitlement closes stale paywall, hides upgrade entry and prevents reopening it',()=>{
  const nodes=new Map<string,any>();
  const node=(id:string)=>{if(!nodes.has(id))nodes.set(id,{open:false,hidden:false,textContent:'',close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(id);};
  (globalThis as any).document={getElementById:node};
  (globalThis as any).chrome={i18n:{getUILanguage:()=> 'en'}};
  const dialogs=bindDialogs();
  dialogs.upgrade();assert.equal(node('proDialog').open,true);
  dialogs.update({claims:{plan:'trial'}});
  assert.equal(node('proDialog').open,false);assert.equal(node('upgradeBtn').hidden,true);
  dialogs.upgrade();assert.equal(node('proDialog').open,false);
  dialogs.update({claims:null});dialogs.upgrade();assert.equal(node('proDialog').open,true);
});
