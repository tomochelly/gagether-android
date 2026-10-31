// Native originals stay in Git. Large checked GFL2 glyphs use their exact source.
import {readFileSync,existsSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {isArknightsSourceIcon} from './source-arknights-assets.mjs';
export function omitSourceIconCopies(root='dist',entries=JSON.parse(readFileSync('content/roster-detail-icons.json','utf8'))){
 const retained=new Set(entries.filter(a=>a.delivery!=='source-original').map(a=>a.path));let count=0,bytes=0;
 for(const a of entries){
  if(a.delivery!=='source-original')continue;
  const u=new URL(a.url);
  const gfl2=a.gameId==='gfl2'&&a.sourceKind==='community'&&u.protocol==='https:'&&u.hostname==='gfl2.help'&&!u.port&&!u.username&&!u.password&&u.pathname.startsWith('/static/images/')&&!u.search&&!u.hash;
  if((!gfl2&&!isArknightsSourceIcon(a))||a.httpStatus!==200||!/^public\/roster-detail-icons\/[a-f0-9]{64}\.(png|webp|jpg)$/.test(a.path)||a.publicUrl!=='https://gagether.wiki/'+a.path.slice(7)||a.width<8||a.height<8)throw Error('Unverified source icon delivery');
  const original=readFileSync(a.path);if(original.length!==a.bytes||createHash('sha256').update(original).digest('hex')!==a.sha256)throw Error('Source icon original changed');
  const target=join(root,'client',a.path.slice(7));if(retained.has(a.path)||!existsSync(target))continue;
  if(!readFileSync(target).equals(original))throw Error('Generated icon original differs');unlinkSync(target);count++;bytes+=a.bytes;
 }
 console.log(JSON.stringify({preservedSourceIconURLs:count,duplicatePackagedIconBytesOmitted:bytes}));return {count,bytes};
}
