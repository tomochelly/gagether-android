import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const recovery=resolve(root,'content/character-rosters/recovery');
const manifest=JSON.parse(readFileSync(resolve(recovery,'manifest.json'),'utf8'));
if(manifest.format!=='gzip-base64-parts-v1'||manifest.target!=='content/character-rosters/bootstrap.json'||!Array.isArray(manifest.parts)||manifest.parts.some(p=>!/^\d{3}\.b64$/.test(p)))throw Error('Invalid roster recovery manifest');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const target=resolve(root,manifest.target);
if(existsSync(target)){
 if(digest(readFileSync(target))!==manifest.sha256)throw Error('Local roster snapshot differs; preserve it and regenerate recovery parts before publication.');
}else{
 const packed=Buffer.from(manifest.parts.map(p=>readFileSync(resolve(recovery,p),'utf8').trim()).join(''),'base64');
 if(digest(packed)!==manifest.compressedSha256)throw Error('Compressed roster snapshot hash mismatch');
 const bytes=gunzipSync(packed,{maxOutputLength:64000000});
 if(bytes.length!==manifest.bytes||digest(bytes)!==manifest.sha256)throw Error('Roster recovery snapshot hash mismatch');
 const rows=JSON.parse(bytes.toString('utf8'));
 if(!Array.isArray(rows)||rows.length!==17||new Set(rows.map(r=>r.gameId)).size!==17)throw Error('Roster recovery identity mismatch');
 mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);
 console.log('Restored exact roster snapshot:',manifest.bytes,'bytes');
}
