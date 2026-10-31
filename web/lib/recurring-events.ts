import {recurringWindow,editedRecurringEnd} from './recurring-schedule';
import type {Entry,Locale} from './types';
import {eventState,serviceZone} from './event-presentation';
import {eventTextForLocale} from './event-overview-items';
import {dateInZone} from './display-time';
import {officialRecurringRule} from './recurring-official-rules';
/** Source-backed seasons need fresh evidence; only explicit owner rules repeat. */
export const confirmedRecurringReset=(e:Entry)=>!!editedRecurringEnd(e)||e.recurring?.sourceKind==='owner'||e.recurring?.sourceKind==='official'||e.recurring?.resetEvidence?.kind==='owner-confirmed';
export function recurringReset(e:Entry,now:number):{at?:string;date?:string}|null{
 const w=recurringWindow(e,now);if(w)return w.endAt?{at:w.endAt}:{date:'resetDate' in w?w.resetDate||w.endDate:w.endDate};
 const r=e.recurring;
 if(!r||!confirmedRecurringReset(e))return null;
 const edited=editedRecurringEnd(e);if(edited)return edited.at&&Date.parse(edited.at)>now?edited:edited.date&&edited.date>=dateInZone(now,serviceZone(e))?edited:null;
 if(r.resetAt&&Number.isFinite(Date.parse(r.resetAt))&&Date.parse(r.resetAt)>now)return {at:r.resetAt};
 if(!r.resetAt&&r.resetDate&&r.resetDate>=dateInZone(now,serviceZone(e)))return {date:r.resetDate};
 return null;
}
export function recurringItems(entries:Entry[],locale:Locale,now:number,gameOrder:string[]=[]){
 const eligible=entries.filter(e=>e.recurring&&e.kind==='event'&&!e.hidden&&!e.pickupArchive&&eventTextForLocale(e.title,locale)&&eventState(e,now)!=='ended'&&!(confirmedRecurringReset(e)&&!recurringWindow(e,now)&&!editedRecurringEnd(e)&&e.recurring.resetAt&&Date.parse(e.recurring.resetAt)<=now));
 const rank=(e:Entry)=>{const state=eventState(e,now);return state==='active'||state==='unconfirmed'&&!!recurringReset(e,now)?0:state==='upcoming'?1:2;};
 // Keep a confirmed running clock through its boundary, including the first
 // date-only day of the next announcement whose opening hour is unknown.
 const sorted=[...eligible].sort((a,b)=>rank(a)-rank(b)||(rank(a)===0?Number(!!recurringReset(b,now)?.at)-Number(!!recurringReset(a,now)?.at):0)||((a.startAt||a.startDate||'').localeCompare(b.startAt||b.startDate||''))*(rank(a)===0?-1:1)||Number(!!b.editor)-Number(!!a.editor)||a.id.localeCompare(b.id));
 const seen=new Set<string>();
 return sorted.filter(e=>{const key=[e.gameId,e.region,e.recurring!.modeId].join(':');if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>{
  const reset=(e:Entry)=>{const r=recurringReset(e,now);return r?.at||r?.date||e.endAt||e.endDate||'9999';};
  const order=(e:Entry)=>{const i=gameOrder.indexOf(e.gameId);return i<0?999:i;};
  return rank(a)-rank(b)||reset(a).localeCompare(reset(b))||order(a)-order(b)||a.gameId.localeCompare(b.gameId);
 });
}
/** Keep actual historical/upcoming phases. Suppress only a permanent computed
 * fallback while a more specific current occurrence already represents it. */
export function recurringScheduleEntries(entries:Entry[],locale:Locale,now:number){
 const selected=new Set(recurringItems(entries,locale,now).map(e=>e.id));
 return entries.filter(e=>!officialRecurringRule(e)||selected.has(e.id));
}
