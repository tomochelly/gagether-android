import rules from '../content/recurring-rules.json' with {type:'json'};
import {dateInZone} from './display-time';
import type {Entry,Locale} from './types';

/** Only exact, reviewed permanent rules. An announced season is not a rule. */
export function officialRecurringRule(e:Entry){
 if(e.kind!=='event'||!e.recurring||e.recurring.repeat||e.editor?.fields.some(f=>['recurring','startAt','endAt','startDate','endDate'].includes(f)))return;
 return rules.find(r=>r.id===e.id&&r.gameId===e.gameId&&r.region===e.region&&r.modeId===e.recurring!.modeId);
}
export function officialRecurringWindow(e:Entry,now:number){
 const r=officialRecurringRule(e);if(!r||!Number.isFinite(now))return;
 const day=dateInZone(now,r.timeZone),[y,m,d]=day.split('-').map(Number),date=(year:number,month:number,day:number)=>new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10);
 if(r.kind==='weekly'){
  const anchor=Date.parse(r.anchorAt!),period=7*86400000,cycle=Math.floor((now-anchor)/period)+1,end=anchor+cycle*period;
  return {startAt:new Date(end-period).toISOString(),endAt:new Date(end).toISOString(),startDate:undefined,endDate:undefined,resetDate:undefined,cycle};
 }
 const on=r.day!,thisBoundary=date(y,m,on),previous=date(y,m-1,on),next=date(y,m+1,on);
 if(r.utcOffsetMinutes!==undefined&&r.hour!==undefined){
  const at=(s:string)=>Date.parse(s)+r.hour!*3600000+(r.minute||0)*60000-r.utcOffsetMinutes!*60000,boundary=at(thisBoundary),start=now<boundary?at(previous):boundary,end=now<boundary?boundary:at(next);
  return {startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString(),startDate:undefined,endDate:undefined,resetDate:undefined,cycle:y*12+m};
 }
 const startDate=d<on?previous:thisBoundary,resetDate=d<on?thisBoundary:next,endDate=new Date(Date.parse(resetDate)-86400000).toISOString().slice(0,10);
 return {startAt:null,endAt:null,startDate,endDate,resetDate,cycle:y*12+m};
}
export function officialRecurringLabel(e:Entry,locale:Locale){const r=officialRecurringRule(e);return r?.label[locale];}
