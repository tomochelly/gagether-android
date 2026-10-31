import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=process.cwd(),manifest=JSON.parse(readFileSync('content/character-rosters/artwork-manifest.json','utf8')),seen=new Set();
for(const a of manifest){
 if(!/^[a-f0-9]{64}$/.test(a.sha256)||!['png','webp','jpg','avif'].includes(a.ext)||a.path!==`public/roster-bootstrap/${a.sha256}.${a.ext}`||a.publicUrl!==`https://gagether.wiki/roster-bootstrap/${a.sha256}.${a.ext}`)throw Error('Invalid pinned roster artwork identity');
 const b=readFileSync(resolve(root,a.path));if(b.length!==a.bytes||createHash('sha256').update(b).digest('hex')!==a.sha256)throw Error('Pinned roster original changed: '+a.path);seen.add(a.sha256);
}
console.log(`Verified ${manifest.length} source identities / ${seen.size} immutable roster originals`);
