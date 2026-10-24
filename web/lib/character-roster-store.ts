import {env} from 'cloudflare:workers';
import {characterRosterSchema,type CharacterRoster} from './character-roster';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
import {enrichCharacterRoster,retainCharacterFacts} from './character-roster-enrichment';
const key=(g:string)=>'character-roster:'+g;
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
export async function rosterHash(data:CharacterRoster){const {checkedAt,...facts}=data;return hash(JSON.stringify(facts));}
export async function readCharacterRoster(gameId:string){
 const fallback=(bootstrap as CharacterRoster[]).find(r=>r.gameId===gameId);let failure:string|undefined,expectedPointer:string|undefined;
 try{const row=await env.DB!.prepare('SELECT payload FROM operations_health WHERE key=?').bind(key(gameId)).first<{payload:string}>();if(row){expectedPointer=row.payload;const pointer=JSON.parse(row.payload);for(const value of [pointer.hash,pointer.previousHash].filter(Boolean)){try{const object=await env.BUCKET!.get(`character-rosters/${gameId}/${value}.json`);if(!object)throw Error('Snapshot missing');const data=characterRosterSchema.parse(await object.json());if(data.gameId!==gameId||await rosterHash(data)!==value)throw Error('Snapshot hash mismatch');const enriched=characterRosterSchema.parse(enrichCharacterRoster(data));return {data:enriched,hash:await rosterHash(enriched),storageHash:value,delivery:value===pointer.hash?'persistent':'last-good',pointer:expectedPointer,error:failure};}catch(e){failure=e instanceof Error?e.message:'Snapshot unavailable';}}}}catch(e){failure=e instanceof Error?e.message:'Storage unavailable';}
 if(!fallback)return null;const data=characterRosterSchema.parse(fallback);return {data,hash:await rosterHash(data),storageHash:undefined,delivery:'bootstrap',pointer:expectedPointer,error:failure};
}
export async function saveCharacterRoster(input:CharacterRoster){
 const source=characterRosterSchema.parse(input),prior=await readCharacterRoster(source.gameId);
 if(prior&&source.characters.length<prior.data.characters.length*.8)throw Error('Partial source inventory; keeping last-good roster');
 const data=characterRosterSchema.parse(enrichCharacterRoster(source)),seen=new Set(data.characters.map(c=>c.id));
 if(prior&&data.characters.length<prior.data.characters.length*.8)throw Error('Partial source inventory; keeping last-good roster');
 const retained=prior?.data.characters.filter(c=>!seen.has(c.id))||[];const oldRows=new Map(prior?.data.characters.map(c=>[c.id,c])||[]);const incoming=data.characters.map(c=>{const old=oldRows.get(c.id);return old?retainCharacterFacts(c,old):c;});const merged=characterRosterSchema.parse({...data,characters:[...incoming,...retained].sort((a,b)=>a.id.localeCompare(b.id,'en',{numeric:true})),coverage:{...data.coverage,includedCount:data.characters.length+retained.length}}),value=await rosterHash(merged);
 if(prior?.storageHash===value&&prior.delivery==='persistent')return {changed:false,count:merged.characters.length,hash:value};
 const payload=JSON.stringify(merged),objectKey=`character-rosters/${data.gameId}/${value}.json`;await env.BUCKET!.put(objectKey,payload,{httpMetadata:{contentType:'application/json'},customMetadata:{sha256:value,gameId:data.gameId}});
 const check=await env.BUCKET!.get(objectKey);if(!check||await rosterHash(characterRosterSchema.parse(await check.json()))!==value)throw Error('Roster snapshot readback failed');
 const pointer=JSON.stringify({hash:value,previousHash:prior?.storageHash||prior?.hash,count:merged.characters.length,checkedAt:merged.checkedAt});
 const result=prior?.pointer?await env.DB!.prepare('UPDATE operations_health SET payload=? WHERE key=? AND payload=?').bind(pointer,key(data.gameId),prior.pointer).run():await env.DB!.prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(key(data.gameId),pointer).run();
 if(!result.meta.changes)throw Error('Concurrent roster snapshot won');return {changed:true,count:merged.characters.length,retained:retained.length,hash:value};
}
export async function characterRosterHealth(){const rows=await env.DB!.prepare("SELECT payload FROM operations_health WHERE key LIKE 'character-roster-health:%'").all<{payload:string}>();return rows.results.map(x=>JSON.parse(x.payload));}
