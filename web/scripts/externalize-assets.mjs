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

// Existing /api/wuwa/artwork delivery uses this identical durable original first.
const referenceReceipt='ops/reference-storage-receipt.json';
if(existsSync(referenceReceipt)){
 const registry=Object.values(JSON.parse(readFileSync('content/wuwa-reference-splashes.json','utf8')).entries);
 for(const a of JSON.parse(readFileSync(referenceReceipt,'utf8')).assets){
  const row=registry.find(r=>r.sha256===a.sha256&&r.bytes===a.bytes&&a.path==='public/reference-bootstrap/'+r.sha256+'.'+r.extension&&r.url==='/api/wuwa/artwork/'+r.sha256);
  if(!a.ready||!row)throw Error('Unverified reference original storage');
  const original=readFileSync(a.path);if(original.length!==a.bytes)throw Error('Reference original size changed');
  const {createHash}=await import('node:crypto');if(createHash('sha256').update(original).digest('hex')!==a.sha256)throw Error('Reference original SHA changed');
  const target=join('dist/client',a.path.slice(7));if(existsSync(target)){if(!readFileSync(target).equals(original))throw Error('Reference copy differs');unlinkSync(target);}
 }
}
