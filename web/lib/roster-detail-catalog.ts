import {retainCharacterFacts} from './character-roster-enrichment';
import {pinRosterFactIcons} from './roster-detail-icons';
import {rosterDetailFieldsSchema} from './character-roster';
import type {CharacterRoster,RosterCharacter} from './character-roster';
import type {z} from 'zod';
type Fields=z.infer<typeof rosterDetailFieldsSchema>;
const decoded=new Map<string,Promise<Fields>>();
async function unpack(id:string,form:{sourceId:string|number;sha256:string;bytes:number;payload:string}){
 const key=form.sha256+'|'+form.bytes+'|'+id+'|'+form.sourceId,existing=decoded.get(key);if(existing)return existing;
 const pending=(async()=>{
  const input=Uint8Array.from(atob(form.payload),c=>c.charCodeAt(0)),reader=new Blob([input]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>form.bytes||size>1000000){await reader.cancel();throw Error('Detail original exceeds declared size');}chunks.push(value);}}finally{reader.releaseLock();}
  if(size!==form.bytes)throw Error('Detail original size mismatch');const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==form.sha256)throw Error('Detail original hash mismatch');
  const original=JSON.parse(new TextDecoder().decode(bytes));if(original?.id!==id||original.sourceId!==form.sourceId||Object.keys(original).some(k=>!['id','sourceId','details'].includes(k)))throw Error('Packed detail identity mismatch');
  return rosterDetailFieldsSchema.parse(original.details);
 })();decoded.set(key,pending);if(decoded.size>8)decoded.delete(decoded.keys().next().value!);
 try{return await pending;}catch(e){decoded.delete(key);throw e;}
}
/** Expand one exact form only. The native catalog never enters directory props. */
export async function hydrateRosterDetails(data:CharacterRoster,character:RosterCharacter):Promise<RosterCharacter>{
 if(data.gameId!=='umamusume'||!data.detailCatalog)return character;
 const catalog=data.detailCatalog,form=catalog.forms[character.id];if(!form||form.sourceId!==character.sourceId)return character;
 let fields:Fields;
 if(catalog.version===3)fields=await unpack(character.id,catalog.forms[character.id]);
 else{
  const {sourceId,skillRefs,regionalSkillRefs,horseId,...own}=catalog.forms[character.id];
  const regionalSkillTables=regionalSkillRefs&&Object.fromEntries(Object.entries(regionalSkillRefs).map(([region,refs])=>[region,refs!.map(ref=>catalog.skills[ref])]));
  fields={...own,...skillRefs?{skillTables:skillRefs.map(ref=>catalog.skills[ref])}:{},...regionalSkillTables?{regionalSkillTables}:{},...horseId&&catalog.horses?.[horseId]?{historicalBackground:catalog.horses[horseId]}:{}};
 }
 const extra={...character,...fields};
 return pinRosterFactIcons(retainCharacterFacts(extra,character),data.gameId);
}
/** New source blocks must all validate before a persistent pointer can advance. */
export async function validateRosterDetailCatalog(data:CharacterRoster){
 if(data.detailCatalog?.version===3)for(const c of data.characters)if(data.detailCatalog.forms[c.id])await hydrateRosterDetails(data,c);
}
