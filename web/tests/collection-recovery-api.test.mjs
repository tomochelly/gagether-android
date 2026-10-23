import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0011_flawless_zeigeist.sql',import.meta.url),'utf8'));
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
