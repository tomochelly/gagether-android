import './load-typescript.mjs';
import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';

const db=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));
class Query{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Query(this.sql,args)}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return {results:db.prepare(this.sql).all(...this.args)}}async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}}
globalThis.__leakHealthEnv={DB:{prepare:sql=>new Query(sql),batch:async qs=>Promise.all(qs.map(q=>q.run()))},BUCKET:{get:async()=>null,put:async()=>{}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:leak-health-env',shortCircuit:true};if(s==='@/lib/write-access')return {url:'test:leak-health-auth',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:leak-health-env')return {format:'module',source:'export const env=globalThis.__leakHealthEnv',shortCircuit:true};if(u==='test:leak-health-auth')return {format:'module',source:'export const canWriteData=async()=>false',shortCircuit:true};return n(u,c)}});
const {leakRefreshChecks}=await import('../lib/leaks.ts'),{refreshHealth}=await import('../lib/service-health.ts'),{performRefreshStage}=await import('../lib/fast-refresh.ts');
const at='2026-10-27T10:18:24.575Z';
beforeEach(()=>{db.exec('DELETE FROM operations_health;DELETE FROM entries;DELETE FROM editorial;DELETE FROM refresh_jobs')});

test('mixed source and translation outcomes remain distinct, cached clocks do not advance, and per-post failures cannot overwrite each other',()=>{
 const run={source:'leaks/collection',status:'error',skipped:true,checkedAt:'2026-10-27T11:00:00Z',checks:[{source:'solaris',status:'ok',checkedAt:at},{source:'reddit-hsr',status:'error',checkedAt:at,error:'HTTP 403'},{source:'wuwa-verse1',postId:'2114186678797562034',status:'error',checkedAt:at,error:'HTTP 400'},{source:'wuwa-verse1',postId:'2114039529564713238',status:'error',checkedAt:at,error:'HTTP 400'},{id:'genshin-fixture',status:'limited',checkedAt:at,translationErrors:['HTTP 429']},{id:'wuwa-manual',status:'retained-manual',checkedAt:at,retainedManual:true}]};
 const original=JSON.stringify(run),checks=leakRefreshChecks(run);
 assert.equal(JSON.stringify(run),original);assert.equal(new Set(checks.map(c=>c.source)).size,6);assert.ok(checks.every(c=>c.checkedAt===at));assert.deepEqual(checks.filter(c=>c.error).map(c=>c.error),['HTTP 403','HTTP 400','HTTP 400']);assert.deepEqual(checks.find(c=>c.id==='genshin-fixture').translationErrors,['HTTP 429']);assert.equal(checks.find(c=>c.id==='wuwa-manual').collectionStatus,'retained-manual');assert.deepEqual(refreshHealth(checks),{outcome:'partial',successful:2,failed:4,total:6});
 const fatal={source:'leaks/collection',status:'error',error:'Storage unavailable',checkedAt:at};assert.deepEqual(leakRefreshChecks(fatal),[fatal]);assert.equal(refreshHealth(leakRefreshChecks(fatal)).outcome,'failed');
});

test('the actual maintenance finalizer reports partial successful source reads without hiding blocked sources or translation limits',async()=>{
 const copy=s=>({ko:s,en:s,ja:s,zh:s}),entry={id:'leak-health-ordinary',gameId:'wuwa',region:'global',server:'global',kind:'update',title:copy('Saved official notice'),summary:copy(''),sourceUrl:'https://wutheringwaves.kurogames.com/kr/main/news/detail/1',sourceTitle:'Saved official notice',sourceLocale:'ko',startAt:null,endAt:null,publishedAt:null,verifiedAt:at};
 db.prepare('INSERT INTO entries(id,game_id,payload,updated_at) VALUES(?,?,?,?)').run(entry.id,entry.gameId,JSON.stringify(entry),at);
 const checks=[{source:'solaris',status:'ok',checkedAt:at},{source:'gachanews',status:'ok',checkedAt:at},{source:'reddit-hsr',status:'error',checkedAt:at,error:'HTTP 403'},{id:'genshin-fixture',status:'limited',checkedAt:at,translationErrors:['HTTP 429']}];
 const result=await performRefreshStage({version:1,runId:'leak-health-fixture',startedAt:at,stage:'finalize',gameId:'all',lane:'maintenance',leakCheck:{source:'leaks/collection',status:'error',checkedAt:at,checks}});
 assert.equal(result.ok,true);assert.equal(result.outcome,'partial');assert.equal(result.partial,true);assert.equal(result.successful,2);assert.equal(result.failed,2);assert.equal(result.total,4);assert.ok(result.structuredChecks.some(c=>c.source==='leaks/reddit-hsr'&&c.error==='HTTP 403'));assert.deepEqual(result.structuredChecks.find(c=>c.id==='genshin-fixture').translationErrors,['HTTP 429']);assert.equal(db.prepare('SELECT payload FROM entries WHERE id=?').get(entry.id).payload,JSON.stringify(entry));
});
