import './load-typescript.mjs';
import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import fs from 'node:fs';
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+f,'utf8'));
let beforeUpdate;
class Query{constructor(q,a=[]){this.q=q;this.a=a}bind(...a){return new Query(this.q,a)}async first(){return db.prepare(this.q).get(...this.a)||null}async all(){return {results:db.prepare(this.q).all(...this.a)}}async run(){if(beforeUpdate&&this.q.startsWith('UPDATE entries SET payload=')){const fn=beforeUpdate;beforeUpdate=undefined;fn();}return {meta:{changes:db.prepare(this.q).run(...this.a).changes}}}}
globalThis.__gameTasksEnv={DB:{prepare:q=>new Query(q),async batch(qs){return Promise.all(qs.map(q=>q.run()))}},BUCKET:{get:async()=>null,put:async()=>{}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:game-env',shortCircuit:true};if(s==='@/lib/write-access')return {url:'test:game-auth',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:game-env')return {format:'module',source:'export const env=globalThis.__gameTasksEnv',shortCircuit:true};if(u==='test:game-auth')return {format:'module',source:'export const canWriteData=async r=>r.headers.get("X-Test-Owner")==="yes"',shortCircuit:true};return n(u,c)}});
const runner=await import('../lib/refresh-runner.ts'),tasks=await import('../lib/refresh-tasks.ts'),store=await import('../lib/store.ts'),{performRefreshStage}=await import('../lib/fast-refresh.ts'),route=await import('../app/api/fast-refresh/route.ts');
const now=()=>new Date().toISOString(),copy=s=>({ko:s,en:s,ja:s,zh:s});
const entry=(id,gameId='wuwa')=>({id,gameId,region:'global',server:'global',kind:'update',title:copy('Source'),summary:copy(''),sourceUrl:'https://wutheringwaves.kurogames.com/kr/main/news/detail/1',sourceTitle:'Source',sourceLocale:'ko',startAt:null,endAt:null,publishedAt:null,verifiedAt:now()});
const write=e=>db.prepare('INSERT OR REPLACE INTO entries(id,game_id,payload,updated_at) VALUES(?,?,?,?)').run(e.id,e.gameId,JSON.stringify(e),now());
const terminal=p=>({ok:true,outcome:'complete',startedAt:p.startedAt,finishedAt:now(),readback:{automatic:1,effective:1},koreanChecks:[{source:p.gameId+'/test',checkedAt:now(),status:'ok'}]});
beforeEach(()=>{db.exec('DELETE FROM entries; DELETE FROM refresh_jobs; DELETE FROM operations_health; DELETE FROM editorial; DELETE FROM official_channels;');beforeUpdate=undefined;});

test('all 18 registered games have independent fast lanes and background details; arbitrary selectors cannot create jobs',()=>{
 assert.equal(tasks.gameRefreshTasks.length,73);assert.equal(new Set(tasks.gameRefreshTasks.map(t=>t.key)).size,73);
 for(const t of tasks.gameRefreshTasks){assert.ok(t.intervalMs>=120000);assert.ok(t.firstStage);if(t.lane==='details')assert.notEqual(t.firstStage,'korean');}
 for(const [g,l] of [['unknown','notices'],['wuwa','__proto__'],['wuwa','toString'],['all','notices'],['wuwa','maintenance']])assert.equal(tasks.refreshTask(g,l),null);
 assert.equal(tasks.nextRefreshStage({lane:'uploads',gameId:'wuwa'},'uploads'),'finalize');assert.equal(tasks.nextRefreshStage({lane:'notices',gameId:'wuwa'},'regional'),'notice-bodies');
});

test('a held or failing game cannot block another game or a different lane; same-task requests retain one lease',async()=>{
 const a=tasks.refreshTask('wuwa','notices'),b=tasks.refreshTask('nikke','notices'),c=tasks.refreshTask('wuwa','broadcasts');let release,entered;
 const enteredPromise=new Promise(r=>entered=r),held=tasks.runGameRefresh(a,async p=>{entered();await new Promise(r=>release=r);throw Error('Source interrupted');});await enteredPromise;
 const [other,lane,same]=await Promise.all([tasks.runGameRefresh(b,terminal),tasks.runGameRefresh(c,terminal),tasks.runGameRefresh(a,terminal)]);
 assert.equal(other.outcome,'complete');assert.equal(lane.outcome,'complete');assert.equal(same.busy,true);release();await assert.rejects(held,/interrupted/);
 const resumed=await tasks.runGameRefresh(a,terminal);assert.equal(resumed.outcome,'complete');
 const statuses=await tasks.readRefreshTasks();assert.equal(statuses.find(t=>t.key===b.key).health.sources['nikke/test'].status,'ok');assert.equal(statuses.find(t=>t.key===c.key).health.sources['wuwa/test'].status,'ok');
 assert.equal(db.prepare("SELECT count(*) n FROM operations_health WHERE key LIKE 'refresh-health:%'").get().n,3);
});

test('scoped SQL reads contain only the selected game and preserve complete originals for writes',async()=>{
 write({...entry('game-own'),sourceBodies:{ko:{locale:'ko',sourceUrl:'https://wutheringwaves.kurogames.com/kr/main/news/detail/1',text:'Full source',images:[],bodyHash:'a'.repeat(64),importedAt:now(),sourceKind:'official'}}});write(entry('other','nikke'));
 const result=await store.readBaseData({gameId:'wuwa'});assert.ok(result.persistent);assert.ok(result.entries.every(e=>e.gameId==='wuwa'));assert.equal(result.entries.find(e=>e.id==='game-own').sourceBodies.ko.text,'Full source');
 assert.ok((await store.readData({gameId:'nikke',automatic:true,collection:true})).entries.every(e=>e.gameId==='nikke'));
});

test('real persistent CAS rebases metadata on a concurrent body/locale write, preserving nulls and owner overrides',async()=>{
 const before={...entry('concurrent-fields'),price:{amount:450,currency:'JPY',platform:'PC'},textStyle:{ja:{bodySize:22}}};write(before);
 db.prepare('INSERT INTO editorial(key,payload,revision,updated_at,updated_by) VALUES(?,?,?,?,?)').run('entry:'+before.id,JSON.stringify({title:copy('Owner title')}),1,now(),'owner');
 const after={...before,sourceTitle:'Publisher renamed',title:copy('Publisher renamed'),sourceBodies:{ja:{locale:'ja',sourceUrl:before.sourceUrl,text:'Japanese body',images:[],bodyHash:'b'.repeat(64),importedAt:now(),sourceKind:'official'}}};
 beforeUpdate=()=>write({...before,sourceBodies:{ko:{locale:'ko',sourceUrl:before.sourceUrl,text:'Concurrent Korean body',images:[],bodyHash:'c'.repeat(64),importedAt:now(),sourceKind:'official'}},textStyle:{...before.textStyle,en:{bodySize:26}}});
 await store.saveEntryChanges([{before,after}]);const saved=(await store.readBaseData({id:before.id})).entries[0];
 assert.equal(saved.sourceBodies.ko.text,'Concurrent Korean body');assert.equal(saved.sourceBodies.ja.text,'Japanese body');assert.equal(saved.textStyle.en.bodySize,26);assert.equal(saved.price.amount,450);assert.equal(saved.startAt,null);assert.equal(saved.sourceTitle,'Publisher renamed');
 assert.equal((await store.readData()).entries.find(e=>e.id===before.id).title.ko,'Owner title');
});

test('an existing scheduled/live broadcast is checked before channel discovery and preserves the verified channel ID',async()=>{
 const id='abcdefghijk',channelId='UC_exact_test_channel',at=now(),e={...entry('priority-live'),broadcast:{status:'scheduled',youtubeId:id,channelId,channel:'Official',locale:'ko',sourceUrl:'https://www.youtube.com/watch?v='+id,announcementUrl:'https://www.youtube.com/watch?v='+id,originalTitle:'Official program',announcedAt:null,scheduledAt:at,endedAt:null,official:true,metadataVerified:true,watched:false,verifiedAt:at}};write(e);
 const fetched=[],original=globalThis.fetch;globalThis.fetch=async url=>{fetched.push(String(url));return new Response('var ytInitialPlayerResponse = '+JSON.stringify({playabilityStatus:{status:'OK'},videoDetails:{videoId:id,channelId,isLiveContent:true,author:'Official',title:'Official program'},microformat:{playerMicroformatRenderer:{liveBroadcastDetails:{isLiveNow:true,startTimestamp:at}}}})+';')};
 try{const p={version:1,runId:'priority',startedAt:at,stage:'known-broadcasts',gameId:'wuwa',lane:'broadcasts'};const next=await performRefreshStage(p);assert.equal(next.stage,'channels');assert.deepEqual(fetched,['https://www.youtube.com/watch?v='+id]);const saved=(await store.readBaseData({id:e.id})).entries[0];assert.equal(saved.broadcast.status,'live');assert.equal(saved.broadcast.channelId,channelId);assert.equal(saved.broadcast.watched,false);assert.equal(saved.startAt,null);}finally{globalThis.fetch=original;}
});

test('scoped API keeps anonymous/cross-origin writes closed and rejects arbitrary or duplicate task selectors',async()=>{
 const request=(query,owner=false,origin='https://gagether.wiki')=>new Request('https://gagether.wiki/api/fast-refresh?'+query,{method:'POST',headers:{Origin:origin,...(owner?{'X-Test-Owner':'yes'}:{})}});
 assert.equal((await route.POST(request('game=wuwa&lane=uploads'))).status,403);assert.equal((await route.POST(request('game=wuwa&lane=uploads',true,'https://attacker.invalid'))).status,403);
 for(const q of ['game=unknown&lane=uploads','game=wuwa&lane=__proto__','game=wuwa&game=nikke&lane=uploads','game=https://attacker.invalid&lane=uploads'])assert.equal((await route.POST(request(q,true))).status,400);
 const plan=await (await route.GET(new Request('https://gagether.wiki/api/fast-refresh?plan=1'))).json();assert.equal(plan.version,2);assert.equal(plan.tasks.length,73);assert.equal(db.prepare('SELECT count(*) n FROM refresh_jobs').get().n,0);
});

test('scheduler wake-ups coalesce without cancelling jobs; expired leases and a timed handoff recover with exact ownership',async()=>{
 const at=Date.now();assert.equal((await runner.runnerLease('fast','100','claim',at)).claimed,true);
 assert.equal((await runner.runnerLease('fast','200','claim',at+1000)).claimed,false);
 assert.equal((await runner.runnerLease('details','200','claim',at+1000)).claimed,true);
 assert.equal((await runner.runnerLease('fast','100','renew',at+29*60000)).claimed,true);
 assert.equal((await runner.runnerLease('fast','200','claim',at+31*60000)).claimed,true);
 assert.equal((await runner.runnerLease('fast','100','renew',at+31*60000+1)).claimed,false);
 assert.equal((await runner.runnerLease('fast','100','release',at+31*60000+2)).released,false);
 assert.equal((await runner.runnerLease('fast','300','claim',at+44*60000)).claimed,true);
 assert.equal((await runner.runnerLease('fast','300','release',at+44*60000+1)).released,true);
});

test('Wuwa reference failures cannot gain a synthetic successful roster receipt; the revised detail flow skips that unrelated stage',async()=>{
 assert.equal(tasks.nextRefreshStage({lane:'details',gameId:'wuwa'},'reference'),'finalize');assert.ok(tasks.refreshTask('wuwa','details').key.endsWith(':v2'));
 const result=await performRefreshStage({version:1,runId:'reference-failure',startedAt:now(),stage:'finalize',gameId:'wuwa',lane:'details',referenceCheck:{done:true,source:'wuwa/reference',status:'error',checkedAt:now(),error:'Source unavailable'}});
 assert.equal(result.successful,0);assert.equal(result.ok,false);assert.ok(result.structuredChecks.every(c=>c.status!=='ok'));
});

test('Korean official recruitment import persists full originals with CAS, preserves concurrent fields and owner overrides, and replays without writes',async()=>{
 const fixtures=JSON.parse(fs.readFileSync('ops/bluearchive/20261027/before-recruitment.json'));
 fixtures.forEach(write);const id=fixtures.find(e=>e.id.startsWith('hist-')).id;
 db.prepare('INSERT INTO editorial(key,payload,revision,updated_at,updated_by) VALUES(?,?,?,?,?)').run('entry:'+id,JSON.stringify({title:copy('Owner custom title')}),1,now(),'owner');
 beforeUpdate=()=>{const e=JSON.parse(db.prepare('SELECT payload FROM entries WHERE id=?').get(id).payload);write({...e,detailSections:[{title:copy('Concurrent section'),body:copy('Keep this complete source')}],textStyle:{ko:{bodySize:23}}});};
 const {importBlueArchiveOfficial}=await import('../lib/bluearchive-official-store.ts');
 const first=await importBlueArchiveOfficial();assert.equal(first.count,9);
 const saved=(await store.readBaseData({id})).entries[0];assert.equal(saved.sourceKind,'official');assert.equal(saved.endAt,'2026-11-03T10:59:00+09:00');assert.equal(saved.detailSections[0].body.ko,'Keep this complete source');assert.equal(saved.textStyle.ko.bodySize,23);assert.equal(saved.entityDetails.length,fixtures.find(e=>e.id===id).entityDetails.length);
 assert.equal((await store.readData({gameId:'bluearchive'})).entries.find(e=>e.id===id).title.ko,'Owner custom title');
 const again=await importBlueArchiveOfficial();assert.equal(again.count,0);
});
