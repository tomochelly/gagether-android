// Read-only client geometry: keep exact IEEE Number values and all original URLs.
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function compactGalleryFraming(audit){
 const rows=[],entries=[],seen=new Map();
 for(const[url,b]of Object.entries(audit.entries)){
  const row=[b.left,b.top,b.right,b.bottom,b.width??null,b.height??null];
  if(!row.slice(0,4).every(Number.isFinite)||row.slice(4).some(n=>n!==null&&!Number.isFinite(n)))throw Error('Invalid exact gallery geometry');
  const key=JSON.stringify(row);let index=seen.get(key);if(index===undefined){index=rows.length;rows.push(row);seen.set(key,index);}entries.push([url,index]);
 }
 return {rows,entries,backgrounds:audit.knownBackgroundURLs};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const audit=JSON.parse(readFileSync('content/gallery-subject-bounds.json','utf8')),output=compactGalleryFraming(audit);
 writeFileSync('content/gallery-framing-runtime.json',JSON.stringify(output)+'\n');console.log(JSON.stringify({exactGalleryURLs:output.entries.length,distinctGeometry:output.rows.length}));
}
