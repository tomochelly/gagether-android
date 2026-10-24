import './load-typescript.mjs';
import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import fs from 'node:fs';
const db=new DatabaseSync(':memory:');
for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function prepare(sql){let args=[];return {bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return {meta:{changes:db.prepare(sql).run(...args).changes}}}};}
globalThis.__refreshProgressEnv={DB:{prepare}};
registerHooks({resolve(s,c,n){return s==='cloudflare:workers'?{url:'data:text/javascript,export const env=globalThis.__refreshProgressEnv',shortCircuit:true}:n(s,c)}});
const {checkpointedRefresh}=await import('../lib/refresh-progress.ts');
beforeEach(()=>{db.exec('DELETE FROM refresh_jobs; DELETE FROM operations_health;');});
const row=()=>db.prepare("SELECT * FROM refresh_jobs WHERE id='official-fast'").get();
const progress=()=>JSON.parse(db.prepare("SELECT payload FROM operations_health WHERE key='official-fast-progress'").get().payload);
test('real SQLite stages persist across requests and only a final readback records completion',async()=>{
 const stages=[];
 const perform=async p=>{stages.push(p.stage);return p.stage==='korean'?{...p,stage:'feeds',koreanChecks:[{status:'ok'}]}:{ok:true,outcome:'partial',startedAt:p.startedAt,finishedAt:new Date().toISOString(),readback:{automatic:18,effective:18}};};
 const first=await checkpointedRefresh(perform);assert.equal(first.continuation,true);assert.equal(first.stage,'feeds');assert.equal(row().last_finished_at,null);assert.equal(progress().koreanChecks[0].status,'ok');
 const final=await checkpointedRefresh(perform);assert.equal(final.outcome,'partial');assert.ok(row().last_finished_at);assert.equal(row().lease_until,0);assert.equal(progress().stage,'done');assert.deepEqual(stages,['korean','feeds']);
 const again=await checkpointedRefresh(perform);assert.equal(again.skipped,true);assert.deepEqual(stages,['korean','feeds']);
});
test('an interrupted stage retains its cursor, completed stages and run identity for retry',async()=>{
 await checkpointedRefresh(async p=>({...p,stage:'channels',cursor:6,channelChecks:[{url:'native',status:'ok'}]}));
 const before=progress();await assert.rejects(()=>checkpointedRefresh(async()=>{throw Error('Connection interrupted');}),/interrupted/);
 assert.deepEqual(progress(),before);assert.equal(row().last_finished_at,null);assert.equal(JSON.parse(row().result).outcome,'failed');
 let seen;await checkpointedRefresh(async p=>{seen=p;return {...p,stage:'channels',cursor:12};});assert.equal(seen.runId,before.runId);assert.equal(seen.cursor,6);assert.equal(progress().cursor,12);
});
test('concurrent HTTP requests cannot both execute a stage; expired request lease can resume',async()=>{
 const now=Date.now();await checkpointedRefresh(async p=>({...p,stage:'channels',cursor:6}),now);
 db.prepare("INSERT INTO refresh_jobs(id,lease_until,last_started_at) VALUES('official-fast-step',?,?) ON CONFLICT(id) DO UPDATE SET lease_until=excluded.lease_until,last_started_at=excluded.last_started_at").run(now+180000,'disconnected-request');
 let calls=0;const perform=async p=>{calls++;return {...p,stage:'broadcasts',cursor:0};};
 const busy=await checkpointedRefresh(perform,now+1000);assert.equal(busy.busy,true);assert.equal(calls,0);assert.equal(progress().cursor,6);
 const next=await checkpointedRefresh(perform,now+180001);assert.equal(next.stage,'broadcasts');assert.equal(calls,1);
});
test('legacy active runs are preserved; no speculative release or completion is written',async()=>{
 const now=Date.now();db.prepare("INSERT INTO refresh_jobs(id,lease_until,last_started_at) VALUES('official-fast',?,?)").run(now+120000,new Date(now-1000).toISOString());
 const result=await checkpointedRefresh(async()=>{throw Error('Must not execute');},now);assert.equal(result.skipped,true);assert.equal(row().last_finished_at,null);
 assert.equal(db.prepare("SELECT count(*) AS n FROM operations_health").get().n,0);
});
