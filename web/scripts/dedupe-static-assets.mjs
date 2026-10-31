// Bootstrap only: original files remain in source, exact duplicates retain their URL via the manifest route.
import {readFileSync,existsSync,unlinkSync} from 'node:fs';
const assets=JSON.parse(readFileSync('ops/assets-manifest.json','utf8')),seen=new Set();
for(const a of assets){if(seen.has(a.sha256)){const file=a.path.replace(/^public\//,'dist/client/');if(existsSync(file))unlinkSync(file);}else seen.add(a.sha256);}
