import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {games} from './games';
import {leakMarker} from './leaks';
import {communityArticleURL,communityResearchSource,communityResearchSources,collectibleCommunitySources,type CommunityResearchSource} from './community-research-sources';
const PREFIX='research-source:',CADENCE=6*60*60*1000,MAX_BYTES=1_000_000;
const stamp=z.string().datetime({offset:true});
const itemSchema=z.object({url:z.string().url().max(2000),title:z.string().min(1).max(300),publishedAt:stamp.nullable(),sourceUpdatedAt:stamp.nullable(),timestampMeaning:z.enum(['wiki-edit','community-post']),sourceKind:z.literal('community'),researchOnly:z.literal(true),requiresLeakGate:z.boolean()}).strict();
export type CommunityResearchItem=z.infer<typeof itemSchema>;
const healthSchema=z.object({version:z.literal(1),sourceId:z.string(),gameId:z.string(),sourceKind:z.literal('community'),researchOnly:z.literal(true),routing:z.enum(['research','leak-gate']),status:z.enum(['checking','ok','unchanged','failed']),attempts:z.number().int().nonnegative(),consecutiveFailures:z.number().int().nonnegative(),lastAttemptAt:stamp,lastCheckedAt:stamp.optional(),updatedAt:stamp.optional(),bodyHash:z.string().regex(/^[a-f0-9]{64}$/).optional(),contentHash:z.string().regex(/^[a-f0-9]{64}$/).optional(),items:z.array(itemSchema).max(5),error:z.string().max(60).optional(),lease:z.object({id:z.string(),expiresAt:stamp}).strict().optional()}).strict();
export type CommunityResearchHealth=z.infer<typeof healthSchema>;
type Outcome={sourceId:string;status:'ok'|'unchanged'|'failed'|'concurrent';changed:boolean;itemCount:number;error?:string};
class ResearchFailure extends Error{constructor(readonly reason:string){super(reason);}}
const db=()=>{if(!env.DB)throw new ResearchFailure('storage-unavailable');return env.DB;};
const hash=async(value:string|Uint8Array)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?new TextEncoder().encode(value):value as Uint8Array<ArrayBuffer>))].map(v=>v.toString(16).padStart(2,'0')).join('');
function entity(text:string){return text.replace(/&(?:#(x[0-9a-f]+|\d+)|([a-z]+));/gi,(whole,n,named)=>{if(n){const point=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return Number.isInteger(point)&&point>=32&&point<=0x10ffff&&!(point>=0xd800&&point<=0xdfff)?String.fromCodePoint(point):'';}return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '} as Record<string,string>)[named.toLowerCase()]??whole;});}
function plain(text:string){return entity(text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<!--[\s\S]*?-->/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ')).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,300);}
function xmlField(body:string,tag:string){return new RegExp('<(?:[A-Za-z0-9_-]+:)?'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?'+tag+'>','i').exec(body)?.[1]||'';}
function actualDate(raw:string,at:string){const value=plain(raw);if(!/(?:T\d{2}:\d{2}[^\s]*(?:Z|[+-]\d{2}:?\d{2})$|\d{1,2}:\d{2}[^\n]*(?:GMT|UTC|[+-]\d{4})$)/i.test(value))return null;const date=Date.parse(value);return Number.isFinite(date)&&date<=Date.parse(at)+86400000?new Date(date).toISOString():null;}
function researchItem(source:CommunityResearchSource,url:string,title:string,date:string|null):CommunityResearchItem{return {url,title,publishedAt:source.collection!.meaning==='wiki-edit'?null:date,sourceUpdatedAt:source.collection!.meaning==='wiki-edit'?date:null,timestampMeaning:source.collection!.meaning,sourceKind:'community',researchOnly:true,requiresLeakGate:source.routing==='leak-gate'||leakMarker(title)};}
/** Only inert titles/dates/declared links; never execute HTML, scripts, entities or source instructions. */
export function parseCommunityResearchItems(sourceId:string,body:string,at=new Date().toISOString()):CommunityResearchItem[]{
 const source=communityResearchSource(sourceId);if(!source?.collection?.enabled)throw new ResearchFailure('unknown-source');
 if(new TextEncoder().encode(body).length>Math.min(MAX_BYTES,source.collection.maxBytes))throw new ResearchFailure('response-too-large');
 const items:CommunityResearchItem[]=[],seen=new Set<string>();let matchingLinks=0;
 const add=(value:string,titleValue:string,dateValue:string)=>{const url=communityArticleURL(sourceId,entity(value.trim())),title=plain(titleValue);if(!url||!title||seen.has(url))return;seen.add(url);matchingLinks++;if(source.collection!.meaning==='wiki-edit'&&(/(?:^|[/:])(?:コメント|comments?|talk|discussion|user)(?:[/:]|$)|雑談掲示板|質問掲示板|^Wiki(?:管理|運営)|^(?:ヘルプ|練習|SandBox|RecentChanges|FrontPage)$/i.test(title)))return;items.push(researchItem(source,url,title,actualDate(dateValue,at)));};
 if(source.collection.kind==='arca-listing'){
  for(const anchor of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
   const className=/\bclass\s*=\s*["']([^"']*)["']/i.exec(anchor[1])?.[1]||'';if(!/\bvrow\b/.test(className)||/\bnotice(?:-[a-z]+)?\b/i.test(className))continue;
   const href=/\bhref\s*=\s*["']([^"']+)["']/i.exec(anchor[1])?.[1];if(!href)continue;
   const title=/<span\b[^>]*class=["'][^"']*\bcol-title\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(anchor[2])?.[1];if(!title)continue;
   const safeTitle=title.replace(/<span\b[^>]*class=["'][^"']*\b(?:comment-count|badge|badges)\b[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,'');
   add(href,safeTitle,/<time\b[^>]*datetime=["']([^"']+)["']/i.exec(anchor[2])?.[1]||'');if(items.length===5)break;
  }
 }else{
  if(/<!ENTITY/i.test(body)||/<!DOCTYPE[^>]*\[/i.test(body))throw new ResearchFailure('xml-entities-rejected');
  if(!/<(?:rss|feed|rdf:RDF)\b/i.test(body))throw new ResearchFailure('unexpected-feed');
  for(const match of body.matchAll(/<(?:[A-Za-z0-9_-]+:)?(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?(?:item|entry)>/gi)){
   const block=match[1],value=xmlField(block,'link').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').trim()||/<(?:[A-Za-z0-9_-]+:)?link\b[^>]*href=["']([^"']+)["']/i.exec(block)?.[1]||'';
   add(value,xmlField(block,'title'),xmlField(block,'pubDate')||xmlField(block,'published')||xmlField(block,'date'));if(items.length===5)break;
  }
 }
 if(!items.length&&!matchingLinks)throw new ResearchFailure('no-matching-items');return items;
}
function validateHealth(raw:string,source:CommunityResearchSource){const health=healthSchema.parse(JSON.parse(raw));if(health.sourceId!==source.id||health.gameId!==source.gameId||health.routing!==source.routing||health.items.some(item=>communityArticleURL(source.id,item.url)!==item.url))throw new ResearchFailure('stored-source-mismatch');return health;}
export async function readCommunityResearchHealth(gameId?:string){
 if(gameId!==undefined&&!games.some(g=>g.id===gameId))return [];
 const sources=communityResearchSources(gameId,{includeLeaks:true}).filter(s=>s.collection?.enabled);if(!sources.length||!env.DB)return [];
 const records=await db().prepare('SELECT key,payload FROM operations_health WHERE key IN ('+sources.map(()=>'?').join(',')+')').bind(...sources.map(s=>PREFIX+s.id)).all<{key:string;payload:string}>();const known=new Map(sources.map(s=>[PREFIX+s.id,s]));
 return records.results.map(row=>validateHealth(row.payload,known.get(row.key)!));
}
async function requestSource(source:CommunityResearchSource,fetcher:typeof fetch){
 const c=source.collection!;let response:Response;
 try{response=await fetcher(c.url,{redirect:'manual',signal:AbortSignal.timeout(5000),headers:{Accept:c.kind==='arca-listing'?'text/html':'application/rss+xml,application/atom+xml,application/xml,text/xml','User-Agent':'GAGETHER/1.0 (+https://gagether.wiki)'}});}catch(error){throw new ResearchFailure(error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'timeout':'transport');}
 if(response.status>=300&&response.status<400){await response.body?.cancel();throw new ResearchFailure('redirect-rejected');}if(!response.ok){await response.body?.cancel();throw new ResearchFailure('http-'+response.status);}if(response.url&&response.url!==c.url){await response.body?.cancel();throw new ResearchFailure('redirect-rejected');}
 const declared=Number(response.headers.get('content-length'));if(Number.isFinite(declared)&&declared>MAX_BYTES){await response.body?.cancel();throw new ResearchFailure('response-too-large');}
 const reader=response.body?.getReader();if(!reader)throw new ResearchFailure('empty-response');const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>Math.min(MAX_BYTES,c.maxBytes)){await reader.cancel();throw new ResearchFailure('response-too-large');}chunks.push(part.value);}}catch(error){if(error instanceof ResearchFailure)throw error;throw new ResearchFailure(error instanceof Error&&['AbortError','TimeoutError'].includes(error.name)?'timeout':'transport');}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return {text:new TextDecoder().decode(bytes),bodyHash:await hash(bytes)};
}
const failureReason=(error:unknown)=>error instanceof ResearchFailure?error.reason:'internal';
/** Per-game fixed inputs, at most2sources/refresh. No Entry, calendar, notices, user or editorial writes. */
export async function refreshCommunityResearch(gameId:string,{at=new Date().toISOString(),fetcher=fetch}:{at?:string;fetcher?:typeof fetch}={}){
 if(!games.some(g=>g.id===gameId))throw new ResearchFailure('invalid-game');if(!Number.isFinite(Date.parse(at)))throw new ResearchFailure('invalid-clock');
 if(!env.DB)return {gameId,status:'unavailable' as const,attempted:0,changed:0,failed:0,retainedFailures:0,remaining:0,sources:[] as Outcome[]};
 const health=await readCommunityResearchHealth(gameId),known=new Map(health.map(h=>[h.sourceId,h])),time=Date.parse(at);
 const eligible=collectibleCommunitySources(gameId).filter(source=>{const old=known.get(source.id);if(old?.lease&&Date.parse(old.lease.expiresAt)>time)return false;return old?.status==='checking'||!old?.lastAttemptAt||time-Date.parse(old.lastAttemptAt)>=CADENCE;}).sort((a,b)=>(known.get(a.id)?.lastAttemptAt||'').localeCompare(known.get(b.id)?.lastAttemptAt||'')||a.id.localeCompare(b.id)),due=eligible.slice(0,2),outcomes:Outcome[]=[];
 for(const source of due){
  const row=await db().prepare('SELECT payload FROM operations_health WHERE key=?').bind(PREFIX+source.id).first<{payload:string}>(),old=row?validateHealth(row.payload,source):undefined;
  // Recheck after the shared selection read: another invocation may have claimed it.
  if(old?.lease&&Date.parse(old.lease.expiresAt)>time||old&&old.status!=='checking'&&time-Date.parse(old.lastAttemptAt)<CADENCE)continue;
  const claim:CommunityResearchHealth={...old,version:1,sourceId:source.id,gameId:source.gameId,sourceKind:'community',researchOnly:true,routing:source.routing,status:'checking',attempts:(old?.attempts||0)+1,consecutiveFailures:old?.consecutiveFailures||0,lastAttemptAt:at,items:old?.items||[],lease:{id:crypto.randomUUID(),expiresAt:new Date(time+20000).toISOString()}},claimRaw=JSON.stringify(claim);
  const reserved=row?await db().prepare('UPDATE operations_health SET payload=? WHERE key=? AND payload=?').bind(claimRaw,PREFIX+source.id,row.payload).run():await db().prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(PREFIX+source.id,claimRaw).run();if(!reserved.meta.changes){outcomes.push({sourceId:source.id,status:'concurrent',changed:false,itemCount:old?.items.length||0});continue;}
  let next:CommunityResearchHealth,changed=false;
  try{const body=await requestSource(source,fetcher),parsed=parseCommunityResearchItems(source.id,body.text,at),items=parsed.length?parsed:old?.items||[],contentHash=await hash(JSON.stringify(items));changed=parsed.length>0&&contentHash!==old?.contentHash;next={...claim,status:changed?'ok':'unchanged',items,contentHash,bodyHash:body.bodyHash,lastCheckedAt:at,updatedAt:changed?at:old?.updatedAt,consecutiveFailures:0};delete next.error;}
  catch(error){next={...claim,status:'failed',error:failureReason(error),consecutiveFailures:(old?.consecutiveFailures||0)+1};}
  delete next.lease;const saved=await db().prepare('UPDATE operations_health SET payload=? WHERE key=? AND payload=?').bind(JSON.stringify(healthSchema.parse(next)),PREFIX+source.id,claimRaw).run();
  outcomes.push(saved.meta.changes?{sourceId:source.id,status:next.status as Outcome['status'],changed,itemCount:next.items.length,...next.error?{error:next.error}:{}}:{sourceId:source.id,status:'concurrent',changed:false,itemCount:old?.items.length||0});
 }
 const handled=new Set(outcomes.map(s=>s.sourceId)),retainedFailures=health.filter(h=>h.status==='failed'&&!handled.has(h.sourceId)).length,remaining=Math.max(0,eligible.length-due.length);
 return {gameId,status:retainedFailures||remaining||outcomes.some(s=>s.status==='failed'||s.status==='concurrent')?'partial' as const:!outcomes.length?'cached' as const:'ok' as const,attempted:outcomes.filter(s=>s.status!=='concurrent').length,changed:outcomes.filter(s=>s.changed).length,failed:outcomes.filter(s=>s.status==='failed').length,retainedFailures,remaining,sources:outcomes};
}
