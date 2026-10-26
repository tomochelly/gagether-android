import type {Entry,Locale} from './types';
import defaults from '../content/recurring-defaults.json' with {type:'json'};
import {dateInZone} from './display-time';
export type RecurringRepeat={kind:'owner-defined';enabled:boolean;intervalDays:number;anchorAt?:string;anchorDate?:string;timeZone:string;confirmedAt:string};
export function recurringRepeat(e:Entry):RecurringRepeat|undefined{
 if(e.kind!=='event'||!e.recurring)return;
 if(e.recurring.repeat)return e.recurring.repeat;
 const rule=defaults.find(r=>r.id===e.id&&r.gameId===e.gameId&&r.region===e.region);
 // This exact owner-requested mode follows the owner's saved end, never a
 // guessed upstream season. An explicit saved disabled rule overrides it.
 if(!rule||!e.editor?.fields.some(f=>f==='endAt'||f==='endDate'))return;
 const anchorAt=e.endAt||undefined,anchorDate=anchorAt?undefined:e.endDate;
 if(!anchorAt&&!anchorDate)return;
 return {kind:'owner-defined',enabled:true,intervalDays:rule.intervalDays,anchorAt,anchorDate,timeZone:rule.timeZone,confirmedAt:rule.confirmedAt};
}
export function validRecurringRepeat(r:RecurringRepeat){
 if(r.kind!=='owner-defined'||!Number.isInteger(r.intervalDays)||r.intervalDays<1||r.intervalDays>366||!!r.anchorAt===!!r.anchorDate||!Number.isFinite(Date.parse(r.confirmedAt)))return false;
 if(r.anchorAt&&!Number.isFinite(Date.parse(r.anchorAt)))return false;
 if(r.anchorDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(r.anchorDate)||!Number.isFinite(Date.parse(r.anchorDate))||new Date(r.anchorDate).toISOString().slice(0,10)!==r.anchorDate))return false;
 try{new Intl.DateTimeFormat('en',{timeZone:r.timeZone});return true;}catch{return false;}
}
export function recurringWindow(e:Entry,now:number){
 const r=recurringRepeat(e);if(!r?.enabled||!validRecurringRepeat(r)||!Number.isFinite(now))return;
 const period=r.intervalDays*86400000;
 if(r.anchorAt){const anchor=Date.parse(r.anchorAt),cycle=now<anchor?0:Math.floor((now-anchor)/period)+1,end=anchor+cycle*period;return {startAt:new Date(end-period).toISOString(),endAt:new Date(end).toISOString(),startDate:undefined,endDate:undefined,cycle};}
 const today=Date.parse(dateInZone(now,r.timeZone)),anchor=Date.parse(r.anchorDate!),cycle=Math.max(0,Math.ceil((today-anchor)/period)),end=anchor+cycle*period;
 // A date-only reset remains a date through every cycle. No clock or alarm.
 return {startAt:null,endAt:null,startDate:new Date(end-period+86400000).toISOString().slice(0,10),endDate:new Date(end).toISOString().slice(0,10),cycle};
}
export const ownerRecurring=(e:Entry)=>e.kind==='event'&&!!e.recurring&&(e.recurring.sourceKind==='owner'||!!e.recurring.repeat&&validRecurringRepeat(e.recurring.repeat));
export function editedRecurringEnd(e:Entry){
 if(!e.recurring||!e.editor)return;
 if(e.editor.fields.includes('endAt')&&e.endAt)return {at:e.endAt};
 if(e.editor.fields.includes('endDate')&&e.endDate&&!e.endAt)return {date:e.endDate};
}
/** Read-only presentation. Always retain the canonical record for editing/writes. */
export function recurringDisplayEntry(e:Entry,now:number):Entry{
 const w=recurringWindow(e,now);if(!w)return e;
 return {...e,startAt:w.startAt,endAt:w.endAt,startDate:w.startDate,endDate:w.endDate};
}
export function recurringRepeatLabel(e:Entry,locale:Locale){const r=recurringRepeat(e);if(!r?.enabled)return;return ({ko:`운영자 설정 · ${r.intervalDays}일 반복`,en:`Owner-defined · every ${r.intervalDays} days`,ja:`運営者設定 · ${r.intervalDays}日ごと`,zh:`管理者设定 · 每${r.intervalDays}天重复`})[locale];}
