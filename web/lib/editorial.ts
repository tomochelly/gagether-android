import type {Entry,Game,Locale} from './types';
import {games,isSupportedSchedule} from './games';
import {ui} from './i18n';
import type {SiteAnnouncement} from './site-announcements';

export type GameAppearance=Partial<Pick<Game,'name'|'short'|'genre'|'color'|'logo'|'icon'|'iconSource'|'art'|'artPosition'|'official'|'publisher'|'regionLabels'>>;
export type SiteSettings={announcements?:SiteAnnouncement[];announcementSeconds?:number;brand?:{name?:string;tagline?:string;logo?:string};carouselSeconds?:number;ui?:Partial<Record<Locale,Partial<Record<keyof typeof ui.ko,string>>>>;games?:Record<string,GameAppearance>};
export type EditorialRecord={key:string;payload:Record<string,unknown>;revision:number;updatedAt:string};
export const emptySettings:SiteSettings={};
export function catalogGames(settings:SiteSettings):Game[]{return games.map(g=>({...g,...settings.games?.[g.id],id:g.id,regions:g.regions,serviceMode:g.serviceMode,scheduleRegions:g.scheduleRegions,regionAliases:g.regionAliases,sources:g.sources}));}
export const catalogUi=(locale:Locale,settings:SiteSettings)=>({...ui[locale],...settings.ui?.[locale]});
export function applyEntryPatch(base:Partial<Entry>|undefined,patch:Record<string,unknown>,id:string){
 const { $unset,...values }=patch;const item={...base,...values,id} as unknown as Record<string,unknown>;
 for(const key of Array.isArray($unset)?$unset:[])if(typeof key==='string')delete item[key];
 return item as unknown as Entry;
}
export function applyEditorial(base:Entry[],records:EditorialRecord[],includeHidden=false){
 const map=new Map(base.filter(e=>isSupportedSchedule(e.gameId,e.region)).map(e=>[e.id,e]));
 for(const record of records){
  if(!record.key.startsWith('entry:'))continue;
  const id=record.key.slice(6);const current=map.get(id);const patch=record.payload;
  const item={...applyEntryPatch(current,patch,id),editor:{revision:record.revision,updatedAt:record.updatedAt,fields:[...Object.keys(patch).filter(k=>k!=='$unset'),...(Array.isArray(patch.$unset)?patch.$unset as string[]:[])]}};
  if(item.gameId&&item.title&&isSupportedSchedule(item.gameId,item.region))map.set(id,item);
 }
 return [...map.values()].map(entry=>recoverReviewedArtwork(entry)).filter(e=>includeHidden||!e.hidden);
}
// Only an exact, reviewed immutable image can repair old missing classifications.
export function recoverReviewedArtwork(entry:Entry,assets=entry.detailImages){
 const reviewed=!entry.imageLocale&&entry.image?assets?.find(art=>art.image===entry.image&&art.imageVerified&&art.imageLocale):undefined;
 if(!reviewed)return entry;
 return {...entry,imageLocale:reviewed.imageLocale,...(entry.editor?.fields.includes('image')&&!entry.editor.fields.includes('imageKind')&&reviewed.imageKind?{imageKind:reviewed.imageKind}:{})};
}
export function preserveEditedSource(incoming:Entry,previous:Entry|undefined,record:EditorialRecord|undefined):Entry|null{
 if(!record)return incoming;
 if(!previous)return null;
 const result={...incoming} as unknown as Record<string,unknown>;
 for(const key of [...Object.keys(record.payload).filter(k=>k!=='$unset'),...(Array.isArray(record.payload.$unset)?record.payload.$unset as string[]:[])]){
  if(key in previous)result[key]=(previous as unknown as Record<string,unknown>)[key];else delete result[key];
 }
 delete result.editor;delete result.hidden;
 return result as unknown as Entry;
}
export function isEditorIdentity(identity:{userId:string;email:string}|null,allowedEmails:string|undefined){
 return !!identity?.userId&&!!identity.email&&!!allowedEmails?.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).includes(identity.email.trim().toLowerCase());
}
