import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import fs from 'node:fs';
const db=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function prepare(sql){let args=[];return {bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const result=db.prepare(sql).run(...args);return {meta:{changes:result.changes}}}}}
const bucket=new Map();globalThis.__bodyStoreEnv={DB:{prepare,async batch(qs){return Promise.all(qs.map(q=>q.run()))}},BUCKET:{async put(k,v){bucket.set(k,v)},async get(k){return bucket.has(k)?{async json(){return JSON.parse(bucket.get(k))}}:null}}};
registerHooks({resolve(s,c,n){return s==='cloudflare:workers'?{url:'data:text/javascript,export const env=globalThis.__bodyStoreEnv',shortCircuit:true}:n(s,c)}});
const {captureDocument}=await import('../lib/collection-store.ts');
const {importCapturedBodies}=await import('../lib/source-body-store.ts');
const {readBaseData,readData}=await import('../lib/store.ts');
const blank={ko:'',en:'',ja:'',zh:''},time='2026-10-22T08:00:00Z',url='https://bluearchive.jp/news/newsJump/700';
const entry={id:'body-database-test',gameId:'bluearchive',region:'jp',server:'jp',kind:'update',title:{...blank,ja:'アップデート'},summary:{...blank},sourceUrl:url,sourceTitle:'アップデート',sourceLocale:'ja',verifiedAt:time,startAt:null,endAt:null,publishedAt:'2026-10-22'};
const write=e=>db.prepare('INSERT OR REPLACE INTO entries(id,game_id,payload,updated_at) VALUES (?,?,?,?)').run(e.id,e.gameId,JSON.stringify(e),time);
write(entry);write({...entry,id:'other-service',region:'kr'});
const owner=JSON.stringify({title:{...blank,ja:'Owner title'},image:'/api/media/owner.png'});db.prepare('INSERT INTO editorial(key,payload,revision,updated_at,updated_by) VALUES (?,?,?,?,?)').run('entry:'+entry.id,owner,2,time,'owner-test');
const notice={gameId:'bluearchive',region:'jp',locale:'ja',id:'700',url,title:'アップデート',publishedAt:'2026-10-22'};

test('real D1/R2 import publishes readable full body, preserves owner data and does not grant reviewed status',async()=>{
 const d=await captureDocument(notice,'<p>参加条件: 任務2-3クリア。全員に青輝石 × 150 個。受取期限11月22日。</p><a href="https://bluearchive.jp/join">参加</a><img src="https://example.com/ja.png">',time);
 assert.equal(d.sourceAccess,'body');const result=await importCapturedBodies([d.id]);assert.equal(result.importedDocuments,1);assert.deepEqual(result.changedEntries,[entry.id]);
 const saved=(await readBaseData({id:entry.id})).entries[0];assert.match(saved.sourceBodies.ja.text,/受取期限/);assert.equal(saved.sourceBodies.ja.links[0].label,'参加');assert.equal(saved.verifiedAt,time);
 const effective=(await readData()).entries.find(e=>e.id===entry.id);assert.equal(effective.title.ja,'Owner title');assert.match(effective.sourceBodies.ja.text,/任務/);assert.equal(effective.image,'/api/media/owner.png');
 assert.equal(db.prepare('SELECT payload FROM editorial WHERE key=?').get('entry:'+entry.id).payload,owner);assert.equal(db.prepare('SELECT reviewed_hash FROM official_documents WHERE id=?').get(d.id).reviewed_hash,null);
 assert.equal((await readBaseData({id:'other-service'})).entries[0].sourceBodies,undefined);
 const before=db.prepare('SELECT updated_at FROM entries WHERE id=?').get(entry.id).updated_at;assert.equal((await importCapturedBodies([d.id])).changedEntries.length,0);assert.equal(db.prepare('SELECT updated_at FROM entries WHERE id=?').get(entry.id).updated_at,before);
 assert.equal((await importCapturedBodies()).changedEntries.length,0,'receipts avoid starving older bodies');
});

test('source failure retains published body; a changed body hash is imported separately from old review',async()=>{
 await captureDocument(notice,undefined,'2026-10-23T01:00:00Z','HTTP 403');assert.equal((await importCapturedBodies()).changedEntries.length,0);assert.ok((await readBaseData({id:entry.id})).entries[0].sourceBodies.ja.text);
 const d=await captureDocument(notice,'<p>参加条件を変更。全員に青輝石 × 200 個。受取期限11月23日。</p>','2026-10-23T02:00:00Z');const result=await importCapturedBodies();assert.equal(result.importedDocuments,1);assert.match((await readBaseData({id:entry.id})).entries[0].sourceBodies.ja.text,/11月23日/);assert.equal(db.prepare('SELECT reviewed_hash FROM official_documents WHERE id=?').get(d.id).reviewed_hash,null);
});
