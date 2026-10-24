import type {Entry} from './types';
import {pickupNotice,type ReviewDocument} from './collection-review';
/** Curated update IDs need original-body collection just as feed IDs do. */
export function bodyCollectionCandidate(entry:Entry){
 return !entry.id.startsWith('custom-')&&!entry.pickupArchive&&!entry.broadcast&&(entry.sourceKind||'official')==='official'&&!/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//.test(entry.sourceUrl);
}
/** One source-heavy game must not monopolize the bounded body-fetch budget. */
export function selectBodyCandidates(entries:Entry[],previous:ReadonlyMap<string,ReviewDocument&{status?:string}>,now:number,limit=10){
 const service=(e:{gameId:string;region:string})=>e.gameId+'|'+e.region;
 const lastAttempt=new Map<string,number>();
 for(const d of previous.values()){const at=d.bodyCheckedAt||(d.sourceAccess!=='metadata'?d.checkedAt:undefined);if(at)lastAttempt.set(service(d),Math.max(lastAttempt.get(service(d))||0,Date.parse(at)||0));}
 const eligible=entries.filter(e=>{const old=previous.get(e.sourceUrl);if(!old)return true;if(old.status==='reviewed')return false;
  // An index capture is not a body attempt. Unread headlines are immediately
  // eligible; empty/failed reads cool down, successful pending bodies wait 6h.
  const at=old.bodyCheckedAt||(old.sourceAccess!=='metadata'?old.checkedAt:undefined);
  return !at||now-Date.parse(at)>(old.sourceAccess==='body'?6:1)*60*60000;
 });
 const groups=new Map<string,Entry[]>();
 for(const e of eligible){const key=service(e);if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(e);}
 const priority=(e:Entry)=>{const old=previous.get(e.sourceUrl);return !old||old.sourceAccess==='metadata'?0:old.sourceAccess==='body'?2:1;};
 for(const rows of groups.values())rows.sort((a,b)=>priority(a)-priority(b)||
  (priority(a)===0?(b.publishedAt||'').localeCompare(a.publishedAt||''):(Date.parse(previous.get(a.sourceUrl)?.checkedAt||'')||0)-(Date.parse(previous.get(b.sourceUrl)?.checkedAt||'')||0))||
  Number(pickupNotice(b.sourceTitle))-Number(pickupNotice(a.sourceTitle))||a.sourceUrl.localeCompare(b.sourceUrl));
 const ordered=[...groups].sort(([a],[b])=>(lastAttempt.get(a)||0)-(lastAttempt.get(b)||0)||a.localeCompare(b)).map(([,rows])=>rows);
 const chosen:Entry[]=[];
 for(let round=0;chosen.length<limit&&ordered.some(rows=>rows[round]);round++)for(const rows of ordered){if(rows[round])chosen.push(rows[round]);if(chosen.length===limit)break;}
 return chosen;
}
