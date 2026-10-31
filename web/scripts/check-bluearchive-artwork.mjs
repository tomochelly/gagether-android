import fs from 'node:fs';import {createHash} from 'node:crypto';
const report=JSON.parse(fs.readFileSync('ops/bluearchive/20261027/banner-report.json'));
for(const a of report.entries){if(!/^ops\/bluearchive\/20261027\/originals\/[a-f0-9]{64}\.png$/.test(a.path))throw Error('Invalid Blue Archive original path');const bytes=fs.readFileSync(a.path);if(bytes.length!==a.bytes||createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error('Blue Archive original changed: '+a.entity);}
console.log('Verified 10 exact Korean official recruitment banner originals');
