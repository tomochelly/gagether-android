import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
const db=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+file,'utf8'));
class Statement{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Statement(this.sql,args)}async run(){const r=db.prepare(this.sql).run(...this.args);return{meta:{changes:Number(r.changes)}}}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return{results:db.prepare(this.sql).all(...this.args)}}}
const files=new Map();globalThis.recoveryEnv={DB:{prepare:sql=>new Statement(sql)},BUCKET:{async put(key,value){files.set(key,value)}}};
registerHooks({resolve(s,c,next){if(s==='cloudflare:workers')return{url:'test:collection-env',shortCircuit:true};if(s.endsWith('lib/write-access')||s==='@/lib/write-access')return{url:'test:collection-auth',shortCircuit:true};return next(s,c)},load(u,c,next){if(u==='test:collection-env')return{format:'module',source:'export const env=globalThis.recoveryEnv',shortCircuit:true};if(u==='test:collection-auth')return{format:'module',source:'export async function canWriteData(r){return r.headers.get("X-Test-Auth")==="allowed"}',shortCircuit:true};return next(u,c)}});
const api=await import('../app/api/collection/route.ts');
const id='a'.repeat(64),document={id,gameId:'trickcal',region:'kr',locale:'ko',title:'Official update',url:'https://game.naver.com/lounge/Trickcal/board/detail/8346896',publishedAt:'2026-10-21',checkedAt:'2026-10-20T00:00:00Z',sourceAccess:'js-only'};
const insert=d=>db.prepare('INSERT OR REPLACE INTO official_documents(id,game_id,region,locale,url,payload,body_hash,status,checked_at,entry_ids)VALUES(?,?,?,?,?,?,?,?,?,?)').run(d.id,d.gameId,d.region,d.locale,d.url,JSON.stringify(d),'b'.repeat(64),'unavailable',d.checkedAt,'[]');
const request=(body,{auth=true,origin='https://gagether.wiki'}={})=>new Request('https://gagether.wiki/api/collection',{method:'POST',headers:{'Content-Type':'application/json','X-Test-Auth':auth?'allowed':'',origin},body:JSON.stringify(body)});
test('stored-document recovery authenticates, rejects injected URLs, reads the first-party body and never approves it',async()=>{
 insert(document);let calls=0;const original=globalThis.fetch;globalThis.fetch=async url=>{calls++;assert.equal(url,'https://comm-api.game.naver.com/nng_main/v1/community/lounge/Trickcal/feed/8346896');return Response.json({code:200,content:{feed:{feedId:8346896,loungeId:'Trickcal',contents:'<article><p>'+('Official complete update. '.repeat(10))+'</p></article>'}}});};
 try{
  assert.equal((await api.POST(request({action:'fetch',id},{auth:false}))).status,403);assert.equal((await api.POST(request({action:'fetch',id},{origin:'https://evil.test'}))).status,403);
  assert.equal((await api.POST(request({action:'fetch',id,url:'https://evil.test'}))).status,400);assert.equal(calls,0);
  const response=await api.POST(request({action:'fetch',id})),result=await response.json();assert.equal(response.status,200);assert.equal(result.ok,true);assert.equal(result.document.sourceAccess,'body');assert.equal(result.document.status,'pending');assert.notEqual(result.document.bodyHash,'b'.repeat(64));assert.equal(files.size,1);
  // capture uses the stable digest of game/service/source, not an arbitrary caller ID.
  const capturedId=result.document.id;assert.equal((await api.POST(request({action:'fetch',id:capturedId}))).status,429);assert.equal(calls,1);
  const blocked={...document,id:'c'.repeat(64),url:'https://evil.test/8346896'};insert(blocked);assert.equal((await api.POST(request({action:'fetch',id:blocked.id}))).status,400);assert.equal(calls,1);
 }finally{globalThis.fetch=original;}
});


test('an existing headline with no document can recover its own saved source, without accepting arbitrary URLs or touching owner data',async()=>{
 const blank={ko:'',en:'',ja:'',zh:''},entry={id:'quick-wuwa-global-8344096',gameId:'wuwa',region:'global',server:'global',kind:'update',title:{...blank,ko:'3.7 이벤트 모아보기'},summary:{...blank},sourceLocale:'ko',sourceTitle:'3.7 이벤트 모아보기',sourceUrl:'https://game.naver.com/lounge/WutheringWaves/board/detail/8344096',publishedAt:'2026-10-20',verifiedAt:'2026-10-23T00:00:00Z',startAt:null,endAt:null};
 db.prepare('INSERT INTO entries(id,game_id,payload,updated_at)VALUES(?,?,?,?)').run(entry.id,entry.gameId,JSON.stringify(entry),entry.verifiedAt);
 const owner=JSON.stringify({title:{...blank,ko:'Owner heading'},image:'/api/media/owner.png'});db.prepare('INSERT INTO editorial(key,payload,revision,updated_at,updated_by)VALUES(?,?,?,?,?)').run('entry:'+entry.id,owner,2,entry.verifiedAt,'owner');
 let calls=0;const original=globalThis.fetch;globalThis.fetch=async url=>{calls++;assert.equal(url,'https://comm-api.game.naver.com/nng_main/v1/community/lounge/WutheringWaves/feed/8344096');return Response.json({code:200,content:{user:{userRoleCode:'game_manager'},feed:{feedId:8344096,loungeId:'WutheringWaves',contents:'<p>Complete native update with exact participation conditions and original notice.</p>'}}});};
 try{
  assert.equal((await api.POST(request({action:'fetch',entryId:entry.id},{auth:false}))).status,403);
  assert.equal((await api.POST(request({action:'fetch',entryId:entry.id,url:'https://evil.test'}))).status,400);
  assert.equal((await api.POST(request({action:'fetch',entryId:'missing'}))).status,404);assert.equal(calls,0);
  const result=await (await api.POST(request({action:'fetch',entryId:entry.id}))).json();assert.equal(result.ok,true);assert.equal(result.document.sourceAccess,'body');assert.ok(result.document.bodyCheckedAt);
  assert.equal((await api.POST(request({action:'fetch',entryId:entry.id}))).status,429);assert.equal(calls,1);
  assert.equal(db.prepare('SELECT payload FROM entries WHERE id=?').get(entry.id).payload,JSON.stringify(entry));assert.equal(db.prepare('SELECT payload FROM editorial WHERE key=?').get('entry:'+entry.id).payload,owner);
  assert.equal(db.prepare('SELECT reviewed_hash FROM official_documents WHERE id=?').get(result.document.id).reviewed_hash,null);
 }finally{globalThis.fetch=original;}
});
