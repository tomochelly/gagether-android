import {readFileSync,writeFileSync,readdirSync,unlinkSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=root+'content/character-rosters/recovery/',target='content/character-rosters/bootstrap.json';
const bytes=readFileSync(root+target),rows=JSON.parse(bytes);
if(bytes.length>28000000||rows.length!==17||new Set(rows.map(r=>r.gameId)).size!==17)throw Error('Invalid roster snapshot');
const digest=b=>createHash('sha256').update(b).digest('hex'),packed=gzipSync(bytes,{level:9}),encoded=packed.toString('base64'),parts=[];
for(let i=0;i<encoded.length;i+=100000){const name=String(parts.length).padStart(3,'0')+'.b64';parts.push(name);writeFileSync(dir+name,encoded.slice(i,i+100000)+'\n');}
for(const name of readdirSync(dir))if(/^\d{3}\.b64$/.test(name)&&!parts.includes(name))unlinkSync(dir+name);
writeFileSync(dir+'manifest.json',JSON.stringify({format:'gzip-base64-parts-v1',target,bytes:bytes.length,sha256:digest(bytes),compressedSha256:digest(packed),parts},null,2)+'\n');
console.log(`Prepared exact roster recovery: ${bytes.length} bytes, ${parts.length} parts`);
