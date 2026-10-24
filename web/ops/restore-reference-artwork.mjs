import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');let count=0;
for(const [file,prefix]of [['content/character-rosters/artwork-manifest.json','roster-bootstrap'],['content/leaks/x-artwork-manifest.json','leak-bootstrap']]){
 const rows=JSON.parse(readFileSync(resolve(root,file),'utf8'));
 for(const a of rows){
  if(!/^[a-f0-9]{64}$/.test(a.sha256)||!['jpg','png','webp'].includes(a.ext)||a.path!==`public/${prefix}/${a.sha256}.${a.ext}`)throw Error('Invalid fixed reference path');
  const expected=`https://gagether.wiki/${prefix}/${a.sha256}.${a.ext}`,url=new URL(a.publicUrl,'https://gagether.wiki').href;if(url!==expected)throw Error('Invalid fixed reference URL');
  const file=resolve(root,a.path),valid=b=>b.length===a.bytes&&createHash('sha256').update(b).digest('hex')===a.sha256;
  if(existsSync(file)&&valid(readFileSync(file))){count++;continue;}
  const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(a.path+': HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());if(!valid(b))throw Error('Native original hash/byte mismatch: '+a.path);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,b);count++;
 }
}
console.log('Verified/restored',count,'immutable reference originals');
