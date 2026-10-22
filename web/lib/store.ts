import {env} from 'cloudflare:workers';
import {isSupportedSchedule} from './games';
import {seedEntries} from './seed';
import {mergeVerifiedEntry,retainEntityDetails} from './presentation';
import {applyEditorial,preserveEditedSource,recoverReviewedArtwork,type EditorialRecord,type SiteSettings} from './editorial';
import type {Entry,SourceCheck} from './types';
import {catalogEntry} from './catalog-index';
import {ensureEditorHistory} from './editor-history';
export async function readBaseData(options:{index?:boolean;id?:string}={}){
 const seeds=options.id?seedEntries.filter(e=>e.id===options.id):seedEntries;
 const merged=new Map(seeds.map(e=>[e.id,options.index?catalogEntry(e):e]));let sourceChecks:SourceCheck[]=[];let persistent=true;
 try{
  // List requests do not transfer every four-language skill table out of D1.
  const query=options.id?env.DB!.prepare('SELECT payload,updated_at FROM entries WHERE id=?').bind(options.id):env.DB!.prepare(options.index?"SELECT json_remove(payload,'$.entityDetails','$.detailImages','$.detailSections') AS payload,updated_at FROM entries ORDER BY updated_at DESC":'SELECT payload,updated_at FROM entries ORDER BY updated_at DESC');
  const [rows,checks]=await Promise.all([query.all<{payload:string;updated_at:string}>(),options.id?Promise.resolve({results:[] as SourceCheck[]}):env.DB!.prepare('SELECT game_id AS gameId,checked_at AS checkedAt,status,count,error FROM source_checks').all<SourceCheck>().catch(()=>null)]);
  for(const row of rows.results){try{const e=JSON.parse(row.payload) as Entry;if(isSupportedSchedule(e.gameId,e.region)){const mergedEntry=mergeVerifiedEntry(merged.get(e.id),e);merged.set(e.id,options.index?catalogEntry(mergedEntry,row.updated_at):mergedEntry);}}catch{persistent=false;}}
  sourceChecks=checks?.results||[];if(!checks)persistent=false;
 }catch{persistent=false;}
 return {entries:[...merged.values()],sourceChecks,persistent,serverTime:new Date().toISOString()};
}
export async function readEditorial(key?:string,onFailure?:()=>void):Promise<EditorialRecord[]>{
 try{const query=key?env.DB!.prepare('SELECT key,payload,revision,updated_at AS updatedAt FROM editorial WHERE key=?').bind(key):env.DB!.prepare('SELECT key,payload,revision,updated_at AS updatedAt FROM editorial');const result=await query.all<{key:string;payload:string;revision:number;updatedAt:string}>();return result.results.flatMap(r=>{try{return [{...r,payload:JSON.parse(r.payload)}];}catch{onFailure?.();return [];}});}catch{onFailure?.();return [];}
}
async function readUncachedData(options:{includeHidden?:boolean;automatic?:boolean;index?:boolean}={}){
 let editorialAvailable=true;
 const [base,records]=await Promise.all([readBaseData({index:options.index}),readEditorial(undefined,()=>{editorialAvailable=false;})]);const settings=records.find(r=>r.key==='site');
 let entries=options.automatic?base.entries:applyEditorial(base.entries,records,options.includeHidden);
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
export async function readData(options:{includeHidden?:boolean;automatic?:boolean;index?:boolean}={}){
 return readUncachedData(options);
}
export async function readEntry(id:string){
 const [base,records]=await Promise.all([readBaseData({id}),readEditorial('entry:'+id)]);
 return applyEditorial(base.entries,records).find(e=>e.id===id);
}
export async function saveEntries(list:Entry[]){
 if(!list.length)return;
 const [base,records]=await Promise.all([readBaseData(),readEditorial()]);const previous=new Map(base.entries.map(e=>[e.id,e]));const edits=new Map(records.map(r=>[r.key,r]));
 list=list.map(e=>preserveEditedSource(retainEntityDetails(e,previous.get(e.id)),previous.get(e.id),edits.get('entry:'+e.id))).filter((e):e is Entry=>!!e&&isSupportedSchedule(e.gameId,e.region));
 const now=new Date().toISOString();
 for(let i=0;i<list.length;i+=40){await env.DB!.batch(list.slice(i,i+40).map(e=>env.DB!.prepare('INSERT INTO entries (id,game_id,payload,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at').bind(e.id,e.gameId,JSON.stringify(e),now)));}
}
export async function writeEditorial(key:string,payload:Record<string,unknown>,expectedRevision:number,userId:string){
 await ensureEditorHistory();
 const now=new Date().toISOString();
 const query=expectedRevision===0?env.DB!.prepare('INSERT INTO editorial (key,payload,revision,updated_at,updated_by) VALUES (?,?,1,?,?) ON CONFLICT(key) DO NOTHING').bind(key,JSON.stringify(payload),now,userId):env.DB!.prepare('UPDATE editorial SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE key=? AND revision=?').bind(JSON.stringify(payload),now,userId,key,expectedRevision);
 const result=await query.run();return result.meta.changes===1;
}
export async function resetEditorial(key:string,expectedRevision:number,actor='owner-reset'){await ensureEditorHistory();const results=await env.DB!.batch([env.DB!.prepare('UPDATE editorial SET updated_by=? WHERE key=? AND revision=?').bind(actor,key,expectedRevision),env.DB!.prepare('DELETE FROM editorial WHERE key=? AND revision=?').bind(key,expectedRevision)]);return results[1].meta.changes===1;}
export async function saveCheck(check:SourceCheck){
 await env.DB!.prepare('INSERT INTO source_checks (game_id,checked_at,status,count,error) VALUES (?,?,?,?,?) ON CONFLICT(game_id) DO UPDATE SET checked_at=excluded.checked_at,status=excluded.status,count=excluded.count,error=excluded.error').bind(check.gameId,check.checkedAt,check.status,check.count,check.error||null).run();
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
