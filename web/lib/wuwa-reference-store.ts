import {rosterReadChanged} from './public-read-jobs';
import {parseWuwaSplashResolver} from './wuwa-splash-source';
import {env} from 'cloudflare:workers';
import bootstrap from '../content/wuwa-reference.json' with {type:'json'};
import releaseEvidence from '../content/wuwa-release-evidence.json' with {type:'json'};
import {retryFetch} from './retry-fetch';
import {normalizeWuwaCharacters,normalizeWutherTower,normalizeWutherSlash,normalizeWutherMatrix,validateWuwaReference,type WuwaReference,type WuwaCombatCycle} from './wuwa-reference';
import type {Locale} from './types';
const base='https://wutherin.cn-nb1.rains3.com',prefix='wuwa-reference:',cadence=6*3600000,detailRevision=2;
const locales={ko:'ko',en:'en',ja:'ja',zh:'zh-Hans'} as const;
type Plan={type:'tower'|'slash'|'matrix';id:string;expectedFloors?:number};
type Progress={schemaRevision?:number;phase:number;version:string;plans:Plan[];checkedAt:string;characters?:WuwaReference['characters'];cycles:WuwaCombatCycle[];checks:any[];lastSuccessAt?:string};
const db=()=>{if(!env.DB)throw Error('Reference storage unavailable');return env.DB;};
async function get<T>(key:string):Promise<T|undefined>{const row=await db().prepare('SELECT payload FROM operations_health WHERE key=?').bind(prefix+key).first<{payload:string}>();return row?JSON.parse(row.payload):undefined;}
async function put(key:string,value:unknown){await db().prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload').bind(prefix+key,JSON.stringify(value)).run();}
const digest=async(value:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
/** Snapshot chunks are immutable; the pointer moves in the same atomic D1 batch. */
export async function saveWuwaReference(value:WuwaReference){
 validateWuwaReference(value);const {updatedAt,sources,...facts}=value;
 const hash=await digest({...facts,sources:sources.map(({checkedAt,...s})=>s)}),previous=await get<any>('current');
 if(previous?.hash===hash)return {changed:false,hash};
 const records:{key:string;payload:string}[]=[],characterChunks:string[]=[],cycleChunks:string[]=[];
 for(const [name,rows,keys] of [['characters',value.characters,characterChunks],['cycles',value.cycles,cycleChunks]] as const){
  for(let start=0;start<rows.length;start+=8){const key=prefix+'snapshot:'+hash+':'+name+':'+start;keys.push(key);records.push({key,payload:JSON.stringify(rows.slice(start,start+8))});}
 }
 const {characters,cycles,...meta}=value;
 const pointer={hash,meta,characterChunks,cycleChunks};records.push({key:prefix+'snapshot:'+hash+':meta',payload:JSON.stringify(pointer)},{key:prefix+'current',payload:JSON.stringify(pointer)});
 if(records.some(r=>new TextEncoder().encode(r.payload).length>900000))throw Error('Reference chunk exceeds safe storage bound');
 await db().batch(records.map(r=>db().prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload').bind(r.key,r.payload)));
 const check=await readWuwaReference();if(check.hash!==hash||check.data.characters.length!==characters.length||check.data.cycles.length!==cycles.length)throw Error('Reference snapshot readback failed');
 rosterReadChanged('wuwa');return {changed:true,hash};
}
export async function readWuwaReference():Promise<{data:WuwaReference;hash:string;delivery:'snapshot'|'bootstrap'}>{
 const pointer=await get<any>('current');if(!pointer)return {data:bootstrap as WuwaReference,hash:await digest(bootstrap),delivery:'bootstrap'};
 const keys=[...pointer.characterChunks,...pointer.cycleChunks];if(!keys.length||keys.length>100)throw Error('Invalid snapshot manifest');
 const result=await db().prepare('SELECT key,payload FROM operations_health WHERE key IN ('+keys.map(()=>'?').join(',')+')').bind(...keys).all<{key:string;payload:string}>();const rows=new Map(result.results.map(r=>[r.key,r.payload]));
 const list=(part:string[])=>part.flatMap(k=>{const raw=rows.get(k);if(!raw)throw Error('Snapshot chunk missing');const items=JSON.parse(raw);if(!Array.isArray(items))throw Error('Invalid snapshot chunk');return items;});
 return {data:validateWuwaReference({...pointer.meta,characters:list(pointer.characterChunks),cycles:list(pointer.cycleChunks)}),hash:pointer.hash,delivery:'snapshot'};
}
async function response(url:string){
 const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||!['wuther.in','wutherin.cn-nb1.rains3.com','raw.githubusercontent.com'].includes(u.hostname))throw Error('Unapproved reference source');
 const r=await retryFetch(url,{redirect:'manual',headers:{Accept:'application/json,text/html;q=.9,*/*;q=.1','User-Agent':'GAGETHER/1.0 (+https://gagether.wiki)'}},fetch,undefined,2);if(!r.ok)throw Error('HTTP '+r.status);return r;
}
async function boundedText(url:string,max=15000000){const r=await response(url);const reader=r.body?.getReader();if(!reader)throw Error('Empty source');const decoder=new TextDecoder();let text='',bytes=0;try{while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>max)throw Error('Source exceeds size limit');text+=decoder.decode(chunk.value,{stream:true});}return text+decoder.decode();}finally{await reader.cancel().catch(()=>{});}}
async function json(url:string,max=15000000){return JSON.parse(await boundedText(url,max));}
function scripts(html:string){return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>new URL(m[1],'https://wuther.in').href).filter(u=>u.startsWith(base+'/_next/static/chunks/')).slice(0,24);}
export async function discoverWuwaReferenceVersion(){
 const html=await boundedText('https://wuther.in/ko/toa/',3000000);for(const url of scripts(html)){const script=await boundedText(url,2000000);const m=/["']LATEST_DATA_VERSION["'],0,["'](\d+\.\d+\.\d+)["']/.exec(script);if(m)return m[1];}throw Error('Published data version was not found');
}
export function matrixIndexFromHtml(html:string){
 const flight=[...html.matchAll(/self\.__next_f\.push\((\[1,"(?:[^"\\]|\\.)*"\])\)/g)].map(m=>{try{return JSON.parse(m[1])[1]}catch{return ''}}).join('');
 const at=flight.indexOf('"indexData":');if(at<0)throw Error('Matrix index data missing');const start=flight.indexOf('{',at);let depth=0,quoted=false,escaped=false;
 for(let i=start;i<flight.length;i++){const c=flight[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return JSON.parse(flight.slice(start,i+1));}throw Error('Incomplete matrix index');
}
export function chooseWuwaCyclePlans(tower:any,slash:any,matrix:any,date:string):Plan[]{
 const plans:Plan[]=[];
 for(const [type,index] of [['tower',tower],['slash',slash]] as const){if(!Array.isArray(index?.seasons)||!index.seasons.length)throw Error('Missing challenge cycle index');
  const rows=index.seasons.filter((s:any)=>/^\d+$/.test(String(s.id))&&/^\d{4}-\d\d-\d\d$/.test(s.begin)&&/^\d{4}-\d\d-\d\d$/.test(s.end)).sort((a:any,b:any)=>a.begin.localeCompare(b.begin));
  const current=rows.filter((s:any)=>s.begin<=date&&s.end>date),past=rows.filter((s:any)=>s.end<=date).at(-1),next=rows.find((s:any)=>s.begin>date);
  if(!current.length)throw Error('No dated current challenge cycle');for(const s of [...(past?[past]:[]),...current,...(next?[next]:[])])plans.push({type,id:String(s.id),expectedFloors:(s.areas||[]).reduce((n:number,a:any)=>n+Number(a.floorCount||0),0)||undefined});
 }
 if(!Array.isArray(matrix?.cycles)||!matrix.cycles.length)throw Error('Missing matrix cycle index');
 // Matrix has no timestamps: keep these as data occurrences, never assert LIVE/current.
 for(const c of matrix.cycles.slice(0,2)){if(!/^\d+$/.test(String(c.Id)))throw Error('Invalid matrix cycle ID');plans.push({type:'matrix',id:String(c.Id),expectedFloors:c.LevelCount||undefined});}
 return plans;
}
export async function refreshWuwaReferenceStep(force=false){
 const owner=crypto.randomUUID(),now=Date.now(),locked=await db().prepare('INSERT INTO refresh_jobs(id,lease_until,last_started_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET lease_until=excluded.lease_until,last_started_at=excluded.last_started_at WHERE refresh_jobs.lease_until<=?').bind('wuwa-reference-step',now+170000,owner,now).run();
 if(!locked.meta.changes)return {done:false,busy:true,status:'busy',source:'wuwa/global/reference',checkedAt:new Date().toISOString()};
 let p:Progress|undefined;const at=new Date().toISOString();
 try{
  p=await get<Progress>('progress');
  if(!p||p.phase===-1||p.schemaRevision!==detailRevision){if(!force&&p?.schemaRevision===detailRevision&&p?.lastSuccessAt&&now-Date.parse(p.lastSuccessAt)<cadence)return {done:true,skipped:true,status:'ok',source:'wuwa/global/reference',checkedAt:at};p={schemaRevision:detailRevision,phase:0,version:'',plans:[],cycles:[],checks:[],checkedAt:at,lastSuccessAt:p?.lastSuccessAt};}
  if(p.phase===0){
   p.version=await discoverWuwaReferenceVersion();
   const heroes=await db().prepare("SELECT payload FROM entries WHERE game_id='wuwa' AND json_extract(payload,'$.versionHero')=1").all<{payload:string}>();
   const known=heroes.results.map(r=>JSON.parse(r.payload)).flatMap(e=>Object.values(e.title||{}) as string[]).flatMap(t=>t.match(/\b\d+\.\d+\b/g)||[]);
   if(known.length&&!known.includes(p.version.split('.').slice(0,2).join('.')))throw Error('Data version differs from the published game version');
   const [rows,disabled,index,splashResolver,growth]=await Promise.all([json('https://raw.githubusercontent.com/DommyMM/wuwabuild/main/public/Data/Characters.json'),boundedText('https://raw.githubusercontent.com/DommyMM/wuwabuild/main/lib/constants/disabledEntries.ts',20000),json(base+'/data/'+p.version+'/ko/character/index.json',500000),boundedText('https://raw.githubusercontent.com/DommyMM/wuwabuild/main/lib/splashArt.ts',100000),json('https://raw.githubusercontent.com/DommyMM/wuwabuild/main/public/Data/CharacterCurve.json',100000)]);
   const block=/DISABLED_CHARACTER_IDS[^=]*=[\s\S]*?\[([\s\S]*?)\]/.exec(disabled);if(!block)throw Error('Missing release-status gate');const excluded=[...block[1].matchAll(/["'](\d+)["']/g)].map(m=>Number(m[1]));
   const ids=new Set(index.map((r:any)=>r.Id));if(rows.some((r:any)=>!ids.has(r.id))||ids.size!==rows.length)throw Error('Independent character inventories differ');
   if(!growth?.CHARACTER_CURVE?.['90'])throw Error('Missing published character level90 curve');
   p.characters=normalizeWuwaCharacters(rows,releaseEvidence.entries,excluded,parseWuwaSplashResolver(splashResolver),growth?.CHARACTER_CURVE?.['90']);
   if(p.characters.some(c=>!c.stats90||c.chains.length!==6||c.chains.some(chain=>Object.values(chain.description||{}).length!==4||Object.values(chain.description||{}).some(text=>!text||/\{\d+/.test(text)))))throw Error('Incomplete level90 or native resonance-chain detail');
   const old=(await readWuwaReference()).data;const newIds=new Set(p.characters.flatMap(c=>c.sourceIds));if(old.characters.some(c=>c.sourceIds.some(id=>!newIds.has(id))))throw Error('Published character inventory regressed');p.phase=1;
  }else if(p.phase===1){
   const [tower,slash,html]=await Promise.all([json(base+'/data/'+p.version+'/ko/tower/index.json',500000),json(base+'/data/'+p.version+'/ko/slash/index.json',500000),boundedText('https://wuther.in/ko/matrix/',3000000)]);
   p.plans=chooseWuwaCyclePlans(tower,slash,matrixIndexFromHtml(html),at.slice(0,10));p.phase=2;
  }else{
   const plan=p.plans[p.phase-2];if(!plan)throw Error('Missing reference refresh plan');
   const values=await Promise.all(Object.entries(locales).map(async([l,source])=>[l,await json(base+'/data/'+p!.version+'/'+source+'/'+plan.type+'/'+plan.id+'.json',2000000)]));const rows=Object.fromEntries(values) as Record<Locale,any>;
   const cycle=plan.type==='tower'?normalizeWutherTower(rows):plan.type==='slash'?normalizeWutherSlash(rows):normalizeWutherMatrix(rows);if(plan.expectedFloors&&cycle.floors.length!==plan.expectedFloors)throw Error('Challenge floor coverage differs from index');p.cycles=[...p.cycles.filter(c=>c.id!==cycle.id),cycle];p.phase++;
  }
  p.checks.push({phase:p.phase,status:'ok',checkedAt:at});p.checkedAt=at;
  if(p.phase>=2+p.plans.length&&p.plans.length){
   const old=(await readWuwaReference()).data,characters=p.characters!;const cycles=[...new Map([...old.cycles,...p.cycles].map(c=>[c.id,c])).values()];
   const next:WuwaReference={...old,characters,cycles,sourceVersion:p.version,updatedAt:at,sources:old.sources.map(s=>({...s,checkedAt:at})),coverage:{...old.coverage,characterForms:characters.length,sourceCharacters:characters.reduce((n,c)=>n+c.sourceIds.length,0),debutDates:characters.filter(c=>c.debut).length,combatCycles:cycles.length}};
   const saved=await saveWuwaReference(next);p.phase=-1;p.lastSuccessAt=at;delete p.characters;p.cycles=[];await put('progress',p);return {done:true,status:'ok',source:'wuwa/global/reference',checkedAt:at,count:characters.length,...saved};
  }
  await put('progress',p);return {done:false,status:'ok',source:'wuwa/global/reference',checkedAt:at,phase:p.phase,total:p.plans.length?2+p.plans.length:undefined};
 }catch(error){const message=error instanceof Error?error.message:'Reference collection failed';if(p){p.checkedAt=at;p.checks=[...p.checks.slice(-15),{phase:p.phase,status:'error',checkedAt:at,error:message}];await put('progress',p);}return {done:true,status:'error',source:'wuwa/global/reference',checkedAt:at,error:message};
 }finally{await db().prepare('UPDATE refresh_jobs SET lease_until=0 WHERE id=? AND last_started_at=?').bind('wuwa-reference-step',owner).run();}
}
