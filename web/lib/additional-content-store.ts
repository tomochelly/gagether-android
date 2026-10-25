import {env} from 'cloudflare:workers';
import type {Entry} from './types';
import {readBaseData,readEditorial,saveEntries,saveEntryChanges} from './store';
import {retryFetch} from './retry-fetch';
import {sameEditValue} from './inline-edit';
import {nativeBody,hololiveArticleLinks,hololiveEntries,limbusEventLinks,limbusCalendarEntry,dnaEventEntries,applyAdditionalContent} from './additional-game-content';
import {additionalOfficialSources} from './additional-game-notices';
import bootstrap from '../content/additional-game-entries.json' with {type:'json'};
const sources=[{gameId:'limbus',url:'https://www.pickupcal.com/games/limbus/'},{gameId:'holodreams',url:'https://gamewith.jp/gamedb/15524/articles'}];
async function html(url:string){const r=await retryFetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);const body=await r.text();if(body.length>3000000||!body.trim())throw Error('Empty or excessive source response');return body;}
/** Predefined, bounded normal collection. No visitor URL, editor API or private upload writes. */
export async function importAdditionalGameContent(gameId?:string){
 if(gameId&&!['dna','limbus','holodreams'].includes(gameId))return {checkedAt:new Date().toISOString(),changedEntries:[],checks:[],outcome:'complete'};
 const key=gameId?'additional-content:'+gameId:'additional-content';
 const startedAt=new Date().toISOString(),now=Date.now();
 const lease=await env.DB!.prepare("INSERT INTO refresh_jobs(id,lease_until,last_started_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET lease_until=excluded.lease_until,last_started_at=excluded.last_started_at WHERE refresh_jobs.lease_until<=?").bind(key,now+20*60000,startedAt,now).run();
 if(!lease.meta.changes)return {checkedAt:startedAt,changedEntries:[],checks:[{source:'additional-content/lease',checkedAt:startedAt,status:'skipped',error:'Another authenticated collection is running'}],outcome:'partial'};
 try{
 const ids=await (gameId?env.DB!.prepare("SELECT id FROM entries WHERE game_id=?").bind(gameId):env.DB!.prepare("SELECT id FROM entries WHERE game_id IN ('limbus','dna','holodreams')")).all<{id:string}>();
 const stored=await readBaseData({ids:ids.results.map(r=>r.id)});if(!stored.persistent)throw Error('New-game originals unavailable');
 const all=new Map(stored.entries.map(e=>[e.id,e])),changed=new Map<string,Entry>(),checks:any[]=[];
 for(const e of (bootstrap as Entry[]).filter(e=>!gameId||e.gameId===gameId))if(!all.has(e.id)){all.set(e.id,e);changed.set(e.id,e);}
 const apply=(rows:Entry[])=>{for(const e of applyAdditionalContent([...all.values()],rows)){all.set(e.id,e);changed.set(e.id,e);}};
 const checkedAt=new Date().toISOString();
 // Exact current Korean event periods remain independent of stale non-Korean website indexes.
 if(!gameId||gameId==='dna')try{
  const source=additionalOfficialSources.find(s=>s.key==='dna/global/ko/steam')!;
  const rows=await source.load(retryFetch as typeof fetch);let count=0;
  for(const n of rows.slice(0,4)){if(!n.bodyHtml)continue;const body=await nativeBody('ko',n.url,n.title,n.bodyHtml,'official',checkedAt),events=await dnaEventEntries(body,n.publishedAt);count+=events.length;apply(events);}
  checks.push({source:'dna/global/events',gameId:'dna',checkedAt,status:count?'ok':'limited',count,...(!count?{error:'No explicit Korean event windows parsed; existing events retained'}:{})});
 }catch(error){checks.push({source:'dna/global/events',gameId:'dna',checkedAt,status:'error',failureKind:'fetch-or-parse',error:error instanceof Error?error.message:'Source unavailable'});}
 for(const source of sources.filter(s=>!gameId||s.gameId===gameId)){
  try{
   const index=await html(source.url),links=source.gameId==='limbus'?limbusEventLinks(index):hololiveArticleLinks(index);if(!links.length)throw Error('No readable same-game source links');
   let count=0;
   for(const url of (gameId?links.slice(0,2):links)){try{const text=await html(url),rows=source.gameId==='limbus'?[limbusCalendarEntry(text,url,checkedAt)]:await hololiveEntries(text,url,checkedAt);apply(rows);count+=rows.length;checks.push({source:'supplement/'+url,gameId:source.gameId,url,checkedAt,status:'ok',count:rows.length,sourceKind:'community'});}catch(error){checks.push({source:'supplement/'+url,gameId:source.gameId,url,checkedAt,status:'error',error:error instanceof Error?error.message:'Source unavailable'});}}
   checks.push({source:'supplement-index/'+source.gameId,gameId:source.gameId,url:source.url,checkedAt,status:count?'ok':'limited',count,sourceKind:'community'});
  }catch(error){checks.push({source:'supplement-index/'+source.gameId,gameId:source.gameId,url:source.url,checkedAt,status:'error',error:error instanceof Error?error.message:'Source unavailable'});}
 }
 const updates=[...changed.values()];for(let i=0;i<updates.length;i+=10)await saveEntryChanges(updates.slice(i,i+10).map(after=>({before:stored.entries.find(e=>e.id===after.id),after})));
 const saved=updates.length?await readBaseData({ids:updates.map(e=>e.id)}):{entries:[],persistent:true};
 const owner=await readEditorial(),protectedField=(id:string,field:string)=>{const p=owner.find(r=>r.key==='entry:'+id)?.payload;return !!p&&(field in p||(p.$unset as string[]||[]).includes(field));};
 if(!saved.persistent||updates.some(e=>!saved.entries.some(s=>s.id===e.id&&(protectedField(e.id,'title')||sameEditValue(s.title,e.title))&&(protectedField(e.id,'sourceBodies')||Object.values(e.sourceBodies||{}).every(body=>sameEditValue(body,s.sourceBodies?.[body.locale]))))))throw Error('New-game content readback failed');
 const result={checkedAt,changedEntries:updates.map(e=>e.id),checks,outcome:checks.every(c=>c.status==='ok')?'complete':checks.some(c=>c.status==='ok')?'partial':'failed'};
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(key,JSON.stringify(result)).run();return result;
 }finally{await env.DB!.prepare("UPDATE refresh_jobs SET lease_until=0,last_finished_at=? WHERE id=? AND last_started_at=?").bind(new Date().toISOString(),key,startedAt).run();}
}
