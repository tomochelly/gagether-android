import {entryState,liveContent,type Entry} from './types';
import {pickupPeriod} from './pickup-history';
import {env} from 'cloudflare:workers';
// Installed by versioned migration0010; requests never run schema DDL.
export async function healthTable(){}
export async function recordHealth(result:any){
 await healthTable();const row=await env.DB!.prepare("SELECT payload FROM operations_health WHERE key='refresh'").first<{payload:string}>();const old=row?JSON.parse(row.payload):{};
 const bad=['failed','validation-failed'].includes(result.outcome)||!result.ok;
 const checks=[...result.koreanChecks||[],...result.feeds||[],...result.regionalChecks||[],...result.channelChecks||[],...result.broadcastChecks||[],...result.collection?.checks||[],...result.structuredChecks||[]];const sources={...old.sources};
 for(const c of checks){const key=c.source||c.gameId||c.url,previous=sources[key]||{};sources[key]={...c,lastSuccess:c.status==='ok'?c.checkedAt:previous.lastSuccess,consecutiveFailures:c.status==='ok'?0:(previous.consecutiveFailures||0)+1};}
 const value={...old,lastAttempt:result.finishedAt||new Date().toISOString(),lastSuccess:result.ok?result.finishedAt:old.lastSuccess,lastComplete:result.outcome==='complete'?result.finishedAt:old.lastComplete,consecutiveFailures:bad?(old.consecutiveFailures||0)+1:0,outcome:result.outcome||'failed',sources};
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES('refresh',?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(JSON.stringify(value)).run();return value;
}
export function refreshHealth(checks:{status:string}[],valid=true){
 const successful=checks.filter(c=>c.status==='ok').length,failed=checks.length-successful;
 return {outcome:!valid?'validation-failed':!checks.length||!successful?'failed':failed?'partial':'complete',successful,failed,total:checks.length};
}
export function catalogIssues(entries:Entry[],now=Date.now()){
 const issues:{id:string;code:string;detail:string}[]=[],ids=new Set<string>(),rotations=new Map<string,string>();
 for(const e of entries){
  const add=(code:string,detail:string)=>issues.push({id:e.id,code,detail});
  if(ids.has(e.id))add('duplicate-id',e.id);ids.add(e.id);
  if(e.startAt&&e.endAt&&Date.parse(e.startAt)>=Date.parse(e.endAt))add('invalid-window','End is not after start');
  if(e.startAt&&e.endAt&&entryState(e,now)==='active'&&e.pickupArchive?.status!=='forecast'&&!liveContent(e,now))add('active-hidden','Active official rotation excluded');
  if(e.pickupArchive?.status==='forecast'&&(e.startAt||e.endAt))add('forecast-clock','Forecast contains exact timestamps');
  if(['pickup','weapon'].includes(e.kind)&&e.startAt&&e.endAt&&e.pickupArchive?.status!=='forecast'){
   const expected=Date.parse(e.endAt)<=now?'past':Date.parse(e.startAt)>now?'upcoming':'current';if(pickupPeriod(e,now)!==expected)add('state-mismatch',expected);
  }
  for(const m of e.pickupMembers||[]){
   const name=m.name.en||m.name.ko||m.name.ja||m.name.zh;
   if(!name?.trim()||/^\d+$/.test(name)&&!(e.gameId==='reverse1999'&&['6','37','210'].includes(name)))add('invalid-member',name||'Empty member');
   if(m.role==='rate-up')continue;
   // Weapon archives are retained historical provenance but intentionally hidden
   // from weapon lists. A current plain record may reference the same rotation.
   if(e.kind==='weapon'&&e.pickupArchive)continue;
   const key=[e.gameId,e.region,e.poolType||e.kind,e.startAt||e.startDate||e.pickupArchive?.startDate||e.id,name].join('|');
   const previous=rotations.get(key);if(previous&&previous!==e.id)add('duplicate-rotation',previous);else rotations.set(key,e.id);
  }
  if(e.kind==='pickup'&&e.poolType!=='standard'&&e.startAt&&Date.parse(e.startAt)<=now&&!e.endAt&&!e.endDate&&!e.pickupArchive?.endDate)add('missing-end','Started pickup has no verified end');
 }
 return issues;
}
export function readbackIssues(automatic:Entry[],effective:Entry[]){
 const issues=[...catalogIssues(automatic),...catalogIssues(effective)];
 return [...new Map(issues.map(i=>[i.id+'|'+i.code,i])).values()];
}
