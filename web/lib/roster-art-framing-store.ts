import {readRosterArtFrames} from './roster-art-frame-reader';
import {rosterReadRevision} from './roster-read-revision';
export {readRosterArtFrames} from './roster-art-frame-reader';
import {readCharacterRoster} from './character-roster-store';
import {pinRosterArtworkFrames} from './character-roster-enrichment';
import {readWuwaReference} from './wuwa-reference-store';
import {rosterArts,type RosterCharacter} from './character-roster';
import {referenceArtwork} from './wuwa-reference-view';
import {rosterArtUrl,type RosterArtFrames} from './roster-art-framing';
import type {Locale} from './types';
import type {WuwaCharacter} from './wuwa-reference';

const digest=async(value:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
/** Public presentation only. Collection snapshots and their hashes stay untouched. */
export async function readCharacterRosterView(gameId:string){
 const base=await readCharacterRoster(gameId);if(!base)return null;
 const records=await readRosterArtFrames(gameId),known=new Map(records.map(r=>[r.id,r.value.images]));
 return {...base,data:{...base.data,characters:base.data.characters.map(c=>known.has(c.id)?{...c,artworkFrames:pinRosterArtworkFrames(gameId,c.id,known.get(c.id)!)}:c)},hash:records.length?await digest({source:base.hash,records:records.map(({key,...r})=>r)}):base.hash,cacheRevision:base.delivery==='persistent'||base.delivery==='bootstrap'&&!base.pointer&&!base.error?await rosterReadRevision(gameId,base.pointer,records):undefined};
}
export async function rosterArtSource(gameId:string,id?:string){
 if(gameId==='wuwa'){
  const {data}=await readWuwaReference();if(!id)return {characters:data.characters.map(c=>({id:c.id,name:c.name}))};
  const character=data.characters.find(c=>c.id===id);if(!character)return null;
  return {kind:'wuwa' as const,character,urls:new Set(character.portraits.map((_,i)=>referenceArtwork(character,i)?.url).filter((v):v is string=>!!v).map(rosterArtUrl))};
 }
 const data=await readCharacterRoster(gameId);if(!data)return null;
 if(!id)return {characters:data.data.characters.map(c=>({id:c.id,name:c.name}))};
 const character=data.data.characters.find(c=>c.id===id);if(!character)return null;
 return {kind:'roster' as const,character,urls:new Set((['ko','en','ja','zh'] as Locale[]).flatMap(l=>rosterArts(character,l)).map(a=>rosterArtUrl(a.url)))};
}
export type RosterArtEditorData={kind:'roster'|'wuwa';character:RosterCharacter|WuwaCharacter;frames:RosterArtFrames;revision:number;history:{seq:number;created_at:string;action:string}[]};
