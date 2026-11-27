import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('popup and options provide every literal DOM target used by their scripts and shared dialogs',async()=>{
  const client=await readFile(new URL('../../extension/client.mjs',import.meta.url),'utf8');
  for(const surface of ['popup','options']){
    const html=await readFile(new URL('../../'+surface+'.html',import.meta.url),'utf8');
    const script=await readFile(new URL('../../'+surface+'.js',import.meta.url),'utf8');
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,'duplicate element id');
    for(const [,id] of (script+'\n'+client).matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(id),surface+' missing '+id);
    assert.ok(html.includes('type="module" src="'+surface+'.js"'));
    assert.ok(!html.includes('supportSerial'),'internal support identifier is not visible');
    assert.ok(html.includes('id="restorePurchaseBtn"'),'both surfaces expose the actual restore action');
    assert.ok(!html.includes('id="checkPurchaseBtn"'),'do not expose a misleading local-only purchase check');
  }
});
