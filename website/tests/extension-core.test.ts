import { test } from 'node:test';
import assert from 'node:assert/strict';
import { outputModel, rights, effectiveSettings, reserveCopy, commitCopy, quotaState } from '../../extension/core.mjs';
const tabs=[{title:'First',url:'https://example.com/a?utm_source=one'},{title:'Second',url:'https://example.com/a?utm_source=two'},{title:'Other',url:'https://example.com/a?id=2'}];
test('free output ignores paid preference flags from storage',()=>{
  const model=outputModel(tabs,{format:'markdown',scope:'window',removeDuplicates:true,removeTracking:true,markdownStyle:'ordered'},rights(false));
  assert.equal(model.items.length,3);assert.ok(!model.text.startsWith('1.'));assert.equal(model.settings.removeDuplicates,false);
});
test('dedup compares cleaned complete URLs and preserves first selected title',()=>{
  const m=outputModel(tabs,{scope:'window',removeTracking:true,removeDuplicates:true},rights(true));
  assert.equal(m.removed,1);assert.equal(m.items[0].title,'First');assert.equal(m.items[1].url,'https://example.com/a?id=2');
  const raw=outputModel(tabs,{removeTracking:false,removeDuplicates:true},rights(true));assert.equal(raw.removed,0);
  const secondOnly=outputModel(tabs.slice(1),{removeTracking:true,removeDuplicates:true},rights(true));assert.equal(secondOnly.items[0].title,'Second');
});
test('different hash, meaningful parameters and parameter order are preserved',()=>{
  const urls=['https://example.com/a#one','https://example.com/a#two','https://example.com/a?a=1&b=2','https://example.com/a?b=2&a=1'];
  assert.equal(outputModel(urls.map(url=>({title:'same',url})),{removeTracking:true,removeDuplicates:true},rights(true)).items.length,4);
});
test('unsafe HTML titles and group names are escaped in text export',()=>{
  const m=outputModel([{title:'<script>&"',url:'https://example.com/?x="'}],{scope:'group',format:'html',includeGroupName:true},rights(true),'<img>');
  assert.ok(!m.text.includes('<script>'));assert.ok(m.text.includes('&lt;img&gt;'));assert.ok(m.text.includes('&amp;'));
});
test('free/legacy/pro have separate group and original capabilities',()=>{
  assert.equal(rights(false,true).groups,false);assert.equal(rights(false,true).dedup,true);
  assert.equal(effectiveSettings({scope:'group'},rights(false)).scope,'window');
  assert.equal(rights(true).groups,true);
});
test('reserving quota prevents parallel oversubscription, committing is idempotent',()=>{
  let q=reserveCopy(undefined,'2026-11-27',1000,'a');q=reserveCopy(q,'2026-11-27',1000,'b');q=reserveCopy(q,'2026-11-27',1000,'c');
  assert.throws(()=>reserveCopy(q,'2026-11-27',1000,'d'),/QUOTA_EXHAUSTED/);
  q=commitCopy(q,'a');const again=commitCopy(q,'a');assert.equal(again.used,1);
  assert.throws(()=>commitCopy(q,'unknown'),/COPY_LEASE_LOST/);
});
test('abandoned leases expire; rolling the clock back does not refill quota',()=>{
  let q=reserveCopy(undefined,'2026-11-27',1000,'a');assert.equal(quotaState(q,'2026-11-27',32000).leases.length,0);
  q=commitCopy(q,'a');assert.equal(quotaState(q,'2026-11-26',2000).used,1);assert.equal(quotaState(q,'2026-11-28',2000).used,0);
});
