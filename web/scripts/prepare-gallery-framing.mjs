// Read-only client geometry: keep exact IEEE Number values and all original URLs.
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function compactGalleryFraming(audit){
 const rows=[],entries=[],seen=new Map(),prefixes=[],prefixIds=new Map();
 for(const[url,b]of Object.entries(audit.entries)){
  const row=[b.left,b.top,b.right,b.bottom,b.width??null,b.height??null];
  if(!row.slice(0,4).every(Number.isFinite)||row.slice(4).some(n=>n!==null&&!Number.isFinite(n)))throw Error('Invalid exact gallery geometry');
  const key=JSON.stringify(row);let index=seen.get(key);if(index===undefined){index=rows.length;rows.push(row);seen.set(key,index);}
  // Lossless URL dictionary: long immutable upstream paths recur thousands of times.
  const cut=url.lastIndexOf('/')+1,prefix=url.slice(0,cut);let prefixId=prefixIds.get(prefix);
  if(prefixId===undefined){prefixId=prefixes.length;prefixes.push(prefix);prefixIds.set(prefix,prefixId);}
  entries.push([prefixId,url.slice(cut),index]);
 }
 return {prefixes,rows,entries,backgrounds:audit.knownBackgroundURLs};
}
export function compactGalleryFocus(groups){
 const prefixes=[],seen=new Map(),entries=[];
 for(const {gameId,pinnedAliases,rows} of groups)for(const row of rows){
  if(!row.head)continue;
  const cut=row.url.lastIndexOf('/')+1,prefix=row.url.slice(0,cut);let id=seen.get(prefix);
  if(id===undefined){id=prefixes.length;prefixes.push(prefix);seen.set(prefix,id);}
  const h=row.head;entries.push([id,row.url.slice(cut),row.gameId||gameId,pinnedAliases?row.sha256:null,row.width,row.height,[h.left,h.top,h.right,h.bottom]]);
 }
 return {prefixes,entries};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const audit=JSON.parse(readFileSync('content/gallery-subject-bounds.json','utf8')),output=compactGalleryFraming(audit);
 writeFileSync('content/gallery-framing-runtime.json',JSON.stringify(output)+'\n');console.log(JSON.stringify({exactGalleryURLs:output.entries.length,distinctGeometry:output.rows.length}));
 const focus=compactGalleryFocus([{gameId:'arknights',rows:JSON.parse(readFileSync('content/arknights-gallery-focus.json','utf8')).entries},{pinnedAliases:true,rows:JSON.parse(readFileSync('content/maintenance-gallery-focus.json','utf8')).entries}]);
 writeFileSync('content/gallery-focus-runtime.json',JSON.stringify(focus)+'\n');
}
