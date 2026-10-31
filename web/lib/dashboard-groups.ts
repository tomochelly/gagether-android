import type {Entry,Game,Locale} from './types';
import {localeCode} from './i18n';
import {linkedWeaponOnly} from './linked-weapon-presentation';
import {entryState} from './types';

// The caller supplies the selected service, language and date scope.
export function dashboardGroups(entries:Entry[],games:Game[],favorites:string[]=[]){
 const buckets=new Map<string,Entry[]>(),seen=new Set<string>();
 for(const e of entries){if(e.hidden||linkedWeaponOnly(e)||seen.has(e.id))continue;seen.add(e.id);buckets.set(e.gameId,[...(buckets.get(e.gameId)||[]),e]);}
 return games.map(game=>({game,entries:buckets.get(game.id)||[]})).filter(g=>g.entries.length).sort((a,b)=>Number(favorites.includes(b.game.id))-Number(favorites.includes(a.game.id)));
}
export function previewGameEntries(entries:Entry[],limit=4){
 limit=Math.max(0,Math.floor(limit));
 if(entries.length<=limit)return entries;
 const pickups=entries.filter(e=>e.kind==='pickup'||e.poolType==='support');
 const updates=entries.filter(e=>e.kind==='update');
 const selected=new Set([...pickups.slice(0,Math.min(2,limit)),...updates.slice(0,Math.max(0,limit-Math.min(2,pickups.length)))]);
 for(const e of entries){if(selected.size>=limit)break;selected.add(e);}
 return entries.filter(e=>selected.has(e));
}
export function groupAgendaRows<T extends {entry:Entry}>(rows:T[]){
 const groups=new Map<string,T[]>();
 for(const row of rows){const key=row.entry.gameId+':'+row.entry.region;groups.set(key,[...(groups.get(key)||[]),row]);}
 return [...groups.entries()].map(([key,items])=>({key,gameId:items[0].entry.gameId,region:items[0].entry.region,rows:items}));
}
export function dashboardEntryDate(entry:Entry,now:number){
 const state=entryState(entry,now),end=entry.endAt||entry.endDate,start=entry.startAt||entry.startDate||entry.pickupArchive?.startDate;
 if(end&&(state==='active'||state==='ended'))return {at:end,kind:state==='active'?'ends' as const:'ended' as const};
 if(start&&state==='upcoming')return {at:start,kind:'starts' as const};
 return {at:entry.publishedAt||start,kind:'notice' as const};
}
export function dashboardDateLabel(at:string,locale:Locale,zone:string){
 const dateOnly=/^\d{4}-\d{2}-\d{2}$/.test(at);
 return new Intl.DateTimeFormat(localeCode[locale],{month:'2-digit',day:'2-digit',timeZone:dateOnly?'UTC':zone}).format(new Date(dateOnly?at+'T12:00:00Z':at));
}
