import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const sqlite=new DatabaseSync(':memory:');
for(const file of ['0003_good_banshee.sql','0004_third_daredevil.sql'])sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const db={prepare(sql){let args=[];return {bind(...a){args=a;return this},sql,get args(){return args}}},async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(s=>{const q=sqlite.prepare(s.sql);if(/^SELECT/.test(s.sql))return {results:q.all(...s.args)};const r=q.run(...s.args);return {results:[],meta:{changes:r.changes}};});sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
globalThis.__usageEnv={DB:db,PATCHWORK_EDITOR_EMAILS:'owner@example.com'};globalThis.__usageUser=null;
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'usage-mock:env',shortCircuit:true};if(s==='@/app/chatgpt-auth')return {url:'usage-mock:identity',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='usage-mock:env')return {format:'module',source:'export const env=globalThis.__usageEnv;',shortCircuit:true};if(u==='usage-mock:identity')return {format:'module',source:'export const getChatGPTUser=async()=>globalThis.__usageUser;',shortCircuit:true};return n(u,c)}});
const {usageDay,usageInput,usageAllowed}=await import('../lib/usage.ts');
const {recordUsage,readUsage,pruneUsage}=await import('../lib/usage-store.ts');
const {GET}=await import('../app/api/owner/analytics/route.ts');
const {POST}=await import('../app/api/analytics/route.ts');
const input={visitorId:crypto.randomUUID(),eventId:crypto.randomUUID(),type:'view',view:'game',gameId:'wuwa',locale:'ko',device:'web-desktop',referrer:'arca.live'};
const request=(body=input,extra={})=>new Request('https://gagether.wiki/api/analytics',{method:'POST',headers:{Origin:'https://gagether.wiki','Content-Type':'application/json',...extra},body:typeof body==='string'?body:JSON.stringify(body)});
test('date boundary is fixed UTC+9; input discards personal fields and rejects unknown routes',()=>{
 assert.equal(usageDay(Date.parse('2026-10-17T14:59:59Z')),'2026-10-17');assert.equal(usageDay(Date.parse('2026-10-17T15:00:00Z')),'2026-10-18');
 const clean=usageInput({...input,email:'private@example.com',query:'private',referrer:'https://example.com/private?q=secret'});assert.equal(clean.referrer,'direct');assert.equal(clean.email,undefined);assert.equal(clean.query,undefined);assert.equal(usageInput({...input,visitorId:'account-id'}),null);assert.equal(usageInput({...input,view:'/owner'}),null);
});
test('origin, bots, DNT and GPC are rejected',()=>{assert.equal(usageAllowed(request()),true);for(const extra of [{Origin:'https://evil.example'},{DNT:'1'},{'Sec-GPC':'1'},{'User-Agent':'Googlebot'}])assert.equal(usageAllowed(request(input,extra)),false)});
test('database deduplicates retries, keeps heartbeat separate, counts real navigation',async()=>{
 const now=Date.now();await recordUsage(input,now);await recordUsage(input,now+1);await recordUsage({...input,type:'heartbeat'},now+2);let d=await readUsage(7,now+3);assert.equal(d.todayVisitors,1);assert.equal(d.todayViews,1);assert.equal(d.active,1);
 await recordUsage({...input,eventId:crypto.randomUUID(),view:'detail'},now+4);d=await readUsage(7,now+5);assert.equal(d.todayViews,2);assert.equal(d.games[0].count,2);assert.equal(d.referrers[0].key,'arca.live');assert.equal((await readUsage(7,now+6*60000)).active,0);
});
test('summary endpoint blocks anonymous and signed-in nonowner; owner can read without caching',async()=>{
 const req=new Request('https://gagether.wiki/api/owner/analytics?days=30');
 for(const user of [null,{userId:'other',email:'other@example.com'}]){globalThis.__usageUser=user;const r=await GET(req);assert.equal(r.status,403);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal((await r.json()).daily,undefined)}
 globalThis.__usageUser={userId:'owner',email:'owner@example.com'};const r=await GET(req);assert.equal(r.status,200);assert.equal((await r.json()).days,30);globalThis.__usageUser=null;
});
test('ingestion excludes owner; rejects huge and invalid payloads',async()=>{
 const count=sqlite.prepare('SELECT COUNT(*) AS n FROM usage_views').get().n;globalThis.__usageUser={userId:'owner',email:'owner@example.com'};assert.equal((await POST(request({...input,eventId:crypto.randomUUID()}))).status,204);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM usage_views').get().n,count);globalThis.__usageUser=null;
 assert.equal((await POST(request('x'.repeat(2050)))).status,413);assert.equal((await POST(request({...input,view:'bad'}))).status,400);assert.equal((await POST(request(input,{Origin:'https://evil.example'}))).status,403);
});
test('retention removes old rows while keeping current data and collection start',async()=>{
 const now=Date.now();await recordUsage({...input,eventId:crypto.randomUUID()},now-32*86400000);await pruneUsage(now);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM usage_visitors WHERE day<?').get(usageDay(now-30*86400000)).n,0);assert.ok((await readUsage(30,now)).startedAt);
});
