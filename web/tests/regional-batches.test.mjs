import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import fs from 'node:fs';
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+f,'utf8'));
function prepare(sql){let args=[];return {bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return {meta:{changes:db.prepare(sql).run(...args).changes}}}};}
const objects=new Map();globalThis.__regionalBatchEnv={DB:{prepare,async batch(qs){return Promise.all(qs.map(q=>q.run()))}},BUCKET:{async put(k,v){objects.set(k,v)},async get(k){return objects.has(k)?{async json(){return JSON.parse(objects.get(k))}}:null}}};
registerHooks({resolve(s,c,n){return s==='cloudflare:workers'?{url:'data:text/javascript,export const env=globalThis.__regionalBatchEnv',shortCircuit:true}:n(s,c)}});
const {regionalOfficialSources}=await import('../lib/regional-notices.ts');
const {collectRegionalNotices}=await import('../lib/official-collection.ts');
test('regional source batches cover every native source once, persist bodies and retain failed-source data',async()=>{
 const originals=regionalOfficialSources.slice(),calls=[];let failing=false;
 const sources=Array.from({length:7},(_,i)=>({key:'fixture-'+i,gameId:'dna',region:'global',locale:'ko',url:'https://store.steampowered.com/news/app/3950020',async load(){calls.push(i);if(failing&&i===1)throw Error('HTTP 503');return [{gameId:'dna',region:'global',locale:'ko',id:String(99000+i),title:'이벤트 '+i,url:'https://store.steampowered.com/news/app/3950020/view/'+(99000+i)+'?l=koreana',publishedAt:'2026-10-24',bodyHtml:'<p>이벤트 참여 조건: 퀘스트를 완료하고 게임 내 우편으로 보상을 수령하세요. 공지 번호 '+i+'의 정확한 본문입니다.</p>'}];}}));
 regionalOfficialSources.splice(0,regionalOfficialSources.length,...sources);
 try{
  let cursor=0,added=0;while(cursor<sources.length){const before=calls.length,r=await collectRegionalNotices(cursor,3);assert.ok(calls.length-before<=3);assert.equal(r.total,7);cursor=r.nextOffset;added+=r.added;}
  assert.equal(added,7);assert.deepEqual(calls,[0,1,2,3,4,5,6]);assert.equal(db.prepare('SELECT count(*) AS n FROM official_documents').get().n,7);assert.equal(objects.size,7);
  const before=db.prepare('SELECT id,payload FROM entries ORDER BY id').all();failing=true;const retry=await collectRegionalNotices(0,3);assert.equal(retry.added,0);assert.equal(retry.checks.find(c=>c.source==='fixture-1').status,'error');assert.deepEqual(db.prepare('SELECT id,payload FROM entries ORDER BY id').all(),before);
 }finally{regionalOfficialSources.splice(0,regionalOfficialSources.length,...originals);}
});
