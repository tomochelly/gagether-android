import {env} from 'cloudflare:workers';
import {games} from './games';
import {checkpointedRefresh,type RefreshTaskOptions} from './refresh-progress';
export const refreshLanes=['broadcasts','notices','uploads','details'] as const;
export type RefreshLane=typeof refreshLanes[number]|'maintenance';
export type GameRefreshTask=RefreshTaskOptions&{gameId:string;lane:RefreshLane;intervalMinutes:number};
const cadence={broadcasts:2,notices:3,uploads:3,details:30,maintenance:30};
const starts={broadcasts:'known-broadcasts',notices:'korean',uploads:'uploads',details:'collection',maintenance:'leaks'};
export function refreshTask(gameId:string,lane:string):GameRefreshTask|null{
 if(lane==='maintenance'&&gameId!=='all'||lane!=='maintenance'&&!games.some(g=>g.id===gameId)||!Object.hasOwn(cadence,lane))return null;
 const typed=lane as RefreshLane,intervalMinutes=cadence[typed];
 return {key:'official-game:'+gameId+':'+typed+(gameId==='wuwa'&&typed==='details'?':v2':''),gameId,lane:typed,firstStage:starts[typed],intervalMinutes,intervalMs:intervalMinutes*60000};
}
export const gameRefreshTasks:GameRefreshTask[]=[...games.flatMap(g=>refreshLanes.map(l=>refreshTask(g.id,l)!)),refreshTask('all','maintenance')!];
export function nextRefreshStage(p:{lane?:string;gameId?:string},stage:string):string{
 const plans:Record<string,string[]>={notices:['korean','feeds','regional','notice-bodies','finalize'],uploads:['uploads','finalize'],broadcasts:['known-broadcasts','channels','broadcasts','finalize'],details:['collection',...(['limbus','dna','holodreams'].includes(p.gameId||'')?['additional']:[]),'artwork',...(p.gameId==='nte'?['profiles']:[]),...(p.gameId==='wuwa'?['weapons']:[]),'recaps',...(p.gameId==='wuwa'?['reference']:['rosters']),'finalize'],maintenance:['leaks','finalize']};
 const plan=p.lane?plans[p.lane]:['korean','uploads','feeds','regional','channels','broadcasts','recaps','collection','reference','leaks','rosters','finalize'];
 if(!plan||!plan.includes(stage))throw Error('Invalid refresh task stage');return plan[plan.indexOf(stage)+1]||'finalize';
}
export async function runGameRefresh(task:GameRefreshTask,perform:(p:any)=>Promise<any>,now=Date.now()){
 return checkpointedRefresh(perform,now,task);
}
function publicResult(value:any){
 if(!value)return null;const {ok,outcome,partial,continuation,runId,stage,cursor,startedAt,finishedAt,progressAt,readback,noticesAdded,error,successful,failed,total}=value;
 return {ok,outcome,partial,continuation,runId,stage,cursor,startedAt,finishedAt,progressAt,readback,noticesAdded,error,successful,failed,total};
}
export async function readRefreshTasks(){
 const rows=await env.DB!.prepare("SELECT id,last_started_at,last_finished_at,result FROM refresh_jobs WHERE id LIKE 'official-game:%' AND id NOT LIKE '%-step'").all<{id:string;last_started_at:string;last_finished_at:string;result:string}>();
 const healthRows=await env.DB!.prepare("SELECT key,payload FROM operations_health WHERE key LIKE 'refresh-health:official-game:%'").all<{key:string;payload:string}>();
 const health=new Map(healthRows.results.map(r=>[r.key.slice('refresh-health:'.length),JSON.parse(r.payload)]));
 return gameRefreshTasks.map(task=>{const r=rows.results.find(r=>r.id===task.key),result=r?.result?JSON.parse(r.result):null,h=health.get(task.key),last=r?.last_finished_at;
  return {...task,intervalMs:undefined,firstStage:undefined,lastStartedAt:r?.last_started_at||null,lastFinishedAt:last||null,lastProgressAt:result?.progressAt||result?.finishedAt||null,result:publicResult(result),health:h||null,stale:!last||Date.now()-Date.parse(last)>Math.max(task.intervalMs*3,10*60000)};
 });
}
export async function readRefreshTask(task:GameRefreshTask){const row=await env.DB!.prepare('SELECT last_started_at AS lastStartedAt,last_finished_at AS lastFinishedAt,result FROM refresh_jobs WHERE id=?').bind(task.key).first<{lastStartedAt:string;lastFinishedAt:string;result:string}>();return {version:2,serverTime:new Date().toISOString(),task:{gameId:task.gameId,lane:task.lane,key:task.key,intervalMinutes:task.intervalMinutes},...(row?{lastStartedAt:row.lastStartedAt,lastFinishedAt:row.lastFinishedAt,result:publicResult(JSON.parse(row.result||'null'))}:{result:null})};}
