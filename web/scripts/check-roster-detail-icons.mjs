import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=JSON.parse(readFileSync('content/roster-detail-icons.json','utf8')),seen=new Set();
for(const a of rows){
 if(!/^[a-f0-9]{64}$/.test(a.sha256)||!['png','webp','jpg','svg'].includes(a.ext)||a.path!==`public/roster-detail-icons/${a.sha256}.${a.ext}`||a.publicUrl!==`https://gagether.wiki/roster-detail-icons/${a.sha256}.${a.ext}`)throw Error('Invalid native fact icon identity');
 const key=a.gameId+'|'+a.url;if(seen.has(key))throw Error('Duplicate native fact icon source');seen.add(key);
 const b=readFileSync(a.path);if(b.length!==a.bytes||createHash('sha256').update(b).digest('hex')!==a.sha256)throw Error('Native fact icon original changed: '+a.path);
}
console.log(`Verified ${rows.length} native fact icon source identities`);
