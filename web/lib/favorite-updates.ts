import type {Entry,Game,Locale,OfficialBroadcast,Region} from './types';
import {availableInLocale,effectiveRegion,inSchedule} from './presentation';
import {dayKey} from './schedule';
import {contentInAudience,audienceRestrictions} from './content-audience';
import {gameBroadcasts,gameBroadcastArchive} from './broadcast-visibility';
export {broadcastState} from './broadcast-visibility';

export const preferredService=(game:Game,region:Region,choices:Partial<Record<string,Region>>)=>effectiveRegion(game,effectiveRegion(game,choices[game.id]||region));
const noticeKey=(e:Entry)=>{try{const u=new URL(e.sourceUrl);u.hash='';for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_'))u.searchParams.delete(key);return u.href;}catch{return e.id;}};
const officialNotice=(e:Entry)=>!e.pickupArchive&&!e.hidden&&((e.sourceKind||'official')==='official'||!!e.broadcast?.official||e.sourceKind==='video'&&!!e.videos?.some(v=>v.official));
export function favoriteNoticeGroups(entries:Entry[],games:Game[],favorites:string[],region:Region,choices:Partial<Record<string,Region>>,locale:Locale){
 const restrict=audienceRestrictions(entries);
 return games.filter(g=>favorites.includes(g.id)).map(game=>{
  const service=preferredService(game,region,choices),grouped=new Map<string,Entry>();
  for(const e of entries){
   if(!contentInAudience(restrict(e),game,service,locale))continue;
   if(e.gameId!==game.id||!officialNotice(e)||!inSchedule(e,game,service)||!availableInLocale(e,locale))continue;
   const key=noticeKey(e),old=grouped.get(key);
   if(!old||e.kind==='update'&&old.kind!=='update'||e.kind===old.kind&&e.sourceLocale===locale&&old.sourceLocale!==locale)grouped.set(key,e);
  }
  const notices=[...grouped.values()].sort((a,b)=>(Date.parse(b.publishedAt||'')||0)-(Date.parse(a.publishedAt||'')||0)||a.id.localeCompare(b.id));
  return {game,region:service,notices};
 });
}
export function favoriteBroadcasts(entries:Entry[],games:Game[],favorites:string[],region:Region,choices:Partial<Record<string,Region>>,locale:Locale,now:number){
 return games.filter(g=>favorites.includes(g.id)).flatMap(game=>gameBroadcasts(entries,game,preferredService(game,region,choices),locale,now));
}
export function favoriteBroadcastArchive(entries:Entry[],games:Game[],favorites:string[],region:Region,choices:Partial<Record<string,Region>>,locale:Locale){
 return games.filter(g=>favorites.includes(g.id)).flatMap(game=>gameBroadcastArchive(entries,game,preferredService(game,region,choices),locale));
}
