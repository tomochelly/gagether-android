import type {Entry,Locale} from './types';
import {originalName} from './content-display';
import {availableInLocale} from './presentation';
import {eventState,sortEvents} from './event-presentation';

/** Presentation only: never delete a source record or merge distinct service windows. */
export function eventTextForLocale(value:Partial<Record<Locale,string>>|undefined,locale:Locale){
 return value?originalName({ko:value.ko||'',en:value.en||'',ja:value.ja||'',zh:value.zh||''},locale):'';
}
const normalized=(text:string)=>text.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]/gu,'');
function sameWindow(a:Entry,b:Entry){
 return (a.startAt||a.startDate||'')===(b.startAt||b.startDate||'')&&(a.endAt||a.endDate||'')===(b.endAt||b.endDate||'');
}
export function eventOverviewItems(entries:Entry[],locale:Locale,now:number){
 const candidates=entries.filter(e=>(e.kind==='event'||!!e.collaboration)&&!e.hidden&&!e.pickupArchive&&availableInLocale(e,locale)&&eventTextForLocale(e.title,locale)&&eventState(e,now)!=='ended');
 const chosen:Entry[]=[];
 for(const e of candidates){
  const i=chosen.findIndex(p=>p.id===e.id||p.gameId===e.gameId&&p.region===e.region&&p.kind===e.kind&&normalized(eventTextForLocale(p.title,locale))===normalized(eventTextForLocale(e.title,locale))&&sameWindow(p,e));
  if(i<0)chosen.push(e);
  else {
   // Retain the richer reviewed representative, and always honor owner-edited content.
   const score=(x:Entry)=>(x.editor?10000:0)+(x.rewards?.length||0)*10+(x.detailSections?.length||0)*2+(x.highlights?.length||0)+(/^(quick|feed)-/.test(x.id)?0:1);
   if(score(e)>score(chosen[i]))chosen[i]=e;
  }
 }
 return sortEvents(chosen,now);
}
