import type {Entry,Locale,Region} from './types';
import {catalogGames,type SiteSettings} from './editorial';
import {artworkForLocale,previewFocus,serviceArtworkLocale} from './artwork';
import {timedSchedule} from './pickup-history';
import {contentInAudience,audienceRestrictions} from './content-audience';
import {effectiveRegion} from './presentation';
import {contentLanguage} from './content-audience';
import {notificationCharacters} from './notification-voices';
import {reminderRules,type ReminderRules} from './notification-settings';
export const MOBILE_PROTOCOL=1;
declare const __PATCHWORK_BUILD__:string;
export const webRevision=typeof __PATCHWORK_BUILD__==='string'?__PATCHWORK_BUILD__:'development';
export type MobilePreferences={enabled:boolean;locale:Locale;localeMode?:'system'|'manual';region:Region;games:string[];gameRegions:Record<string,Region>;kinds:string[];offsets:number[];starts:boolean;quietEnabled:boolean;quietStart:number;quietEnd:number;followMyGames:boolean;characterTone:boolean;broadcastsEnabled:boolean;broadcastOffsets:number[];notificationRules:ReminderRules};
export const mobileDefaults=(locale:Locale='ko'):MobilePreferences=>({enabled:false,locale,localeMode:'system',region:locale==='ko'?'kr':locale==='ja'?'jp':'global',games:[],gameRegions:{},kinds:['pickup','weapon','event','package'],offsets:[1440,60],starts:true,quietEnabled:true,quietStart:23,quietEnd:8,followMyGames:true,characterTone:false,broadcastsEnabled:false,broadcastOffsets:[15,0],notificationRules:reminderRules(undefined)});
export function mobileFeed(entries:Entry[],settings:SiteSettings,locale:Locale){
 const games=catalogGames(settings),byId=Object.fromEntries(games.map(g=>[g.id,g])),restrict=audienceRestrictions(entries);
 return {schemaVersion:MOBILE_PROTOCOL,webRevision,games:games.map(g=>({id:g.id,name:g.name,regions:g.regions,canonicalRegions:Object.fromEntries(([...new Set<Region>(['kr','jp','global',...g.regions])]).map(r=>[r,effectiveRegion(g,r)]))})),broadcasts:entries.filter(e=>!e.hidden&&e.kind==='update'&&e.sourceKind!=='community'&&!e.pickupArchive&&e.broadcast?.official&&e.broadcast.metadataVerified&&byId[e.gameId]&&byId[e.gameId].regions.includes(e.region)&&contentInAudience(restrict(e),byId[e.gameId],e.region,locale)).map(e=>({id:e.id,gameId:e.gameId,region:e.region,kind:'broadcast',title:e.title,startAt:null,endAt:null,broadcast:e.broadcast,expectedLocale:contentLanguage(byId[e.gameId],e.region,locale)})),entries:entries.filter(e=>!e.hidden&&!e.broadcast&&timedSchedule(e)&&!!(e.startAt||e.endAt)&&byId[e.gameId]&&byId[e.gameId].regions.includes(e.region)&&contentInAudience(restrict(e),byId[e.gameId],e.region,locale)).map(e=>{
  const art=artworkForLocale(e.pickupMembers?.find(m=>m.role!=='rate-up'&&m.imageVerified)||e,locale,'preview',serviceArtworkLocale(e.region,e.gameId));
  return {id:e.id,gameId:e.gameId,region:e.region,kind:e.kind,title:e.title,startAt:e.startAt,endAt:e.endAt,verifiedAt:e.verifiedAt,notificationGroup:e.kind==='pickup'&&e.poolType==='character'?e.pickupGroup:undefined,notificationCharacters:notificationCharacters(e,locale),...art.imageVerified&&art.image?.startsWith('/assets/')?{artwork:{path:art.image,focus:previewFocus(art),bounds:art.previewBounds}}:{}};
 })};
}
