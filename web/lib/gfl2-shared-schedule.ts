import type {Entry,Locale} from './types';
/** Display-only deduplication. Every original remains available by its native id to editors/collectors. */
export function sharedGfl2Schedules(entries:Entry[],locale:Locale='ko'){
 const preferred=locale==='en'?'global':locale==='ja'?'jp':'kr',rank=(e:Entry)=>e.region===preferred?0:e.region==='kr'?1:e.region==='global'?2:3;
 const matched=new Map<string,Entry>(),key=(e:Entry)=>{
  if(e.gameId!=='gfl2'||!['kr','jp','global'].includes(e.region)||!['pickup','weapon','event'].includes(e.kind)||e.contentRole==='notice'||e.price||e.marketRegion||e.audienceRegions?.length||e.collaboration)return '';
  const names=e.pickupMembers?.filter(m=>m.role!=='rate-up').map(m=>m.name.en.trim().toLowerCase()).filter(Boolean).sort().join('|')||e.title.en.trim().toLowerCase();
  if(!names)return '';
  const day=(at:string|null,d?:string)=>d||at?.slice(0,10)||'';
  if(!day(e.startAt,e.startDate)&&!day(e.endAt,e.endDate))return '';
  return [e.kind,e.poolType||'',names,day(e.startAt,e.startDate),day(e.endAt,e.endDate)].join('~');
 };
 for(const e of entries){const k=key(e);if(!k)continue;const old=matched.get(k);if(!old||rank(e)<rank(old))matched.set(k,e);}
 return entries.filter(e=>{const k=key(e);return !k||matched.get(k)===e;});
}
