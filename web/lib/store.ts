import {englishEntry} from './english-content';
import {readPublicEntryIndex} from './public-entry-index';
import {catalogReadChanged,rosterReadChanged} from './public-read-jobs';
import {separateEntityRewards} from './content-roles';
import {applyMaintainedArtwork} from './maintained-artwork';
import {env} from 'cloudflare:workers';
import {isSupportedSchedule} from './games';
import {seedEntries} from './seed';
import {mergeVerifiedEntry,retainEntityDetails} from './presentation';
import {applyEditorial,preserveEditedSource,recoverReviewedArtwork,type EditorialRecord,type SiteSettings} from './editorial';
import type {Entry,SourceCheck} from './types';
import {catalogEntry} from './catalog-index';
import {enrichEntityDetails} from './entity-catalog';
import {collectionEntry,collectionSql} from './collection-projection';
import {sameEditValue} from './inline-edit';
import {ensureEditorHistory} from './editor-history';
export async function readBaseData(options:{index?:boolean;id?:string;ids?:string[];collection?:boolean;gameId?:string;allSourceChecks?:boolean}={}){
 const seeds=options.id?seedEntries.filter(e=>e.id===options.id):options.ids?seedEntries.filter(e=>options.ids!.includes(e.id)):options.gameId?seedEntries.filter(e=>e.gameId===options.gameId):seedEntries;
 const merged=new Map(seeds.map(e=>[e.id,options.collection?collectionEntry(e):options.index?catalogEntry(e):e]));let sourceChecks:SourceCheck[]=[];let persistent=true;
 try{
  // List requests do not transfer every four-language skill table out of D1.
  const query=options.id?env.DB!.prepare('SELECT payload,updated_at FROM entries WHERE id=?').bind(options.id):options.ids?env.DB!.prepare('SELECT payload,updated_at FROM entries WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(options.ids)):options.gameId?env.DB!.prepare('SELECT '+(options.collection?collectionSql:options.index?"json_remove(payload,'$.entityDetails','$.detailImages','$.detailSections','$.contentBlocks','$.sourceBodies')":'payload')+' AS payload,updated_at FROM entries WHERE game_id=? ORDER BY updated_at DESC').bind(options.gameId):env.DB!.prepare(options.collection?'SELECT '+collectionSql+' AS payload,updated_at FROM entries ORDER BY updated_at DESC':options.index?"SELECT json_remove(payload,'$.entityDetails','$.detailImages','$.detailSections','$.contentBlocks','$.sourceBodies') AS payload,updated_at FROM entries ORDER BY updated_at DESC":'SELECT payload,updated_at FROM entries ORDER BY updated_at DESC');
  const rowsRead=options.index&&!options.collection&&!options.id&&!options.ids?readPublicEntryIndex(env.DB!,options.gameId).catch(()=>query.all<{payload:string;updated_at:string}>()):query.all<{payload:string;updated_at:string}>();
  const [rows,checks]=await Promise.all([rowsRead,(options.id||options.ids)?Promise.resolve({results:[] as SourceCheck[]}):(options.gameId&&!options.allSourceChecks?env.DB!.prepare('SELECT game_id AS gameId,checked_at AS checkedAt,status,count,error FROM source_checks WHERE game_id=?').bind(options.gameId):env.DB!.prepare('SELECT game_id AS gameId,checked_at AS checkedAt,status,count,error FROM source_checks')).all<SourceCheck>().catch(()=>null)]);
  for(const row of rows.results){try{const e=JSON.parse(row.payload) as Entry;if(isSupportedSchedule(e.gameId,e.region)){const mergedEntry=mergeVerifiedEntry(merged.get(e.id),e);merged.set(e.id,options.collection?collectionEntry(mergedEntry):options.index?catalogEntry(mergedEntry,row.updated_at):mergedEntry);}}catch{persistent=false;}}
  sourceChecks=checks?.results||[];if(!checks)persistent=false;
 }catch{persistent=false;}
 return {entries:[...merged.values()],sourceChecks,persistent,serverTime:new Date().toISOString()};
}
export async function readEditorial(key?:string,onFailure?:()=>void):Promise<EditorialRecord[]>{
 try{const query=key?env.DB!.prepare('SELECT key,payload,revision,updated_at AS updatedAt FROM editorial WHERE key=?').bind(key):env.DB!.prepare('SELECT key,payload,revision,updated_at AS updatedAt FROM editorial');const result=await query.all<{key:string;payload:string;revision:number;updatedAt:string}>();return result.results.flatMap(r=>{try{return [{...r,payload:JSON.parse(r.payload)}];}catch{onFailure?.();return [];}});}catch{onFailure?.();return [];}
}
export async function readSiteSettings(){
 let available=true;const records=await readEditorial('site',()=>{available=false;});if(!available)throw Error('Saved settings unavailable');
 const record=records[0];return {settings:(record?.payload||{}) as SiteSettings,settingsRevision:record?.revision||0};
}
async function readUncachedData(options:{includeHidden?:boolean;automatic?:boolean;index?:boolean;collection?:boolean;gameId?:string;allSourceChecks?:boolean}={}){
 let editorialAvailable=true;
 const [base,records]=await Promise.all([readBaseData({index:options.index,collection:options.collection,gameId:options.gameId,allSourceChecks:options.allSourceChecks}),readEditorial(undefined,()=>{editorialAvailable=false;})]);const settings=records.find(r=>r.key==='site');
 let entries=options.automatic?base.entries:applyEditorial(base.entries,records,options.includeHidden);
 if(!options.automatic&&!options.collection&&!options.includeHidden)entries=entries.map(englishEntry);
 if(options.gameId)entries=entries.filter(e=>e.gameId===options.gameId);
 // The lightweight list deliberately excludes detail images. Resolve only old
 // owner replacements lacking locale, using a tiny exact-image SQL projection.
 if(options.index&&!options.automatic)entries=await Promise.all(entries.map(async entry=>{
  if(entry.imageLocale||!entry.image||!entry.editor?.fields.includes('image'))return entry;
  try{const rows=await env.DB!.prepare("SELECT art.value AS asset FROM entries AS e, json_each(e.payload,'$.detailImages') AS art WHERE e.id=? AND json_extract(art.value,'$.image')=? AND json_extract(art.value,'$.imageVerified')=1 AND json_extract(art.value,'$.imageLocale') IN ('ko','en','ja','zh','neutral') LIMIT 1").bind(entry.id,entry.image).all<{asset:string}>();
   return rows.results[0]?recoverReviewedArtwork(entry,[JSON.parse(rows.results[0].asset)]):entry;
  }catch{editorialAvailable=false;return entry;}
 }));
 return {...base,persistent:base.persistent&&editorialAvailable,entries:options.index?entries.map(e=>catalogEntry(e)):entries,settings:(settings?.payload||{}) as SiteSettings,settingsRevision:settings?.revision||0};
}
// Every request owns its DB work. A disconnected request must never leave a
// globally shared unresolved promise behind. Public wire snapshots are cached
// separately only after a complete, editorial-applied read succeeds.
export async function readData(options:{includeHidden?:boolean;automatic?:boolean;index?:boolean;collection?:boolean;gameId?:string;allSourceChecks?:boolean}={}){
 return readUncachedData(options);
}
export async function readEntry(id:string,options:{includeHidden?:boolean;requirePersistent?:boolean}={}){
 let available=true;const [base,records]=await Promise.all([readBaseData({id}),readEditorial('entry:'+id,()=>{available=false;})]);
 if(options.requirePersistent&&(!base.persistent||!available))throw Error('Persistent record unavailable');
 return applyEditorial(base.entries,records,options.includeHidden).find(e=>e.id===id);
}
export async function saveEntries(list:Entry[]){
 if(!list.length)return;
 const [base,records]=await Promise.all([readBaseData({ids:list.map(e=>e.id)}),readEditorial()]);const previous=new Map(base.entries.map(e=>[e.id,e]));const edits=new Map(records.map(r=>[r.key,r]));
 list=list.map(e=>preserveEditedSource(separateEntityRewards(applyMaintainedArtwork(enrichEntityDetails(retainEntityDetails(e,previous.get(e.id))))),previous.get(e.id),edits.get('entry:'+e.id))).filter((e):e is Entry=>!!e&&isSupportedSchedule(e.gameId,e.region));
 const now=new Date().toISOString(),changedGames=new Set<string>();
 for(let i=0;i<list.length;i+=40){const batch=list.slice(i,i+40),results=await env.DB!.batch(list.slice(i,i+40).map(e=>env.DB!.prepare('INSERT INTO entries (id,game_id,payload,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at WHERE entries.payload<>excluded.payload').bind(e.id,e.gameId,JSON.stringify(e),now)));results.forEach((r,index)=>{if(r.meta.changes)changedGames.add(batch[index].gameId)});}
 if(changedGames.size)catalogReadChanged([...changedGames]);
}
const plain=(v:any):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function rebaseEntryChange(before:any,after:any,current:any):any{
 if(sameEditValue(before,after))return current;
 if((plain(before)||before===undefined)&&plain(after)&&plain(current)){
  before=before||{};const result={...current};for(const key of new Set([...Object.keys(before),...Object.keys(after)])){
   if(sameEditValue(before[key],after[key]))continue;
   if(!(key in after))delete result[key];else result[key]=rebaseEntryChange(before[key],after[key],current[key]);
  }return result;
 }return after;
}
/** Full originals only. Field-delta rebase + persistent CAS prevents one game's
 * independent collectors from erasing a body/locale saved during metadata IO. */
export async function saveEntryChanges(changes:{before?:Entry;after:Entry}[]){
 const changedGames=new Set<string>();
 for(const change of changes){
  const {before,after}=change;if(before&&(before.id!==after.id||before.gameId!==after.gameId))throw Error('Entry identity changed');
  let done=false;
  for(let attempt=0;attempt<5;attempt++){
   const snapshot=await env.DB!.prepare('SELECT payload FROM entries WHERE id=?').bind(after.id).first<{payload:string}>();
   const original=snapshot?JSON.parse(snapshot.payload) as Entry:seedEntries.find(e=>e.id===after.id);
   const current=original?mergeVerifiedEntry(seedEntries.find(e=>e.id===after.id),original):undefined;
   const proposed=before?rebaseEntryChange(before,after,current||before):snapshot&&current?{...after,...current}:after;
   let editorReadable=true;const records=await readEditorial('entry:'+after.id,()=>{editorReadable=false;});if(!editorReadable)throw Error('Owner overrides unavailable');
   const next=preserveEditedSource(separateEntityRewards(applyMaintainedArtwork(enrichEntityDetails(retainEntityDetails(proposed,current)))),current,records[0]);
   if(!next||!isSupportedSchedule(next.gameId,next.region))throw Error('Invalid automatic entry');
   if(snapshot&&sameEditValue(JSON.parse(snapshot.payload),next)){done=true;break;}
   const payload=JSON.stringify(next),now=new Date().toISOString();
   const saved=snapshot?await env.DB!.prepare('UPDATE entries SET payload=?,updated_at=? WHERE id=? AND payload=?').bind(payload,now,next.id,snapshot.payload).run():await env.DB!.prepare('INSERT INTO entries(id,game_id,payload,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(next.id,next.gameId,payload,now).run();
   if(saved.meta.changes){done=true;changedGames.add(after.gameId);break;}
  }
  if(!done)throw Error('Concurrent automatic entry changes; retry saved checkpoint');
 }
 if(changedGames.size)catalogReadChanged([...changedGames]);
}
export async function writeEditorial(key:string,payload:Record<string,unknown>,expectedRevision:number,userId:string){
 await ensureEditorHistory();
 const now=new Date().toISOString();
 const query=expectedRevision===0?env.DB!.prepare('INSERT INTO editorial (key,payload,revision,updated_at,updated_by) VALUES (?,?,1,?,?) ON CONFLICT(key) DO NOTHING').bind(key,JSON.stringify(payload),now,userId):env.DB!.prepare('UPDATE editorial SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE key=? AND revision=?').bind(JSON.stringify(payload),now,userId,key,expectedRevision);
 // D1 can count audit-trigger writes too. A rejected single-row CAS changes0.
 const result=await query.run();if(result.meta.changes>0)editorialReadChanged(key);return result.meta.changes>0;
}
export async function resetEditorial(key:string,expectedRevision:number,actor='owner-reset'){await ensureEditorHistory();const results=await env.DB!.batch([env.DB!.prepare('UPDATE editorial SET updated_by=? WHERE key=? AND revision=?').bind(actor,key,expectedRevision),env.DB!.prepare('DELETE FROM editorial WHERE key=? AND revision=?').bind(key,expectedRevision)]);if(results[1].meta.changes>0)editorialReadChanged(key);return results[1].meta.changes>0;}
function editorialReadChanged(key:string){if(key.startsWith('roster-art:'))rosterReadChanged(key.split(':')[1]);else if(key==='site'||key.startsWith('entry:'))catalogReadChanged();}
export async function saveCheck(check:SourceCheck){
 await env.DB!.prepare('INSERT INTO source_checks (game_id,checked_at,status,count,error) VALUES (?,?,?,?,?) ON CONFLICT(game_id) DO UPDATE SET checked_at=excluded.checked_at,status=excluded.status,count=excluded.count,error=excluded.error').bind(check.gameId,check.checkedAt,check.status,check.count,check.error||null).run();
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
