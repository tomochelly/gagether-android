import './load-typescript.mjs';
import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {DatabaseSync} from 'node:sqlite';

const db=new DatabaseSync(':memory:');
db.exec('CREATE TABLE operations_health(key TEXT PRIMARY KEY,payload TEXT);CREATE TABLE refresh_jobs(id TEXT PRIMARY KEY,lease_until INTEGER,last_started_at TEXT);');
let persistentReadFails=false;
class Query{
 constructor(sql,args=[]){this.sql=sql;this.args=args}
 bind(...args){return new Query(this.sql,args)}
 async first(){if(persistentReadFails&&String(this.args[0]).startsWith('leaks:document:'))throw Error('Persistent original unavailable');return db.prepare(this.sql).get(...this.args)||null}
 async all(){return {results:db.prepare(this.sql).all(...this.args)}}
 async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}
}
globalThis.__leakResilienceEnv={DB:{prepare:sql=>new Query(sql)}};
registerHooks({resolve(s,c,n){return s==='cloudflare:workers'?{url:'test:leak-resilience-env',shortCircuit:true}:n(s,c)},load(u,c,n){return u==='test:leak-resilience-env'?{format:'module',source:'export const env=globalThis.__leakResilienceEnv',shortCircuit:true}:n(u,c)}});
const model=await import('../lib/leaks.ts'),store=await import('../lib/leaks-store.ts');
beforeEach(()=>{db.exec('DELETE FROM operations_health;DELETE FROM refresh_jobs');persistentReadFails=false});
const at='2026-10-27T12:00:00Z',source=model.leakSources.find(s=>s.id==='solaris');
const item=path=>`<item><title>【鳴潮】3.8 ベータ情報 ${path}【リーク】</title><link>https://meicho.marcsimz.com/${path}/</link><pubDate>Tue, 27 Oct 2026 10:00:00 GMT</pubDate><description>原文の短い説明です。</description></item>`;
const feed='<rss><channel>'+item('missing-fixture')+item('good-fixture')+'</channel></rss>';
const article='<div class="post_content"><p>ベータ版の新しいキャラクター性能についての原文情報です。</p></div>';

test('a failed article retains its error while the next selected article is captured, without modifying prior originals',async()=>{
 const previous=globalThis.fetch,calls=[];
 globalThis.fetch=async url=>{const u=new URL(String(url));calls.push(u.pathname);return new Response(u.pathname==='/feed/'?feed:u.pathname==='/missing-fixture/'?'Not found':article,{status:u.pathname==='/missing-fixture/'?404:200})};
 try{
  const result=await store.captureLeakFeed(source,at);
  assert.equal(result.status,'limited');assert.equal(result.count,2);assert.equal(result.processed,1);assert.equal(result.changed,1);
  assert.deepEqual(result.articleErrors.map(e=>[e.url,e.error,e.checkedAt]),[['https://meicho.marcsimz.com/missing-fixture/','HTTP 404',at]]);
  const docs=await store.leakQueue();assert.equal(docs.length,1);assert.equal(docs[0].sourceUrl,'https://meicho.marcsimz.com/good-fixture/');assert.equal(docs[0].sourceAccess,'body');assert.ok(calls.includes('/good-fixture/'));
  const original=JSON.stringify(docs[0]);const failed=await store.captureLeakFeed(source,at);
  assert.equal(failed.status,'error');assert.equal(failed.changed,0);assert.equal(JSON.stringify((await store.leakQueue())[0]),original);
 }finally{globalThis.fetch=previous}
});

test('persistent original failures still stop collection instead of being mislabeled as article failures',async()=>{
 const previous=globalThis.fetch,calls=[];persistentReadFails=true;
 globalThis.fetch=async url=>{calls.push(new URL(String(url)).pathname);return new Response(feed)};
 try{await assert.rejects(()=>store.captureLeakFeed(source,at),/Persistent original unavailable/);assert.deepEqual(calls,['/feed/']);assert.equal(db.prepare('SELECT count(*) AS count FROM operations_health').get().count,0)}
 finally{globalThis.fetch=previous}
});

test('official special-program announcements never enter leak feeds, while explicit leak discussion remains eligible',()=>{
 for(const title of ['Honkai: Star Rail Version 4.7 Special Program','Version 4.7 Special Programme Announcement','Official announcement: 4.7 beta program','4.7 버전 특별 방송','Ver3.4 予告番組','4.7 前瞻特别节目','4.7 前瞻特別節目'])assert.equal(model.excludedLeakTitle(title),true,title);
 for(const title of ['4.7 Special Program leak discussion','Leaked special program footage','4.7 Special Program rumour','4.7 특별 방송 유출','3.4 予告番組 リーク','4.7 前瞻特别节目 爆料'])assert.equal(model.excludedLeakTitle(title),false,title);
 const reddit=model.leakSources.find(s=>s.id==='reddit-hsr'),entry=(id,title)=>`<entry><title>${title}</title><link href="https://www.reddit.com/r/HonkaiStarRail_leaks/comments/${id}/fixture/"/><published>2026-10-27T10:00:00Z</published><content type="html">&lt;p&gt;Source post.&lt;/p&gt;</content></entry>`;
 const rows=model.parseLeakFeed('<feed>'+entry('abc123','Honkai: Star Rail Version 4.7 Special Program')+entry('def456','4.7 Special Program leaked beta footage')+'</feed>',reddit,at);
 assert.equal(rows.length,1);assert.ok(rows[0].url.includes('def456'));
});
