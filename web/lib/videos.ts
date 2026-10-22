import type {Entry,Locale,VideoClip} from './types';
export type LibraryClip=VideoClip&{gameId:string;entryIds:string[]};
export function collectVideos(entries:Entry[],locale:Locale):LibraryClip[]{
 const clips=new Map<string,LibraryClip>();
 for(const e of entries)for(const clip of e.videos||[]){
  if(!clip.official||!clip.metadataVerified||!/^[-\w]{11}$/.test(clip.youtubeId))continue;
  const key=e.gameId+':'+clip.youtubeId,prior=clips.get(key);
  if(prior){if(!prior.entryIds.includes(e.id))prior.entryIds.push(e.id);continue;}
  clips.set(key,{...clip,gameId:e.gameId,entryIds:[e.id]});
 }
 return [...clips.values()].sort((a,b)=>Number(b.locale===locale)-Number(a.locale===locale)||(b.publishedAt||'').localeCompare(a.publishedAt||''));
}
export function youtubeIdFrom(value:string):string|undefined{
 if(/^[\w-]{11}$/.test(value.trim()))return value.trim();
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return undefined;const id=u.hostname==='youtu.be'?u.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)?u.searchParams.get('v')||u.pathname.split('/')[2]:null;return id&&/^[\w-]{11}$/.test(id)?id:undefined;}catch{return undefined;}
}
