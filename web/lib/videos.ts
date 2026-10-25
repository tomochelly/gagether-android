import type {Entry,Locale,Region,VideoClip} from './types';
import {byId} from './games';
import {contentLanguage} from './content-audience';
import languageGroups from '../content/video-language-groups.json' with {type:'json'};
export type LibraryClip=VideoClip&{gameId:string;region:Region;entryIds:string[]};
export function collectVideos(entries:Entry[],locale:Locale):LibraryClip[]{
 const clips=new Map<string,LibraryClip>();
 for(const e of entries)for(const clip of e.videos||[]){
  if(!clip.official||!clip.metadataVerified||!/^[-\w]{11}$/.test(clip.youtubeId))continue;
  const key=e.gameId+':'+clip.youtubeId,prior=clips.get(key);
  if(prior){if(!prior.entryIds.includes(e.id))prior.entryIds.push(e.id);continue;}
  clips.set(key,{...clip,gameId:e.gameId,region:e.region,entryIds:[e.id]});
 }
 return [...clips.values()].sort((a,b)=>Number(b.locale===locale)-Number(a.locale===locale)||(b.publishedAt||'').localeCompare(a.publishedAt||''));
}
/** Presentation only: an independent service keeps its native language;
 * shared services follow the display language. English is an honest fallback. */
export function languageScopedVideos(clips:LibraryClip[],locale:Locale):LibraryClip[]{
 const scopes=new Map<string,LibraryClip[]>();
 for(const v of clips){
  // Only explicitly reviewed counterparts share a trailer identity. Do not
  // guess a translation relationship from titles, upload dates or list order.
  const group=languageGroups.find(g=>g.gameId===v.gameId&&Object.values(g.videos).includes(v.youtubeId));
  const key=v.gameId+'|'+v.region+'|'+(group?.id||'unpaired');scopes.set(key,[...scopes.get(key)||[],v]);
 }
 const allowed=new Set<string>();
 for(const rows of scopes.values()){
  const first=rows[0],game=byId[first.gameId],target=game?contentLanguage(game,first.region,locale):locale;
  const language=rows.some(v=>v.locale===target)?target:'en';
  for(const v of rows)if(v.locale===language)allowed.add(v.gameId+':'+v.youtubeId);
 }
 return clips.filter(v=>allowed.has(v.gameId+':'+v.youtubeId));
}
/** Keep all originals in storage and in the explicit video library. */
export function localizeVideoNotices(entries:Entry[],locale:Locale){
 const notices=entries.filter(e=>e.sourceKind==='video'&&e.contentRole==='notice'&&!e.broadcast&&e.videos?.some(v=>v.format==='pv'));
 const candidates=new Set(notices.map(e=>e.id)),allowed=new Set(languageScopedVideos(collectVideos(notices,locale),locale).flatMap(v=>v.entryIds));
 return entries.filter(e=>!candidates.has(e.id)||allowed.has(e.id));
}
export function youtubeIdFrom(value:string):string|undefined{
 if(/^[\w-]{11}$/.test(value.trim()))return value.trim();
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return undefined;const id=u.hostname==='youtu.be'?u.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)?u.searchParams.get('v')||u.pathname.split('/')[2]:null;return id&&/^[\w-]{11}$/.test(id)?id:undefined;}catch{return undefined;}
}
