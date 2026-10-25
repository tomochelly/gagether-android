import {env} from 'cloudflare:workers';
export type RunnerMode='fast'|'details';
const leaseMs=12*60000,handoffMs=30*60000;
/** Same pinned workflow identity, renewable bounded operational lease. New
 * scheduled wake-ups exit cleanly while one runner checks independent jobs.
 * After 30 minutes a new wake-up can take over without a cron-sized gap. */
export async function runnerLease(mode:RunnerMode,owner:string,action:'claim'|'renew'|'release',now=Date.now()){
 if(!['fast','details'].includes(mode)||!/^\d{1,30}$/.test(owner))throw Error('Invalid scheduler identity');
 const db=env.DB!,key='official-runner:'+mode,at=new Date(now).toISOString();
 if(action==='release'){
  const result=await db.prepare("UPDATE refresh_jobs SET lease_until=0,last_finished_at=? WHERE id=? AND json_extract(result,'$.owner')=?").bind(at,key,owner).run();return {ok:true,released:!!result.meta.changes,at};
 }
 if(action!=='claim'&&action!=='renew')throw Error('Invalid scheduler action');
 const prior=await db.prepare('SELECT last_started_at,result FROM refresh_jobs WHERE id=?').bind(key).first<{last_started_at:string;result:string}>(),same=prior&&JSON.parse(prior.result||'{}').owner===owner;
 const startedAt=same?prior.last_started_at:at,payload=JSON.stringify({owner,mode,startedAt,heartbeatAt:at});
 const changed=action==='claim'?await db.prepare("INSERT INTO refresh_jobs(id,lease_until,last_started_at,result) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET lease_until=excluded.lease_until,last_started_at=excluded.last_started_at,result=excluded.result WHERE refresh_jobs.lease_until<=? OR json_extract(refresh_jobs.result,'$.owner')=? OR refresh_jobs.last_started_at<=?").bind(key,now+leaseMs,startedAt,payload,now,owner,new Date(now-handoffMs).toISOString()).run():await db.prepare("UPDATE refresh_jobs SET lease_until=?,result=? WHERE id=? AND json_extract(result,'$.owner')=?").bind(now+leaseMs,payload,key,owner).run();
 if(changed.meta.changes&&mode==='fast')await db.prepare("INSERT INTO operations_health(key,payload) VALUES('refresh-scheduler-v2',?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(JSON.stringify({at,version:2,mode,runId:owner})).run();
 return {ok:true,claimed:!!changed.meta.changes,at,mode,leaseMinutes:12,handoffMinutes:30};
}
export async function readRunnerHeartbeat(){const row=await env.DB!.prepare("SELECT payload FROM operations_health WHERE key='refresh-scheduler-v2'").first<{payload:string}>();const value=row?JSON.parse(row.payload):null;return value?{...value,stale:Date.now()-Date.parse(value.at)>15*60000}:null;}
