import {env} from 'cloudflare:workers';
import {recordHealth} from './service-health';
export type RefreshProgress={version:1;runId:string;startedAt:string;stage:string;cursor?:number;gameId?:string;lane?:string;[key:string]:any};
export type RefreshTaskOptions={key:string;gameId?:string;lane?:string;firstStage:string;intervalMs:number};
const interval=10*60000,lease=20*60000,stepLease=3*60000;
/** Each HTTP request commits one bounded stage. A disconnected caller resumes
 * the durable checkpoint; it cannot turn an incomplete run into full success. */
export async function checkpointedRefresh(perform:(p:RefreshProgress)=>Promise<any>,now=Date.now(),task?:RefreshTaskOptions){
 const job=task?.key||'official-fast',stepJob=job+'-step',progressKey=job==='official-fast'?'official-fast-progress':job+'-progress';
 const cadence=task?.intervalMs||interval;
 const db=env.DB;if(!db)throw Error('Persistent storage unavailable');
 const row=await db.prepare('SELECT lease_until,last_started_at FROM refresh_jobs WHERE id=?').bind(job).first<{lease_until:number;last_started_at:string}>();
 const saved=await db.prepare('SELECT payload FROM operations_health WHERE key=?').bind(progressKey).first<{payload:string}>();
 let p:RefreshProgress|undefined=saved?JSON.parse(saved.payload):undefined;
 if(!p||p.version!==1||p.stage==='done'||p.startedAt!==row?.last_started_at||now-Date.parse(p.startedAt)>24*3600000){
  const startedAt=new Date(now).toISOString();
  const initial:RefreshProgress={version:1,runId:crypto.randomUUID(),startedAt,stage:task?.firstStage||'korean',...(task?{gameId:task.gameId,lane:task.lane,taskKey:task.key}:{})};
  // Publish the active run identity atomically with its lease. A concurrent
  // status reader must never see the new start paired with the previous result.
  const pending=JSON.stringify({ok:true,continuation:true,runId:initial.runId,stage:initial.stage,cursor:0,startedAt,progressAt:startedAt});
  const acquired=await db.prepare("INSERT INTO refresh_jobs(id,lease_until,last_started_at,result) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET lease_until=excluded.lease_until,last_started_at=excluded.last_started_at,result=excluded.result WHERE refresh_jobs.lease_until<=? AND (refresh_jobs.last_started_at IS NULL OR refresh_jobs.last_started_at<=?)").bind(job,now+lease,startedAt,pending,now,new Date(now-cadence+Math.min(30000,cadence/10)).toISOString()).run();
  if(!acquired.meta.changes)return {ok:true,skipped:true,reason:'Already running or checked within its interval'};
  p=initial;
  await db.prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload').bind(progressKey,JSON.stringify(p)).run();
 }
 const owner=crypto.randomUUID();
 const locked=await db.prepare('INSERT INTO refresh_jobs(id,lease_until,last_started_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET lease_until=excluded.lease_until,last_started_at=excluded.last_started_at WHERE refresh_jobs.lease_until<=?').bind(stepJob,now+stepLease,owner,now).run();
 if(!locked.meta.changes)return {ok:true,continuation:true,busy:true,retryAfter:5,runId:p.runId,stage:p.stage};
 try{
  // The checkpoint may have advanced while another request held the step lock.
  const latest=await db.prepare('SELECT payload FROM operations_health WHERE key=?').bind(progressKey).first<{payload:string}>();
  if(latest){const v=JSON.parse(latest.payload);if(v.runId!==p.runId||v.stage==='done')return {ok:true,skipped:true,reason:'Run already completed'};p=v;}
  const next=await perform(p!);
  if(next.finishedAt&&next.readback){
   await recordHealth(next,task?.key);
   const finished=await db.prepare('UPDATE refresh_jobs SET lease_until=0,last_finished_at=?,result=? WHERE id=? AND last_started_at=?').bind(next.finishedAt,JSON.stringify(next),job,p!.startedAt).run();
   if(!finished.meta.changes)throw Error('Refresh completion superseded');
   await db.prepare("UPDATE operations_health SET payload=? WHERE key=? AND json_extract(payload,'$.runId')=?").bind(JSON.stringify({...p,stage:'done'}),progressKey,p!.runId).run();
   return next;
  }
  if(next.runId!==p!.runId||!next.stage)throw Error('Invalid refresh checkpoint');
  const progressed=await db.prepare("UPDATE operations_health SET payload=? WHERE key=? AND json_extract(payload,'$.runId')=?").bind(JSON.stringify(next),progressKey,p!.runId).run();
  if(!progressed.meta.changes)throw Error('Refresh checkpoint superseded');
  const result={ok:true,continuation:true,runId:next.runId,stage:next.stage,cursor:next.cursor||0,startedAt:next.startedAt,progressAt:new Date().toISOString()};
  await db.prepare('UPDATE refresh_jobs SET lease_until=?,result=? WHERE id=? AND last_started_at=?').bind(Date.now()+lease,JSON.stringify(result),job,p!.startedAt).run();
  return result;
 }catch(error){
  const result={ok:false,outcome:'failed',continuation:true,runId:p!.runId,stage:p!.stage,error:error instanceof Error?error.message:'Refresh stage failed'};
  await db.prepare('UPDATE refresh_jobs SET result=? WHERE id=? AND last_started_at=?').bind(JSON.stringify(result),job,p!.startedAt).run();
  throw error;
 }finally{await db.prepare('UPDATE refresh_jobs SET lease_until=0 WHERE id=? AND last_started_at=?').bind(stepJob,owner).run();}
}
