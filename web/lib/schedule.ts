import {dateInZone} from './display-time';
import {entryState,type Entry,type Locale} from './types';
import {linkedWeaponOnly} from './linked-weapon-presentation';

export const DISPLAY_ZONE='Asia/Tokyo';
export const DAY=86400000;
export function countdownIsUrgent(at:string|undefined,now:number){
 if(!at||/^\d{4}-\d{2}-\d{2}$/.test(at))return false;
 const left=Date.parse(at)-now;
 return left>0&&left<DAY;
}
export const dayKey=(value:string|number,zone=DISPLAY_ZONE)=>dateInZone(value,zone);
export const dayStart=(key:string)=>Date.parse(key+'T00:00:00+09:00');
export function monthCells(month:string):string[]{
 const [year,n]=month.split('-').map(Number);
 const first=Date.UTC(year,n-1,1);
 const weekday=new Date(first).getUTCDay();
 const count=new Date(Date.UTC(year,n,0)).getUTCDate();
 return Array.from({length:Math.ceil((weekday+count)/7)*7},(_,i)=>new Date(first+(i-weekday)*DAY).toISOString().slice(0,10));
}
export const moveMonth=(month:string,amount:number)=>{const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-1+amount,1)).toISOString().slice(0,7);};
export function deadlineUrgency(entry:Entry,now:number):'soon'|'critical'|null{
 if(!entry.endAt||(entry.startAt&&Date.parse(entry.startAt)>now))return null;
 const left=Date.parse(entry.endAt)-now;
 return left>0&&left<=3*DAY?(left<=DAY?'critical':'soon'):null;
}
export function remainingTime(end:string,now:number,locale:Locale){
 const seconds=Math.max(0,Math.floor((Date.parse(end)-now)/1000));
 const d=Math.floor(seconds/86400),h=Math.floor(seconds/3600)%24,m=Math.floor(seconds/60)%60,s=seconds%60;
 const units={ko:['일','시간','분','초'],en:['d','h','m','s'],ja:['日','時間','分','秒'],zh:['天','小时','分','秒']}[locale];
 return (d?`${d}${units[0]} `:'')+[`${h}`,`${m}`,`${s}`].map((n,i)=>n.padStart(2,'0')+units[i+1]).join(' ');
}
export type CalendarMark={entry:Entry;at:string;kind:'starts'|'ends';dateOnly?:boolean};
export function calendarAction(mark:CalendarMark){
 const prefix=mark.entry.poolType==='support'?'support':mark.entry.kind==='pickup'?'pickup':mark.entry.kind==='weapon'?'weapon':mark.entry.kind==='event'?'event':mark.entry.kind==='package'?'sale':'update';
 return `${prefix}${mark.kind==='starts'?'Starts':'Ends'}` as 'pickupStarts'|'pickupEnds'|'weaponStarts'|'weaponEnds'|'supportStarts'|'supportEnds'|'eventStarts'|'eventEnds'|'saleStarts'|'saleEnds'|'updateStarts'|'updateEnds';
}
function markPriority(mark:CalendarMark,now:number){
 const ended=entryState(mark.entry,now)==='ended';
 const rank={pickup:0,event:1,weapon:2,package:3,update:4}[mark.entry.kind];
 return (ended?100:0)+(mark.kind==='ends'&&deadlineUrgency(mark.entry,now)?-20:0)+rank*2+(mark.kind==='ends'?0:1);
}
export function importantMarks(marks:CalendarMark[],now:number){return [...marks].sort((a,b)=>markPriority(a,now)-markPriority(b,now)||Date.parse(a.at)-Date.parse(b.at)||a.entry.id.localeCompare(b.entry.id));}
export function calendarGroups(marks:CalendarMark[],now:number,byGame=false){
 const grouped=new Map<string,{action:ReturnType<typeof calendarAction>;marks:CalendarMark[];ended:boolean}>();
 for(const mark of importantMarks(marks,now)){
  const action=calendarAction(mark);const ended=entryState(mark.entry,now)==='ended';const key=action+':'+ended+(byGame?':'+mark.entry.gameId:'');
  if(!grouped.has(key))grouped.set(key,{action,marks:[],ended});grouped.get(key)!.marks.push(mark);
 }
 return [...grouped.values()];
}
export function calendarMarks(entries:Entry[],zone=DISPLAY_ZONE):Map<string,CalendarMark[]>{
 const map=new Map<string,CalendarMark[]>();
 for(const entry of entries){
   if(entry.pickupArchive?.status==='forecast'||linkedWeaponOnly(entry))continue;
  for(const [kind,at] of [['starts',entry.startAt||entry.startDate||entry.pickupArchive?.startDate],['ends',entry.endAt||entry.endDate||entry.pickupArchive?.endDate]] as const){
   if(!at||!Number.isFinite(Date.parse(at)))continue;
   const dateOnly=/^\d{4}-\d{2}-\d{2}$/.test(at);const key=dateOnly?at:dayKey(at,zone);const list=map.get(key)||[];list.push({entry,at,kind,dateOnly});map.set(key,list);
  }
 }
 for(const list of map.values())list.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.entry.id.localeCompare(b.entry.id));
 return map;
}
export function activeOnDay(entry:Entry,key:string,today:string,zone=DISPLAY_ZONE):boolean{
 if(entry.pickupArchive?.status==='forecast')return false;
 const startDate=entry.startDate||entry.pickupArchive?.startDate,endDate=entry.endDate||entry.pickupArchive?.endDate;
 // Unknown starts must not create historical activity before the review day.
 if(!entry.startAt&&!startDate&&key<today)return false;
 if(!entry.startAt&&!entry.endAt&&!startDate&&!endDate)return false;
 return (entry.startAt?dayKey(entry.startAt,zone)<=key:!startDate||startDate<=key)&&(entry.endAt?dayKey(Date.parse(entry.endAt)-1,zone)>=key:!endDate||endDate>=key);
}
