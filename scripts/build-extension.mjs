import { readFile, mkdir, cp, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),arg=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};
const origin=new URL(arg('--api-base')||'http://localhost:3000');
if(origin.protocol!=='https:'&&!(origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname)))throw new Error('Use HTTPS or localhost for the sandbox API');
let publicKey='';if(arg('--public-key'))publicKey=await readFile(resolve(arg('--public-key')),'utf8');
const out=resolve(root,'build','extension-sandbox');await mkdir(out,{recursive:true});
// Explicit allowlist prevents copying website dependencies, credentials, docs or private keys.
for(const file of ['popup.html','popup.js','popup.css','options.html','options.js','options.css','background.mjs','analytics.js','i18n.js','icons','_locales','extension'])await cp(resolve(root,file),resolve(out,file),{recursive:true});
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
manifest.name='Tab Copier 1.3 Sandbox';manifest.version_name='1.3.0 sandbox — not for store release';
manifest.optional_host_permissions=[origin.origin+'/*'];
await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve(out,'extension','config.mjs'),'export const config = Object.freeze('+JSON.stringify({apiBase:origin.origin,environment:'sandbox',publicKey,keyId:arg('--key-id')||'sandbox-v1',preserveOriginalOnUpgrade:true})+');\n');
console.log('Sandbox extension: '+out);console.log(publicKey?'Sandbox key configured; payment still requires backend setup.':'No signing public key: free UI can be checked; upgrades remain unavailable.');
