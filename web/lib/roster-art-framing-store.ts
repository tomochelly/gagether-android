import {env} from 'cloudflare:workers';
import {readCharacterRoster} from './character-roster-store';
import {readWuwaReference} from './wuwa-reference-store';
import {rosterArts,type RosterCharacter} from './character-roster';
import {referenceArtwork} from './wuwa-reference-view';
import {rosterArtFramesSchema,rosterArtKey,rosterArtUrl,type RosterArtFrames,type RosterArtPlacement} from './roster-art-framing';
import type {Locale} from './types';
import type {WuwaCharacter} from './wuwa-reference';

const digest=async(value:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function readRosterArtFrames(gameId:string,id?:string){
 const prefix='roster-art:'+gameId+':',query=id?env.DB!.prepare('SELECT key,payload,revision FROM editorial WHERE key=?').bind(rosterArtKey(gameId,id)):env.DB!.prepare('SELECT key,payload,revision FROM editorial WHERE key LIKE ? ORDER BY key').bind(prefix+'%');
 const result=await query.all<{key:string;payload:string;revision:number}>();
 return result.results.map(r=>({id:decodeURIComponent(r.key.slice(prefix.length)),revision:r.revision,value:rosterArtFramesSchema.parse(JSON.parse(r.payload))}));
}
/** Public presentation only. Collection snapshots and their hashes stay untouched. */
export async function readCharacterRosterView(gameId:string){
 const base=await readCharacterRoster(gameId);if(!base)return null;
 const records=await readRosterArtFrames(gameId),known=new Map(records.map(r=>[r.id,r.value.images]));
 return {...base,data:{...base.data,characters:base.data.characters.map(c=>known.has(c.id)?{...c,artworkFrames:known.get(c.id)!}:c)},hash:records.length?await digest({source:base.hash,records}):base.hash};
}
export async function readWuwaReferenceView(){
 const base=await readWuwaReference(),records=await readRosterArtFrames('wuwa'),known=new Map(records.map(r=>[r.id,r.value.images]));
 return {...base,data:{...base.data,characters:base.data.characters.map(c=>known.has(c.id)?{...c,artworkFrames:known.get(c.id)!}:c)},hash:records.length?await digest({source:base.hash,records}):base.hash};
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
