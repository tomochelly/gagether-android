import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rows=JSON.parse(readFileSync(resolve(root,'content/character-rosters/artwork-manifest.json'),'utf8'));
for(const a of rows){
 if(!/^[a-f0-9]{64}$/.test(a.sha256)||!['png','webp','jpg'].includes(a.ext)||a.path!==`public/roster-bootstrap/${a.sha256}.${a.ext}`||a.publicUrl!==`https://gagether.wiki/roster-bootstrap/${a.sha256}.${a.ext}`)throw Error('Invalid fixed original');
 const path=resolve(root,a.path),valid=b=>b.length===a.bytes&&createHash('sha256').update(b).digest('hex')===a.sha256;
 if(existsSync(path)&&valid(readFileSync(path)))continue;
 const r=await fetch(a.delivery==='source-original'?a.url:a.publicUrl,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(a.path+': HTTP '+r.status);
 const b=Buffer.from(await r.arrayBuffer());if(!valid(b))throw Error('Original hash mismatch: '+a.path);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,b);
}
console.log('Verified/restored',rows.length,'immutable roster originals');

