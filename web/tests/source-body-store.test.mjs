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

 test('stored official document identities preserve long query IDs for Japanese Trickcal',async()=>{
 const {noticeSourceId}=await import('../lib/official-collection.ts');
 assert.equal(noticeSourceId('https://trickcal.biligames.com/news/jp/h5/?news_detail_id=181792487759078017'),'181792487759078017');
 assert.equal(noticeSourceId('https://forum.nexon.com/bluearchive/board_view?board=1018&thread=3555107'),'3555107');
 });

 test('actual SQLite metadata write merges only metadata into the complete original, retaining nullable clocks, prices and image fields',async()=>{
 const {collectionEntry}=await import('../lib/collection-projection.ts');const {noticeMetadataChange,completeNoticeMetadata}=await import('../lib/fast-notices.ts');const {saveEntries}=await import('../lib/store.ts');
 const original={...entry,id:'metadata-roundtrip',versionHero:true,hidden:false,featured:true,publishedAt:null,price:{amount:1500,currency:'JPY',platform:'Android'},rarity:3,detailImages:[{image:'/assets/native.png'}],image:'/assets/native.png',imageVerified:true,imageLocale:'ja'};write(original);const lean=(await readData({automatic:true,collection:true})).entries.find(e=>e.id===original.id);assert.equal(lean.versionHero,1);assert.equal(lean.price,undefined);assert.equal(lean.startAt,undefined);
 const change=noticeMetadataChange(lean,{...notice,title:'最新の告知',publishedAt:null},'2026-10-23T05:00:00Z');const full=(await readBaseData({id:original.id})).entries[0];await saveEntries([completeNoticeMetadata(full,change)]);const saved=(await readBaseData({id:original.id})).entries[0];
 for(const key of ['startAt','endAt','publishedAt','versionHero','hidden','featured','price','rarity','detailImages','image','imageLocale','pickupMembers'])assert.deepEqual(saved[key],original[key],key);assert.ok(Object.hasOwn(saved,'startAt'));assert.ok(Object.hasOwn(saved,'endAt'));assert.equal(saved.sourceTitle,'最新の告知');
 });

 test('the actual multi-game feed refresh rehydrates full records before saving a native title edit',async()=>{
 const {refreshFeeds}=await import('../lib/feeds.ts');const original={...entry,id:'feed-bluearchive-700',sourceTitle:'古い見出し',sourceLocale:'ja',publishedAt:null,versionHero:true,featured:true,rarity:3,price:{amount:1500,currency:'JPY',platform:'Android'},relatedSources:[{kind:'community',title:'Guide',url:'https://game8.jp/blue-archive/1'}],detailImages:[{image:'/assets/native.png'}]};write(original);const savedFetch=globalThis.fetch;
 globalThis.fetch=async u=>String(u).includes('api-web.bluearchive.jp/api/news/list')?Response.json({data:{rows:[{id:700,summary:'最新の告知…',content:'<p><strong>最新の告知：全内容</strong></p>'}]}}):Response.json({retcode:1,code:1});
 try{const results=await refreshFeeds();assert.equal(results.find(r=>r.gameId==='bluearchive').status,'ok');const updated=(await readBaseData({id:original.id})).entries[0];for(const key of ['startAt','endAt','publishedAt','versionHero','featured','rarity','price','relatedSources','detailImages'])assert.deepEqual(updated[key],original[key],key);assert.equal(updated.sourceTitle,'最新の告知：全内容');}finally{globalThis.fetch=savedFetch;}
 });

test('actual D1/R2 weapon collection publishes schedules, retains owner overrides and does not write again for unchanged sources',async()=>{
 const {importWuwaWeapons}=await import('../lib/wuwa-weapon-store.ts');
 const weapon={...entry,id:'wuwa-3-7-phase-2-freeze-frame',gameId:'wuwa',region:'global',kind:'weapon',title:{...blank,ko:'프리즈 프레임',ja:'フリーズフレーム'},startDate:'2026-10-22',endDate:'2026-11-11',image:'/assets/original-weapon.png',imageVerified:true,sourceLocale:'ko'};write(weapon);
 const ownerPayload=JSON.stringify({image:'/api/media/owner-weapon.png',summary:{...blank,ko:'Owner weapon detail'}});db.prepare('INSERT INTO editorial(key,payload,revision,updated_at,updated_by) VALUES (?,?,?,?,?)').run('entry:'+weapon.id,ownerPayload,3,time,'owner');
 const fixture=JSON.parse(fs.readFileSync('tests/fixtures/wuwa/ja-5670.json','utf8')),n={gameId:'wuwa',region:'global',locale:'ja',id:'5670',url:'https://wutheringwaves.kurogames.com/jp/main/news/detail/5670',title:fixture.title,publishedAt:'2026-10-21'};
 const document=await captureDocument(n,'<article>'+fixture.text.split('\n').map(t=>'<p>'+t+'</p>').join('')+'</article>','2026-10-23T06:00:00Z');const result=await importWuwaWeapons([document.id]);assert.ok(result.changedEntries.includes(weapon.id));
 const saved=(await readBaseData({id:weapon.id})).entries[0],effective=(await readData()).entries.find(e=>e.id===weapon.id);assert.equal(saved.endAt,'2026-11-11T12:59:00+09:00');assert.equal(saved.image,weapon.image);assert.equal(effective.image,'/api/media/owner-weapon.png');assert.equal(effective.summary.ko,'Owner weapon detail');assert.equal(db.prepare('SELECT payload FROM editorial WHERE key=?').get('entry:'+weapon.id).payload,ownerPayload);
 const stamp=db.prepare('SELECT updated_at FROM entries WHERE id=?').get(weapon.id).updated_at;assert.deepEqual((await importWuwaWeapons([document.id])).changedEntries,[]);assert.equal(db.prepare('SELECT updated_at FROM entries WHERE id=?').get(weapon.id).updated_at,stamp);assert.equal(db.prepare('SELECT reviewed_hash FROM official_documents WHERE id=?').get(document.id).reviewed_hash,null);
});
