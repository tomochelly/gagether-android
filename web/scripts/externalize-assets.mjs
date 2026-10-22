// Remove a packaged copy only after an authenticated, hash-checked R2 readback.
// Source originals and public URLs are unchanged; unverified/new assets stay static.
import {readFileSync,existsSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
export function externalizeAssets(root='dist'){
 const file='ops/asset-migration-receipt.json';if(!existsSync(file))return;
 const receipt=JSON.parse(readFileSync(file,'utf8')),manifest=JSON.parse(readFileSync('ops/assets-manifest.json','utf8'));
 if(receipt.version!==1||!Array.isArray(receipt.assets))throw Error('Invalid asset migration receipt');
 const byPath=new Map(manifest.map(a=>[a.path.replace(/^public\//,''),a]));let count=0,bytes=0;
 for(const a of receipt.assets){
  const original=byPath.get(a.path);if(!a.ready||!original||original.sha256!==a.sha256||original.bytes!==a.bytes)throw Error('Unverified asset externalization: '+a.path);
  const p=join(root,'client',a.path);if(existsSync(p)){unlinkSync(p);count++;bytes+=a.bytes;}
 }
 console.log(JSON.stringify({externalizedOriginals:count,bytes}));
}
if(process.argv[1]?.endsWith('/externalize-assets.mjs'))externalizeAssets(process.argv[2]||'dist');
