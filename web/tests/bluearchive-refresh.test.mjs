import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {parseBaJp,regionalDetail,regionalMetadataChanges}=await import('../lib/regional-notices.ts');
const {currentVersion}=await import('../lib/version-hero.ts');
const {games}=await import('../lib/games.ts');
const loc=s=>({ko:s,en:s,ja:s,zh:s});
const headline='ピックアップ募集紹介：★3「トモエ(チーパオ)」、★3「マリナ(チーパオ)」、 ★3「カンナ」、★3「ノア」';
test('Blue Archive JP collects article title instead of category, full heading instead of truncated summary and actual publication milliseconds',async()=>{
 const [n]=parseBaJp({data:{rows:[{id:700,title:'お知らせ',summary:headline.slice(0,50)+'…',publishTime:1792472100000,content:'<p><strong>'+headline+'</strong></p><p>Actual original body</p>'}]}});
 assert.equal(n.title,headline);assert.equal(n.publishedAt,'2026-10-20T04:55:00.000Z');assert.equal(n.region,'jp');assert.equal(n.locale,'ja');
 let url;assert.equal(await regionalDetail(n,async u=>{url=u;return {ok:true,json:async()=>({data:{news:{content:'Exact official detail'}}})};}),'Exact official detail');assert.equal(url,'https://api-web.bluearchive.jp/api/news/detail?id=700');
 const fallback=parseBaJp({data:{rows:[{id:701,title:'お知らせ',summary:'コンテンツ更新のお知らせ',content:'<p><strong>Unrelated later section title longer than thirty chars</strong></p>'}]}})[0];assert.equal(fallback.title,'コンテンツ更新のお知らせ');
 await assert.rejects(()=>regionalDetail(n,async()=>({ok:false,status:403})),/HTTP 403/);
});
test('changed regional metadata updates existing feed record, preserves details/images/localization and does not invent a game schedule',()=>{
 const n={gameId:'bluearchive',region:'jp',locale:'ja',id:'701',url:'https://bluearchive.jp/news/newsJump/701',title:'コンテンツ更新のお知らせ（10/21 11:00）',publishedAt:'2026-10-20T05:55:00.000Z'};
 const old={id:'feed-bluearchive-701',gameId:n.gameId,region:n.region,sourceLocale:'ja',sourceUrl:n.url,sourceTitle:'お知らせ',title:loc('お知らせ'),publishedAt:null,verifiedAt:'2026-10-19T00:00:00Z',startAt:null,endAt:null,detailSections:[{title:loc('Reviewed'),body:loc('Retain me')}],image:'/assets/reviewed.png'};
 const [fixed]=regionalMetadataChanges([old],[n],'2026-10-23T02:00:00Z');assert.equal(fixed.id,old.id);assert.equal(fixed.title.ja,n.title);assert.equal(fixed.title.ko,old.title.ko);assert.equal(fixed.publishedAt,n.publishedAt);assert.equal(fixed.detailSections,old.detailSections);assert.equal(fixed.image,old.image);assert.equal(fixed.startAt,null);assert.equal(fixed.endAt,null);assert.equal(fixed.versionHero,undefined);
 assert.deepEqual(regionalMetadataChanges([fixed],[n],'2026-10-23T03:00:00Z'),[]);assert.deepEqual(regionalMetadataChanges([{...old,id:'custom-owner'}],[n],'2026-10-23T02:00:00Z'),[]);
});
test('date-only current version uses actual service day; future/expired headers cannot displace current',()=>{
 const game=games.find(g=>g.id==='bluearchive'),now=Date.parse('2026-10-22T15:00:00Z');
 const current={id:'current',gameId:game.id,region:'jp',versionHero:true,title:loc('Current'),startAt:null,endAt:null,startDate:'2026-10-23',publishedAt:'2026-10-20T00:00:00Z'};
 assert.equal(currentVersion([current],game,'jp',now).id,'current');assert.equal(currentVersion([current],game,'jp',now-1),undefined);
 assert.equal(currentVersion([{...current,id:'future',startDate:'2026-10-24'},current],game,'jp',now).id,'current');assert.equal(currentVersion([{...current,endDate:'2026-10-22'}],game,'jp',now),undefined);
 assert.equal(currentVersion([{...current,startAt:'2026-10-23T11:00:00+09:00'}],game,'jp',now),undefined);
});
