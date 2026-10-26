import registry from '../content/wuwa-character-videos.json' with {type:'json'};
import type {Entry,Locale,VideoClip} from './types';
import {samePickupName} from './pickup-detail';
export function knownWuwaClip(id:string){return [...registry.characters.flatMap(r=>r.clips),...registry.lily.clips].find(v=>v.youtubeId===id) as VideoClip|undefined;}
export function wuwaCharacterVideos(id:string,sourceIds:number[]=[]):VideoClip[]{
 const rows=registry.characters.filter(r=>r.characterId===id||sourceIds.some(n=>r.sourceIds.includes(n)));
 return [...new Map(rows.flatMap(r=>r.clips as VideoClip[]).map(v=>[v.youtubeId,v])).values()];
}
export function preferredWuwaClips(clips:VideoClip[],locale:Locale){
 const language=clips.some(v=>v.locale===locale)?locale:clips.some(v=>v.locale==='en')?'en':clips[0]?.locale;
 return clips.filter(v=>v.locale===language).sort((a,b)=>Number(b.format==='demo')-Number(a.format==='demo'));
}
/** Full public pickup detail only; never expands the initial directory payload. */
export function withWuwaCharacterVideos(entry:Entry):Entry{
 if(entry.gameId!=='wuwa'||entry.kind!=='pickup'||entry.selectionCount||entry.poolType==='support'||entry.editor?.fields.includes('videos'))return entry;
 const featured=entry.pickupMembers?.filter(m=>m.role!=='rate-up'&&m.role!=='candidate').map(m=>m.name);const names=featured?.length?featured:[entry.title];
 const aliases=registry.pickupAliases.filter(a=>a.entryId===entry.id&&a.sourceUrl===entry.sourceUrl);
 const rows=registry.characters.map(row=>({row,members:names.filter(n=>samePickupName(n,row.names)||aliases.some(a=>a.characterId===row.characterId&&samePickupName(n,a.names)))})).filter(r=>r.members.length);
 const additions=[...rows.flatMap(({row,members})=>(row.clips as VideoClip[]).map(v=>({...v,entityNames:[...v.entityNames||[],...members.filter(n=>!v.entityNames?.some(old=>samePickupName(old,n)))]}))),...names.some(n=>samePickupName(n,registry.lily.names))?registry.lily.clips as VideoClip[]:[]];
 if(!additions.length)return entry;
 return {...entry,videos:[...entry.videos||[],...additions.filter(v=>!entry.videos?.some(old=>old.youtubeId===v.youtubeId))].slice(0,30)};
}
