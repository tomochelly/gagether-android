import {sameEditValue} from './inline-edit';
import {env} from 'cloudflare:workers';
import {readBaseData,readEditorial,saveEntries,saveEntryChanges} from './store';
import {retryFetch} from './retry-fetch';
import {nteProfileSources,nteSourceMatches,parseNteProfile,applyNteProfile,discoverNteSources} from './nte-profiles';
import type {EntityProfile} from './types';
export async function importNteProfiles(force=false,options?:{cursor?:number;limit?:number;timeoutMs?:number}){
 const signal=options?.timeoutMs?()=>AbortSignal.timeout(options.timeoutMs!):undefined;
 const fetchSource=(url:string,init:RequestInit={})=>retryFetch(url,{...init,...(signal?{signal:signal()}: {})});
 const data=await readBaseData({gameId:'nte'});if(!data.persistent)throw Error('Full profile originals unavailable');
 const records=await readEditorial();const ownerProfiles=new Set(records.filter(r=>'entityDetails' in r.payload||(r.payload.$unset as string[]||[]).includes('entityDetails')).map(r=>r.key.slice(6)));
 const row=await env.DB!.prepare("SELECT payload FROM operations_health WHERE key='nte-profiles'").first<{payload:string}>();const prior=row?JSON.parse(row.payload):{},states:any[]=[];let changed=0;
 const targets=data.entries.filter(e=>e.gameId==='nte'&&['pickup','weapon'].includes(e.kind)&&e.pickupArchive?.status!=='past'&&(!e.endAt||Date.parse(e.endAt)>Date.now()));
 let discovery=prior.discovery||{sources:[],checks:[],unmatched:[]};
 if(force||discovery.checks.some((s:any)=>s.status!=='ok')||!discovery.checkedAt||Date.now()-Date.parse(discovery.checkedAt)>6*3600000||targets.some(e=>!discovery.entryIds?.includes(e.id))){
  const found:any[]=[],checks:any[]=[],unmatched:string[]=[];
  for(const kind of ['pickup','weapon'] as const){const url='https://www.kaiden.gg/nte/'+(kind==='pickup'?'characters':'arcs')+'/';try{const r=await fetchSource(url,{redirect:'manual'});if(!r.ok)throw Error('HTTP '+r.status);const parsed=discoverNteSources(targets,await r.text(),kind);found.push(...parsed.sources);unmatched.push(...parsed.unmatched);checks.push({url,status:'ok'});}catch(e){checks.push({url,status:'error',error:e instanceof Error?e.message:'Index failed'});}}
  discovery={checkedAt:new Date().toISOString(),entryIds:targets.map(e=>e.id),sources:[...new Map([...discovery.sources,...found].map((s:any)=>[s.url,s])).values()],checks,unmatched};
 }
 const allSources=[...new Map([...nteProfileSources,...discovery.sources].map((s:any)=>[s.url,s as typeof nteProfileSources[number]])).values()];
 for(const source of allSources.slice(options?.cursor||0,options?.limit?(options.cursor||0)+options.limit:undefined)){
  const entries=targets.filter(e=>nteSourceMatches(e,source)),old=prior.sources?.find((s:any)=>s.url===source.url),checkedAt=new Date().toISOString();
  const newTarget=entries.some(e=>!old?.entryIds?.includes(e.id));
  if(!force&&!newTarget&&old?.status==='ok'&&old?.profile&&Date.now()-Date.parse(old.checkedAt)<6*3600000){states.push(old);continue;}
  let stage='fetch';
  try{
   const response=await fetchSource(source.url,{redirect:'manual'});if(!response.ok)throw Error('HTTP '+response.status);if(!response.headers.get('content-type')?.includes('text/html'))throw Error('Non-HTML profile response');
   const html=await response.text();stage='validation';const parsed=parseNteProfile(html,source,checkedAt),normalized=JSON.stringify({...parsed,verifiedAt:''}),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized)))].map(x=>x.toString(16).padStart(2,'0')).join('');
   const profile=old?.hash===hash?old.profile as EntityProfile:parsed;
   const updates=entries.filter(e=>!ownerProfiles.has(e.id)).map(e=>applyNteProfile(e,profile,old?.profilesByEntry?.[e.id]||old?.profile)).filter(e=>e!==entries.find(x=>x.id===e.id));if(updates.length){await saveEntryChanges(updates.map(after=>({before:entries.find(e=>e.id===after.id),after})));const check=await readBaseData({ids:updates.map(e=>e.id)});if(!check.persistent||updates.some(e=>!sameEditValue(check.entries.find(x=>x.id===e.id)?.entityDetails,e.entityDetails)))throw Error('Profile readback failed');changed+=updates.length;}
   const profilesByEntry={...old?.profilesByEntry};for(const e of updates)profilesByEntry[e.id]=e.entityDetails?.find(p=>p.id===profile.id);
   states.push({url:source.url,checkedAt,status:'ok',hash,profile,profilesByEntry,entryIds:entries.map(e=>e.id),changedEntries:updates.map(e=>e.id)});
  }catch(error){states.push({...old,url:source.url,checkedAt,status:'error',failureKind:stage,sourceAccess:stage==='validation'?'body':'error',error:error instanceof Error?error.message:'Profile collection failed'});}
 }
 const mergedStates=[...new Map([...(prior.sources||[]),...states].map((s:any)=>[s.url,s])).values()] as any[];
 const nextCursor=Math.min((options?.cursor||0)+(options?.limit||allSources.length),allSources.length);
 const result={done:nextCursor>=allSources.length,nextCursor,checkedAt:new Date().toISOString(),changedEntries:changed,discovery,sources:mergedStates,outcome:mergedStates.every(s=>s.status==='ok')&&discovery.checks.every((s:any)=>s.status==='ok')&&!discovery.unmatched.length?'complete':mergedStates.some(s=>s.status==='ok')?'partial':'failed'};
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES('nte-profiles',?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(JSON.stringify(result)).run();return result;
}
