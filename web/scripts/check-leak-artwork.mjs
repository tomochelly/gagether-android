import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const rows=JSON.parse(readFileSync('content/leaks/x-artwork-manifest.json','utf8'));
for(const a of rows){if(!/^[a-f0-9]{64}$/.test(a.sha256)||!['jpg','png','webp'].includes(a.ext)||a.path!==`public/leak-bootstrap/${a.sha256}.${a.ext}`||a.publicUrl!==`/leak-bootstrap/${a.sha256}.${a.ext}`)throw Error('Invalid fixed leak original identity');const b=readFileSync(a.path);if(b.length!==a.bytes||createHash('sha256').update(b).digest('hex')!==a.sha256)throw Error('Changed fixed leak original: '+a.path);}
console.log('Verified',rows.length,'immutable leak image/poster originals');
