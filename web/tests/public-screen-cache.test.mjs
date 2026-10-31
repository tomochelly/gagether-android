import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
const {publicScreen,publicScreenVariant,screenContentRevision,screenObjectCache}=await import('../lib/public-screen-cache.ts');
const url='https://gagether.wiki';
const request=(path='/',headers={})=>new Request(url+path,{headers});
const html='<html><body><div data-catalog-state="ready">Exact original artwork and text</div></body></html>';
const response=(body=html,headers={})=>new Response(body,{headers:{'content-type':'text/html; charset=utf-8',...headers}});
function harness(){
 const saved=new Map(),jobs=[],renders=[];let version='a';
 const options={build:'build-a',cache:{async match(r){return saved.get(r.url)?.clone()},async put(r,v){saved.set(r.url,v.clone())}},ctx:{waitUntil(p){jobs.push(p)}},revision:async()=>version,render:async r=>{renders.push(r);return response()}};
 return {options,saved,renders,setVersion:v=>version=v,flush:async()=>{while(jobs.length)await Promise.all(jobs.splice(0))}};
}
test('shared landing HTML keeps variants and never renders visitor identity or private cookies',async()=>{
 const h=harness(),req=request('/',{cookie:'session=private; patchwork.locale=ja; gagether.mobile-view=simple; other=secret','user-agent':'Android','oai-authenticated-user-email':'private@example.com',authorization:'Bearer private','x-gagether-sync-token':'private'});
 const first=await publicScreen(req,h.options);assert.equal(first.headers.get('X-Gagether-Screen-Cache'),'MISS');assert.equal(await first.text(),html);await h.flush();
 const second=await publicScreen(req,h.options);assert.equal(second.headers.get('X-Gagether-Screen-Cache'),'HIT');assert.equal(await second.text(),html);assert.equal(h.renders.length,1);
 const headers=h.renders[0].headers;assert.equal(headers.get('authorization'),null);assert.equal(headers.get('oai-authenticated-user-email'),null);assert.equal(headers.get('x-gagether-sync-token'),null);assert.equal(headers.get('cookie'),'patchwork.locale=ja; gagether.mobile-view=simple; gagether.desktop-view=full');
 assert.equal(second.headers.get('Cache-Control'),'private, no-store');assert.equal(second.headers.get('X-Gagether-Screen-Stored-At'),null);
 for(const locale of ['ko','en','zh']){await publicScreen(request('/',{cookie:'patchwork.locale='+locale}),h.options);await h.flush()}
 assert.equal(h.saved.size,4);
 const variants=[request('/',{'accept-language':'ja'}),request('/',{cookie:'patchwork.locale=ja'}),request('/',{cookie:'patchwork.locale=ja; gagether.desktop-view=simple'}),request('/',{cookie:'patchwork.locale=ja','user-agent':'Android'}),request('/mobile',{cookie:'patchwork.locale=ja'})].map(r=>publicScreenVariant(r).key);
 assert.equal(new Set(variants).size,5);
 assert.ok(publicScreenVariant(request('/',{'cf-ipcountry':'KR','accept-language':'ja'})).key.includes(':ko:auto:'));
});
test('API/owner/auth/deep links/history/RSC/actions preserve original requests and bypass the cache',async()=>{
 const h=harness();let revisions=0;h.options.revision=async()=>{revisions++;return 'a'};
 const requests=['/owner','/owner/analytics','/api/editor','/api/data?view=automatic','/signin-with-chatgpt','/?entry=new-entry','/?tab=history','/?_rsc=abc'].map(path=>request(path,{authorization:'private'}));
 requests.push(new Request(url,{method:'POST'}),request('/',{rsc:'1'}),request('/',{accept:'text/x-component'}),request('/',{'next-router-state-tree':'state'}));
 for(const r of requests){await publicScreen(r,h.options);assert.equal(h.renders.at(-1),r)}
 assert.equal(revisions,0);assert.equal(h.saved.size,0);
});

test('localized home URLs reuse public screens and the URL language overrides unrelated cookies',async()=>{
 const objects=new Map(),h=harness();h.options.cache=screenObjectCache({async get(k){const row=objects.get(k);return row?{body:new Response(row.bytes).body,customMetadata:row.meta}:null},async put(k,bytes,o){objects.set(k,{bytes,meta:o.customMetadata})}});
 for(const locale of ['ko','en','ja','zh']){
  const req=request('/'+locale,{cookie:'patchwork.locale=ko; session=secret; gagether.desktop-view=simple','accept-language':'ko','cf-ipcountry':'KR'}),variant=publicScreenVariant(req);
  assert.ok(variant.key.startsWith('/'+locale+':'+locale+':manual:simple:wide:'));assert.equal(variant.request.headers.get('accept-language'),locale);assert.ok(!variant.request.headers.get('cookie').includes('session'));
  assert.equal((await publicScreen(req,h.options)).headers.get('X-Gagether-Screen-Cache'),'MISS');await h.flush();assert.equal((await publicScreen(req,h.options)).headers.get('X-Gagether-Screen-Cache'),'HIT');
 }
 assert.equal(objects.size,4);assert.equal(h.renders.length,4);
 for(const path of ['/ko?entry=private','/en?tab=history','/ja/games/wuwa','/zh/owner','/fr'])assert.equal(publicScreenVariant(request(path)),null);
});
test('content, owner edits and deployment revisions invalidate cached screens immediately',async()=>{
 const h=harness();await publicScreen(request(),h.options);await h.flush();
 h.setVersion('owner-hidden-b');assert.equal((await publicScreen(request(),h.options)).headers.get('X-Gagether-Screen-Cache'),'MISS');await h.flush();
 h.options.build='build-b';assert.equal((await publicScreen(request(),h.options)).headers.get('X-Gagether-Screen-Cache'),'MISS');assert.equal(h.renders.length,3);await h.flush();
});
test('time-only staleness returns immediately and refreshes; expired screens are not served',async()=>{
 const original=Date.now;let now=Date.parse('2026-10-18T00:00:00Z');Date.now=()=>now;
 try{
  const h=harness();await publicScreen(request(),h.options);await h.flush();now+=61_000;
  let finish;h.options.render=()=>new Promise(resolve=>finish=resolve);
  const stale=await publicScreen(request(),h.options);assert.equal(stale.headers.get('X-Gagether-Screen-Cache'),'STALE');assert.equal(await stale.text(),html);
  finish(response(html.replace('Exact','Fresh')));await h.flush();
  const hit=await publicScreen(request(),h.options);assert.equal(hit.headers.get('X-Gagether-Screen-Cache'),'HIT');assert.match(await hit.text(),/Fresh original/);
  now+=301_000;h.options.render=async()=>response();assert.equal((await publicScreen(request(),h.options)).headers.get('X-Gagether-Screen-Cache'),'MISS');await h.flush();
 }finally{Date.now=original}
});
test('failed storage, degraded content, cookies and error pages are never retained',async()=>{
 for(const value of [response(html.replace('"ready"','"fallback"')),response(html,{'Set-Cookie':'session=private'}),new Response('failure',{status:500})]){
  const h=harness();h.options.render=async()=>value.clone();await publicScreen(request(),h.options);await h.flush();assert.equal(h.saved.size,0);
 }
 const h=harness();h.options.revision=async()=>{throw new Error('DB unavailable')};const r=await publicScreen(request(),h.options);assert.equal(r.headers.get('X-Gagether-Screen-Cache'),'BYPASS');assert.equal(await r.text(),html);assert.equal(h.saved.size,0);
});
test('DB metadata detects updates to any entry, owner revision/reset and feed status',async()=>{
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE entries(id TEXT,payload TEXT,updated_at TEXT);CREATE TABLE editorial(key TEXT,revision INTEGER,updated_at TEXT);CREATE TABLE source_checks(game_id TEXT,checked_at TEXT,status TEXT,count INTEGER,error TEXT);INSERT INTO entries VALUES('a','private payload','a'),('b','private payload','z');INSERT INTO editorial VALUES('entry:a',1,'a');INSERT INTO source_checks VALUES('wuwa','a','ok',1,NULL)");
 const binding={prepare:sql=>({all:async()=>({success:true,results:db.prepare(sql).all()})})};let prior=await screenContentRevision(binding);
 for(const sql of ["UPDATE entries SET updated_at='b' WHERE id='a'","UPDATE editorial SET revision=2","DELETE FROM editorial","UPDATE source_checks SET status='error',error='HTTP 403'","INSERT INTO entries VALUES('c','payload','a')","DELETE FROM entries WHERE id='c'"]){db.exec(sql);const next=await screenContentRevision(binding);assert.notEqual(next,prior);prior=next}
 db.close();
});

test('R2 storage reuses exact public HTML and replaces bounded slots across data, deployment and day changes',async()=>{
 const objects=new Map();let writes=0;
 const bucket={
  async get(key){const row=objects.get(key);return row?{body:new Response(row.bytes).body,customMetadata:row.metadata}:null},
  async put(key,bytes,options){objects.set(key,{bytes,metadata:options.customMetadata});writes++}
 };
 const h=harness();h.options.cache=screenObjectCache(bucket);
 h.options.render=async r=>{h.renders.push(r);return response(html,{'Link':'</style.css>; rel=preload; as="style"'})};
 const req=request('/',{cookie:'patchwork.locale=ja; gagether.mobile-view=simple',authorization:'private','user-agent':'Android'});
 assert.equal((await publicScreen(req,h.options)).headers.get('X-Gagether-Screen-Cache'),'MISS');await h.flush();
 const hit=await publicScreen(req,h.options);assert.equal(hit.headers.get('X-Gagether-Screen-Cache'),'HIT');assert.equal(await hit.text(),html);assert.equal(hit.headers.get('Link'),'</style.css>; rel=preload; as="style"');assert.equal(h.renders.length,1);
 assert.equal(objects.size,1);assert.ok([...objects.keys()][0].startsWith('runtime/public-screens/v1/'));assert.ok(!JSON.stringify([...objects.values()].map(x=>x.metadata)).includes('private'));
 h.setVersion('new-owner-edit');assert.equal((await publicScreen(req,h.options)).headers.get('X-Gagether-Screen-Cache'),'MISS');await h.flush();assert.equal(objects.size,1);
 h.options.build='new-build';assert.equal((await publicScreen(req,h.options)).headers.get('X-Gagether-Screen-Cache'),'MISS');await h.flush();assert.equal(objects.size,1);
 const original=Date.now;Date.now=()=>original()+86_400_000;
 try{assert.equal((await publicScreen(req,h.options)).headers.get('X-Gagether-Screen-Cache'),'MISS');await h.flush();assert.equal(objects.size,1)}finally{Date.now=original}
 assert.equal(writes,4);
 const entry=[...objects.values()][0];entry.metadata.headers='broken';const key=new Request(entry.metadata.cacheKey);assert.equal(await h.options.cache.match(key),undefined);
 await assert.rejects(()=>h.options.cache.put(new Request(url+'/editor/upload'),response()),/Invalid public screen variant/);
});
