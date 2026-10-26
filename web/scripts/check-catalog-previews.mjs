import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const rows=JSON.parse(readFileSync('content/catalog-preview-images.json','utf8')),assets=JSON.parse(readFileSync('ops/assets-manifest.json','utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
for(const r of rows){
 const original=assets.find(a=>a.path==='public'+r.original);if(!original||original.sha256!==r.sourceSha256||!/^\/catalog-previews\/[a-f0-9]{64}\.webp$/.test(r.url)||r.url!==`/catalog-previews/${r.sha256}.webp`||r.width>r.sourceWidth||r.height>r.sourceHeight)throw Error('Unbound catalog preview');
 const full=readFileSync(original.path),preview=readFileSync('public'+r.url);if(full.length!==r.sourceBytes||hash(full)!==r.sourceSha256||preview.length!==r.bytes||hash(preview)!==r.sha256||preview.toString('ascii',0,4)!=='RIFF'||preview.toString('ascii',8,12)!=='WEBP')throw Error('Catalog original/preview changed');
}
console.log(JSON.stringify({catalogPreviews:rows.length,originalsUnchanged:true,sourceBytes:rows.reduce((n,r)=>n+r.sourceBytes,0),previewBytes:rows.reduce((n,r)=>n+r.bytes,0)}));
