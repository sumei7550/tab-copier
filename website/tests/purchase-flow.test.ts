import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPurchaseFlow} from '../../extension/purchase.mjs';

test('pending purchase reopens the same authenticated session and coalesces repeat clicks',async()=>{
  const calls:any[]=[],opened:string[]=[];
  const buy=createPurchaseFlow({configured:()=>true,get:async()=>({purchaseId:'existing',pollToken:'private'}),set:async()=>{throw Error('must preserve credentials');},api:async(...args:any[])=>{calls.push(args);return {status:'created',checkoutUrl:'https://example.com/resume'};},open:async(url:string)=>{opened.push(url);},schedule:async()=>{},activate:async()=>{throw Error('unpaid');}});
  await Promise.all([buy(),buy(),buy()]);
  assert.deepEqual(calls,[['/api/purchases/existing/checkout',{},'private']]);assert.equal(opened.length,1);
  await buy();assert.equal(opened.length,2);
});

test('already paid purchase activates without opening checkout or replacing credentials',async()=>{
  let activated=0;
  const buy=createPurchaseFlow({configured:()=>true,get:async()=>({purchaseId:'existing',pollToken:'private'}),set:async()=>{throw Error('unexpected');},api:async()=>({status:'paid'}),open:async()=>{throw Error('unexpected');},schedule:async()=>{},activate:async()=>{activated++;return {status:'active'};}});
  assert.equal((await buy()).status,'active');assert.equal(activated,1);
});

test('failed navigation can retry the saved purchase without creating another purchase',async()=>{
  let saved:any={installationId:'install'},created=0,opened=0;
  const buy=createPurchaseFlow({configured:()=>true,get:async()=>saved,set:async(v:any)=>{saved={...saved,...v};},api:async(path:string)=>{if(path==='/api/purchases'){created++;return {purchaseId:'one',pollToken:'secret',checkoutUrl:'https://example.com/start'};}return {checkoutUrl:'https://example.com/resume'};},open:async()=>{if(++opened===1)throw Error('navigation failed');},schedule:async()=>{},activate:async()=>{}});
  await assert.rejects(buy(),/navigation failed/);await buy();assert.equal(created,1);assert.equal(saved.pollToken,'secret');
});
