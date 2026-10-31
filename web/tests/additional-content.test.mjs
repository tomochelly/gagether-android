import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
const read=n=>fs.readFileSync('tests/fixtures/additional/'+n,'utf8');
const {nativeBody,dnaEventEntries,hololiveArticleLinks,hololiveRelease,hololiveEntries,limbusEventLinks,limbusCalendarEntry,applyAdditionalContent}=await import('../lib/additional-game-content.ts');
const {parseSteamEvents,steamNoticeImage}=await import('../lib/additional-game-notices.ts');
const {noticeEntry}=await import('../lib/fast-notices.ts');
const {allowsRewards}=await import('../lib/content-roles.ts');
const {bodyRewards}=await import('../lib/source-bodies.ts');
const stamp='2026-10-24T00:00:00Z',dnaNotices=parseSteamEvents(JSON.parse(read('dna-native-ko.json')),'dna','ko');
test('native Steam IDs do not collide across languages and generic title art never becomes pickup artwork',()=>{
 for(const gameId of ['limbus','dna','holodreams']){
  const rows=['ko','en','ja','zh'].map(locale=>noticeEntry({gameId,region:'global',id:'123456',title:'Native',url:`https://store.steampowered.com/news/app/${{limbus:1973530,dna:3950020,holodreams:4282500}[gameId]}/view/123456?l=${locale}`,locale,publishedAt:null},stamp));
  assert.equal(new Set(rows.map(e=>e.id)).size,4);
 }
 const event={jsondata:JSON.stringify({localized_title_image:Array(11).fill('1dc5775f3444c32d11acb9d57c03232157739877.png'),localized_capsule_image:{4:'aea5cd17100307544d29ad1b318bca630da0a07d.png'}})};
 assert.match(steamNoticeImage(event,'limbus','ko'),/aea5cd/);assert.doesNotMatch(steamNoticeImage(event,'limbus','ko'),/1dc577/);
 assert.equal(steamNoticeImage({...event,jsondata:'broken'},'limbus','ko'),'');
});
test('real Korean DNA body separates eighteen explicit windows, repeating theatre rotations and reward quantities',async()=>{
 const n=dnaNotices[0],body=await nativeBody('ko',n.url,n.title,n.bodyHtml,'official',stamp),events=await dnaEventEntries(body,n.publishedAt);
 assert.equal(events.length,18);assert.equal(new Set(events.map(e=>e.id)).size,18);
 const theatres=events.filter(e=>e.title.ko==='몰입형 연극');assert.equal(theatres.length,2);assert.notEqual(theatres[0].id,theatres[1].id);assert.equal(theatres[0].startAt,null);assert.equal(theatres[0].endAt,'2026-11-10T11:00:00+09:00');assert.equal(theatres[1].startAt,'2026-11-10T11:00:00+09:00');
 assert.equal(events.find(e=>e.title.ko==='다가올 내일').rewards[0].quantity,'10');
 assert.ok(events.every(e=>e.kind==='event'&&e.contentRole==='activity'&&!e.pickupArchive));
 const polluted={...events[1],contentRole:undefined,rewards:[{name:{ko:'월석',en:'Phoxene',ja:'月ノ石',zh:'月石'},quantity:'300'}]};
 assert.deepEqual(applyAdditionalContent([polluted],[events[1]])[0].rewards,events[1].rewards);
 assert.equal(allowsRewards({kind:'update',contentRole:'entity'}),false);assert.deepEqual(bodyRewards({kind:'update',contentRole:'entity',gameId:'dna'},body),[]);
 const unchanged=await nativeBody('ko',n.url,n.title,n.bodyHtml,'official','2026-10-24T02:00:00Z');assert.equal(unchanged.bodyHash,body.bodyHash);
 assert.deepEqual(applyAdditionalContent(events,await dnaEventEntries(unchanged,n.publishedAt)),[]);
});
test('real hololive publisher reprint excludes embedded NTE ads, keeps native originals and four simultaneous identities',async()=>{
 const url='https://gamewith.jp/gamedb/15524/articles/64568',release=hololiveRelease(read('holodreams-release.html'),url);
 assert.doesNotMatch(release.html,/Neverness|steam_ad|GameWith編集者情報|transparent1px/);assert.match(release.html,/img\/original_/);
 const rows=await hololiveEntries(read('holodreams-release.html'),url,stamp),pickup=rows.find(e=>e.kind==='pickup'),event=rows.find(e=>e.kind==='event');
 assert.equal(pickup.pickupMembers.length,4);assert.ok(pickup.pickupMembers.every(m=>m.type==='new'&&m.role==='featured'&&m.rarity===5));assert.equal(pickup.endDate,'2026-10-29');assert.equal(event.endDate,'2026-10-27');assert.equal(pickup.endAt,null);assert.equal(pickup.sourceKind,'community');
 assert.ok(hololiveArticleLinks(read('holodreams-index.html')).includes(url));assert.throws(()=>hololiveRelease(read('holodreams-release.html'),'https://gamewith.jp/gamedb/other/articles/64568'));
});
test('real community calendar retains forecast dates without clocks and cannot downgrade a reviewed official rotation',()=>{
 const url='https://www.pickupcal.com/events/925219/',e=limbusCalendarEntry(read('limbus-next.html'),url,stamp);assert.equal(e.pickupArchive.status,'forecast');assert.equal(e.startAt,null);assert.equal(e.endAt,null);assert.equal(e.pickupArchive.startDate,'2026-10-29');
 assert.ok(limbusEventLinks(read('limbus-index.html')).includes(url));
 const original={...e,id:'reviewed',sourceKind:'official',startAt:'2026-10-29T12:00:00+09:00',endAt:'2026-11-12T10:00:00+09:00',pickupArchive:undefined};assert.deepEqual(applyAdditionalContent([original],[e]),[]);
 const past=limbusCalendarEntry(read('limbus-next.html'),url,'2026-12-01T00:00:00Z');assert.equal(past.pickupArchive.status,'past');
});
test('Point Rally period sibling headings remain attached to their named publisher event',async()=>{
 const html='<div id="article-body">以下、プレスリリース<h2>『hololive Dreams』ホロドリ</h2><p>株式会社QualiArts</p><h3>■ポイントラリーイベント「私たちのHalloween Fever！」開催！！</h3><p>Event art</p><h3>イベント開催期間</h3><p>2026年10月29日（木）12:00～2026年11月4日（水）19:59</p><p>ライブとミニゲームでイベントPtを集めます。</p><h3>■今後のアップデート</h3><p>11月末にチャレンジライブを追加予定</p></div>';
 const rows=await hololiveEntries(html,'https://gamewith.jp/gamedb/15524/articles/65016',stamp),event=rows.find(e=>e.kind==='event');assert.equal(event.title.ja,'私たちのHalloween Fever！');assert.equal(event.startDate,'2026-10-29');assert.equal(event.endDate,'2026-11-04');assert.equal(event.endAt,null);assert.match(event.sourceBodies.ja.text,/イベントPt/);assert.doesNotMatch(event.sourceBodies.ja.text,/チャレンジライブ/);assert.equal(rows.filter(e=>e.kind==='event').length,1);
});
const db=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}}
globalThis.__additionalEnv={DB:{prepare,async batch(rows){return Promise.all(rows.map(r=>r.run()))}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__additionalEnv',shortCircuit:true};return n(s,c)}});
test('actual SQLite collector survives partial failure, preserves owner edits and locale art, and is idempotent',async()=>{
 const {importAdditionalGameContent}=await import('../lib/additional-content-store.ts'),{readBaseData,readData}=await import('../lib/store.ts');
 const native=globalThis.fetch;
 globalThis.fetch=async url=>{const u=String(url);
  if(u.includes('appid=3950020'))return Response.json(JSON.parse(read('dna-native-ko.json')));
  if(u==='https://www.pickupcal.com/games/limbus/')return new Response(read('limbus-index.html'));
  if(u==='https://www.pickupcal.com/events/925219/')return new Response(read('limbus-next.html'));
  if(u==='https://www.pickupcal.com/events/925215/')return new Response(read('limbus-current.html'));
  if(u==='https://gamewith.jp/gamedb/15524/articles')return new Response(read('holodreams-index.html'));
  if(u==='https://gamewith.jp/gamedb/15524/articles/64568')return new Response(read('holodreams-release.html'));
  return new Response('Unavailable',{status:403});};
 try{
  const first=await importAdditionalGameContent();assert.equal(first.outcome,'partial');assert.ok(first.changedEntries.length>=21);
  const id='holodreams-global-blissful-seaside-days-20261019',before=(await readBaseData({id})).entries[0];assert.equal(before.pickupMembers.length,4);assert.ok(before.pickupMembers.every(m=>m.imageLocale==='neutral'&&m.localizedArtwork.ja.imageLocale==='ja'));
  const owner=JSON.stringify({summary:{ko:'Owner words',en:'Owner',ja:'Owner',zh:'Owner'},image:'/api/media/00000000-0000-0000-0000-000000000000.png'});
  db.prepare('INSERT INTO editorial(key,payload,revision,updated_at,updated_by) VALUES(?,?,?,?,?)').run('entry:'+id,owner,1,stamp,'owner');
  const second=await importAdditionalGameContent();assert.deepEqual(second.changedEntries,[]);const after=(await readBaseData({id})).entries[0];assert.deepEqual(after,before);assert.equal((await readData()).entries.find(e=>e.id===id).summary.ko,'Owner words');assert.equal(db.prepare('SELECT payload FROM editorial WHERE key=?').get('entry:'+id).payload,owner);
  globalThis.fetch=async()=>new Response('Blocked',{status:403});const failed=await importAdditionalGameContent();assert.equal(failed.outcome,'failed');assert.deepEqual((await readBaseData({id})).entries[0],before);
 }finally{globalThis.fetch=native;}
});
