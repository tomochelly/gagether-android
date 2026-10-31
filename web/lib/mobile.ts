import type {Entry,Locale,Region} from './types';
import {catalogGames,type SiteSettings} from './editorial';
import {artworkForLocale,previewFocus,serviceArtworkLocale} from './artwork';
import {timedSchedule} from './pickup-history';
import {contentInAudience,audienceRestrictions} from './content-audience';
import {effectiveRegion} from './presentation';
import {sharedGfl2Schedules} from './gfl2-shared-schedule';
import {contentLanguage} from './content-audience';
import {notificationCharacters} from './notification-voices';
import {reminderRules,type ReminderRules} from './notification-settings';
import {isNoteDate} from './personal-notes';
import {dayKey} from './schedule';
import {displayZone} from './display-time';
import {recurringDisplayEntry} from './recurring-schedule';
import {recurringScheduleEntries} from './recurring-events';
export const MOBILE_PROTOCOL=1;
declare const __PATCHWORK_BUILD__:string;
export const webRevision=typeof __PATCHWORK_BUILD__==='string'?__PATCHWORK_BUILD__:'development';
export type MobilePreferences={enabled:boolean;ownerPushEnabled:boolean;locale:Locale;localeMode?:'system'|'manual';region:Region;games:string[];gameRegions:Record<string,Region>;kinds:string[];offsets:number[];starts:boolean;quietEnabled:boolean;quietStart:number;quietEnd:number;followMyGames:boolean;characterTone:boolean;broadcastsEnabled:boolean;broadcastOffsets:number[];notificationRules:ReminderRules};
export const mobileDefaults=(locale:Locale='ko'):MobilePreferences=>({enabled:false,ownerPushEnabled:false,locale,localeMode:'system',region:locale==='ko'?'kr':locale==='ja'?'jp':'global',games:[],gameRegions:{},kinds:['pickup','weapon','event','package'],offsets:[1440,60],starts:true,quietEnabled:true,quietStart:23,quietEnd:8,followMyGames:true,characterTone:false,broadcastsEnabled:false,broadcastOffsets:[15,0],notificationRules:reminderRules(undefined)});
/** Native reminders need current records, the 90-day alarm horizon and a short
 * late-delivery window. The complete web/archive records remain untouched. */
export function mobileReminderWindow(e:Pick<Entry,'startAt'|'endAt'>,now:number){
 const start=Date.parse(e.startAt||''),end=Date.parse(e.endAt||'');
 return Number.isFinite(end)&&end>=now&&(!Number.isFinite(start)||start<=now)||[start,end].some(at=>Number.isFinite(at)&&at>=now-6*3600000&&at<=now+90*86400000);
}
/** Date-only facts are for display, never converted into notification clocks. */
export function mobileWidgetDateWindow(e:Entry,locale:Locale,now:number){
 if(e.startAt||e.endAt||!timedSchedule(e))return false;
 const start=e.startDate||e.pickupArchive?.startDate,end=e.endDate||e.pickupArchive?.endDate;
 if(start&&!isNoteDate(start)||end&&!isNoteDate(end)||!start&&!end||start&&end&&end<start)return false;
 // English uses the device zone in the app. Keep a one-day envelope here so
 // the server's UTC date cannot prematurely discard an American date row.
 const today=dayKey(now-(locale==='en'?86400000:0),displayZone(locale)),horizon=dayKey(now+(locale==='en'?91:90)*86400000,displayZone(locale));
 return end?end>=today&&(!start||start<=horizon):!!start&&start>=today&&start<=horizon;
}
export function mobileFeed(entries:Entry[],settings:SiteSettings,locale:Locale,allowedGameIds?:readonly string[],now=Date.now()){
 entries=sharedGfl2Schedules(recurringScheduleEntries(entries,locale,now).map(e=>recurringDisplayEntry(e,now)),locale);
 const games=catalogGames(settings).filter(g=>!g.launch&&(!allowedGameIds||allowedGameIds.includes(g.id))),byId=Object.fromEntries(games.map(g=>[g.id,g])),restrict=audienceRestrictions(entries);
 return {schemaVersion:MOBILE_PROTOCOL,webRevision,widgetEntries:entries.filter(e=>!e.hidden&&!e.broadcast&&mobileWidgetDateWindow(e,locale,now)&&byId[e.gameId]&&byId[e.gameId].regions.includes(e.region)&&contentInAudience(restrict(e),byId[e.gameId],e.region,locale)).map(e=>({id:e.id,gameId:e.gameId,region:e.region,kind:e.kind,title:e.title,startAt:null,endAt:null,startDate:e.startDate||e.pickupArchive?.startDate||null,endDate:e.endDate||e.pickupArchive?.endDate||null,dateOnly:true,sourceKind:'official',verifiedAt:e.verifiedAt})),games:games.map(g=>({id:g.id,name:g.name,regions:g.regions,canonicalRegions:Object.fromEntries(([...new Set<Region>(['kr','jp','global',...g.regions])]).map(r=>[r,effectiveRegion(g,r)]))})),broadcasts:entries.filter(e=>!e.hidden&&e.kind==='update'&&e.sourceKind!=='community'&&!e.pickupArchive&&e.broadcast?.official&&['scheduled','live'].includes(e.broadcast.status)&&e.broadcast.metadataVerified&&byId[e.gameId]&&byId[e.gameId].regions.includes(e.region)&&contentInAudience(restrict(e),byId[e.gameId],e.region,locale)).map(e=>({id:e.id,gameId:e.gameId,region:e.region,kind:'broadcast',title:e.title,startAt:null,endAt:null,broadcast:e.broadcast,expectedLocale:contentLanguage(byId[e.gameId],e.region,locale)})),entries:entries.filter(e=>!e.hidden&&!e.broadcast&&timedSchedule(e)&&mobileReminderWindow(e,now)&&!!(e.startAt||e.endAt)&&byId[e.gameId]&&byId[e.gameId].regions.includes(e.region)&&contentInAudience(restrict(e),byId[e.gameId],e.region,locale)).map(e=>{
  const art=artworkForLocale(e.pickupMembers?.find(m=>m.role!=='rate-up'&&m.imageVerified)||e,locale,'preview',serviceArtworkLocale(e.region,e.gameId));
  return {id:e.id,gameId:e.gameId,region:e.region,kind:e.kind,title:e.title,startAt:e.startAt,endAt:e.endAt,verifiedAt:e.verifiedAt,notificationGroup:e.kind==='pickup'&&e.poolType==='character'?e.pickupGroup:undefined,notificationCharacters:notificationCharacters(e,locale),...art.imageVerified&&art.image?.startsWith('/assets/')?{artwork:{path:art.image,focus:previewFocus(art),bounds:art.previewBounds}}:{}};
 })};
}
