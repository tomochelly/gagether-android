import type {Entry} from './types';
import {pickupNotice,type ReviewDocument} from './collection-review';
/** Curated update IDs need original-body collection just as feed IDs do. */
export function bodyCollectionCandidate(entry:Entry){
 return !entry.id.startsWith('custom-')&&!entry.pickupArchive&&!entry.broadcast&&(entry.sourceKind||'official')==='official'&&!/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//.test(entry.sourceUrl);
}
/** One source-heavy game must not monopolize the bounded body-fetch budget. */
export function selectBodyCandidates(entries:Entry[],previous:Map<string,ReviewDocument>,now:number,limit=10){
 const service=(e:{gameId:string;region:string})=>e.gameId+'|'+e.region;
 const lastAttempt=new Map<string,number>();
 for(const d of previous.values())if(d.sourceAccess!=='metadata')lastAttempt.set(service(d),Math.max(lastAttempt.get(service(d))||0,Date.parse(d.checkedAt)||0));
 const eligible=entries.filter(e=>{const old=previous.get(e.sourceUrl);return !old||old.sourceAccess==='metadata'||old.status!=='reviewed'&&now-Date.parse(old.checkedAt)>60*60000;});
 const groups=new Map<string,Entry[]>();
 for(const e of eligible){const key=service(e);if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(e);}
 for(const rows of groups.values())rows.sort((a,b)=>Number(pickupNotice(b.sourceTitle))-Number(pickupNotice(a.sourceTitle))||(Date.parse(previous.get(a.sourceUrl)?.checkedAt||'')||0)-(Date.parse(previous.get(b.sourceUrl)?.checkedAt||'')||0)||(b.publishedAt||'').localeCompare(a.publishedAt||''));
 const ordered=[...groups].sort(([a],[b])=>(lastAttempt.get(a)||0)-(lastAttempt.get(b)||0)||a.localeCompare(b)).map(([,rows])=>rows);
 const chosen:Entry[]=[];
 for(let round=0;chosen.length<limit&&ordered.some(rows=>rows[round]);round++)for(const rows of ordered){if(rows[round])chosen.push(rows[round]);if(chosen.length===limit)break;}
 return chosen;
}
