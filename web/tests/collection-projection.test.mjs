import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const {collectionEntry,collectionSql}=await import('../lib/collection-projection.ts');
const {retainEntityDetails}=await import('../lib/presentation.ts');
const title={ko:'정확한 이름',en:'Exact subject',ja:'正確な名前',zh:'准确名称'},art={image:'/assets/verified.png',imageSource:'https://publisher.test/original',imageVerified:true,imageLocale:'ja'},at='2026-10-23T03:00:00Z';
const entry={id:'rotation',gameId:'zzz',region:'global',kind:'pickup',title,summary:title,sourceUrl:'https://zenless.hoyoverse.com/ja-jp/news/1',sourceTitle:'Original',sourceKind:'official',verifiedAt:at,startAt:at,endAt:'2026-11-01T00:00:00Z',...art,localizedArtwork:{ja:{...art,width:1920,height:1080}},detailSections:[{title,body:{...title,en:'Long skills '.repeat(10000)}}],pickupMembers:[{name:title,type:'new',role:'featured',...art,localizedArtwork:{ja:{...art,width:1920,height:1080}}}]};
test('real SQLite collection projection retains clock, provenance and exact names without artwork or full bodies',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE entries(id TEXT,game_id TEXT,payload TEXT)');db.prepare('INSERT INTO entries VALUES(?,?,?)').run(entry.id,entry.gameId,JSON.stringify(entry));
 const sql=collectionEntry(JSON.parse(db.prepare('SELECT '+collectionSql+' AS payload FROM entries').get().payload)),js=collectionEntry(entry);
 assert.deepEqual(sql,js);assert.equal(sql.pickupMembers[0].name.ja,entry.pickupMembers[0].name.ja);assert.equal(sql.startAt,at);assert.equal(sql.sourceTitle,'Original');assert.equal(sql.image,undefined);assert.equal(sql.pickupMembers[0].image,undefined);assert.equal(sql.detailSections,undefined);assert.ok(JSON.stringify(sql).length<JSON.stringify(entry).length/20);db.close();
 const restored=retainEntityDetails(sql,entry);assert.equal(restored.image,entry.image);assert.equal(restored.detailSections,entry.detailSections);assert.equal(restored.pickupMembers[0].image,entry.pickupMembers[0].image);assert.equal(restored.localizedArtwork.ja.image,entry.localizedArtwork.ja.image);
});
test('an unreviewed replacement URL cannot overwrite a reviewed original, while explicit audit corrections remain possible',()=>{
 assert.equal(retainEntityDetails({...entry,image:'https://publisher.test/unreviewed.png',imageVerified:undefined},entry).image,entry.image);
 assert.equal(retainEntityDetails({...entry,image:'https://publisher.test/new.png',imageVerified:true},entry).image,'https://publisher.test/new.png');
 assert.equal(retainEntityDetails({...entry,imageVerified:false},entry).imageVerified,false);
});
test('production snapshot collection size and invariant checks can be measured without sending details to a Worker',async()=>{
 const path=process.env.GAGETHER_AUDIT_DATA;
 const rows=path?JSON.parse(readFileSync(path)).entries:Array.from({length:100},(_,i)=>({...entry,id:'large-'+i})),lean=rows.map(collectionEntry);
 assert.equal(lean.length,rows.length);assert.ok(JSON.stringify(lean).length<JSON.stringify(rows).length/2);
 for(let i=0;i<rows.length;i++){assert.equal(lean[i].id,rows[i].id);assert.equal(lean[i].verifiedAt,rows[i].verifiedAt);}
});

 test('headline corrections retain stored details and exact artwork through the real lean feed path',async()=>{
 const {feedEntry}=await import('../lib/feed-entry.ts');const {blueArchiveTitle}=await import('../lib/bluearchive-title.ts');
 const old={...entry,id:'feed-bluearchive-700',gameId:'bluearchive',region:'jp',sourceLocale:'ja',sourceUrl:'https://bluearchive.jp/news/newsJump/700',sourceTitle:'募集紹介…',detailImages:[{...art,width:1280,height:720}],contents:[title],highlights:[title]};
 const headline=blueArchiveTitle({summary:'募集紹介…',content:'<p><strong>募集紹介：★3「トモエ」、★3「マリナ」</strong></p>'});assert.equal(headline,'募集紹介：★3「トモエ」、★3「マリナ」');
 const next=feedEntry('bluearchive','jp',{id:'700',sourceLocale:'ja',titles:{ja:headline},urls:{ja:old.sourceUrl}},'2026-10-23T04:00:00Z',collectionEntry(old));const saved=retainEntityDetails(next,old);
 assert.equal(saved.startAt,old.startAt);assert.equal(saved.endAt,old.endAt);assert.equal(saved.kind,old.kind);assert.equal(saved.sourceTitle,headline);assert.deepEqual(saved.detailImages,old.detailImages);assert.deepEqual(saved.detailSections,old.detailSections);assert.deepEqual(saved.highlights,old.highlights);assert.deepEqual(saved.contents,old.contents);
 assert.deepEqual(retainEntityDetails({...next,sourceTitle:'募集紹介…'},saved).detailImages,old.detailImages,'a list excerpt cannot erase the full gallery');
 });
