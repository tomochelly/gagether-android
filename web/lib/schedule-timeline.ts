import type {Entry} from './types';
import {calendarMarks,dayKey,DAY,importantMarks,type CalendarMark} from './schedule';
import {calendarIncludesGame,calendarIncludesKind,type CalendarPreferences} from './calendar-preferences';
import {timedSchedule} from './pickup-history';
/** Group only the visible marks; never change stored entries or calendar choices. */
export function timelineGameGroups(marks:CalendarMark[],gameOrder:string[]){
 const rank=new Map(gameOrder.map((id,index)=>[id,index]));
 const grouped=new Map<string,CalendarMark[]>();
 for(const mark of marks){const list=grouped.get(mark.entry.gameId)||[];list.push(mark);grouped.set(mark.entry.gameId,list);}
 return [...grouped].sort(([a],[b])=>(rank.get(a)??Infinity)-(rank.get(b)??Infinity)||a.localeCompare(b)).map(([gameId,items])=>({gameId,marks:[...items].sort((a,b)=>Number(a.dateOnly)-Number(b.dateOnly)||Date.parse(a.at)-Date.parse(b.at)||a.entry.id.localeCompare(b.entry.id)||a.kind.localeCompare(b.kind))}));
}
export function timelineGroups(entries:Entry[],preferences:CalendarPreferences,favorites:string[],gameId:string|undefined,now:number,zone:string,days=30){
 const today=dayKey(now,zone),until=new Date(Date.parse(today)+Math.max(1,Math.min(90,days))*DAY).toISOString().slice(0,10);
 const scope=entries.filter(e=>!e.hidden&&!e.recurring&&!e.broadcast&&!e.broadcastRecap&&timedSchedule(e)&&calendarIncludesKind(preferences,e)&&(gameId?e.gameId===gameId:calendarIncludesGame(preferences,e.gameId,favorites)));
 const map=calendarMarks(scope,zone),groups:{date:string;marks:CalendarMark[]}[]=[];
 for(const [date,marks] of map){if(date>=today&&date<=until){const future=marks.filter(m=>m.dateOnly||Date.parse(m.at)>now);if(future.length)groups.push({date,marks:importantMarks(future,now)});}}
 return groups.sort((a,b)=>a.date.localeCompare(b.date));
}
