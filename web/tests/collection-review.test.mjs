import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {collectionCoverage,sourceDocument,pickupNotice}=await import('../lib/collection-review.ts');
const {games}=await import('../lib/games.ts');
const parsers=await import('../lib/regional-notices.ts');
const {detailArtworkForLocale}=await import('../lib/artwork.ts');
const loc=s=>({ko:s,en:s,ja:s,zh:s});
test('all fifteen games and only their canonical services are audited, including independent pools',()=>{
 const rows=collectionCoverage([],Date.parse('2026-10-23T01:00:00Z'));
 assert.equal(new Set(rows.map(r=>r.gameId)).size,15);
 assert.deepEqual([...new Set(rows.filter(r=>r.region==='cn').map(r=>r.gameId))].sort(),['arknights','gfl2','reverse1999']);
 assert.equal(rows.filter(r=>r.gameId==='stellasora').every(r=>r.region==='global'),true);
 for(const game of games)assert.ok(rows.some(r=>r.gameId===game.id));
 const e={id:'rotation',gameId:'arknights',region:'jp',kind:'pickup',poolType:'standard',pickupGroup:'rotation-202610',title:loc('中堅セレクト'),startAt:'2026-10-20T04:00:00+09:00',endAt:'2026-11-03T03:59:00+09:00'};
 const coverage=collectionCoverage([e],Date.parse('2026-10-23T01:00:00Z'));
 assert.equal(coverage.find(r=>r.gameId==='arknights'&&r.region==='jp'&&r.pool==='kernel').status,'covered');
 assert.equal(coverage.find(r=>r.gameId==='arknights'&&r.region==='jp'&&r.pool==='standard').status,'needs-review');
 assert.equal(collectionCoverage([e],Date.parse(e.endAt)).find(r=>r.gameId==='arknights'&&r.region==='jp'&&r.pool==='kernel').status,'needs-review');
});
test('source failures and JS-only responses cannot become reviewed official bodies or artwork',()=>{
 assert.equal(sourceDocument('<html><script>'+('x'.repeat(1300))+'</script><div id="app"></div></html>','https://arknights.jp/news/1').access,'js-only');
 const d=sourceDocument('<article><p>'+('Current official body. '.repeat(20))+'</p><img src="/current.png"><img src="http://invalid.test/a"><script>ignore()</script></article>','https://arknights.jp/news/1');
 assert.equal(d.access,'body');assert.deepEqual(d.images,['https://arknights.jp/current.png']);assert.equal(d.text.includes('ignore()'),false);
 for(const t of ['常驻标准寻访','中堅スカウト','헤드헌팅','Standard Headhunting'])assert.equal(pickupNotice(t),true);
 assert.throws(()=>parsers.parseAkCn({code:503}),/format changed/);
 assert.throws(()=>parsers.parseUmaJp({}),/format changed/);
});
test('regional API adapters preserve official identity and unknown publication timezones',()=>{
 const uma=parsers.parseUmaJp({information_list:[{announce_id:3490,title:'募集',post_at:'2026-10-13 12:00:00'}]})[0];
 assert.equal(uma.publishedAt,'2026-10-13');assert.equal(uma.region,'jp');assert.equal(uma.locale,'ja');
 const reverse=parsers.parseReverseCn({code:200,data:{pageData:[{id:102,title:'4.0',status:1,onlineTime:'2026-10-15 10:00:00',content:'full body'},{id:103,status:0}]}});
 assert.equal(reverse.length,1);assert.equal(reverse[0].url,'https://re.bluepoch.com/home/detail.html#newsId?102');assert.equal(reverse[0].bodyHtml,'full body');
 const cn=parsers.parseAkCn({code:0,data:{list:[{cid:3020,title:'公告',displayTime:1792512000}]}})[0];assert.equal(cn.region,'cn');assert.match(cn.publishedAt,/Z$/);
 assert.equal(parsers.regionalOfficialSources.length,15);
});
test('a multi-character detail gallery retains its official pool poster alongside member originals',()=>{
 const art={image:'/assets/pool.png',imageVerified:true,imageLocale:'ja'};
 const e={id:'multi',gameId:'arknights',region:'jp',kind:'pickup',...art,pickupMembers:[{name:loc('one'),role:'featured',image:'/assets/one.png',imageVerified:true,imageLocale:'neutral'},{name:loc('two'),role:'featured',image:'/assets/two.png',imageVerified:true,imageLocale:'neutral'}],detailImages:[art]};
 assert.equal(detailArtworkForLocale(e,'ko').length,1);
 assert.equal(detailArtworkForLocale({...e,pickupMembers:e.pickupMembers.slice(0,1)},'ko').length,0);
});

test('Trickcal body adapter reads the observed official public API and rejects mismatched lounge/receipt',async()=>{
 const notice={gameId:'trickcal',region:'kr',locale:'ko',id:'8346896',url:'https://game.naver.com/lounge/Trickcal/board/detail/8346896'};let called;
 const fetcher=async(url)=>{called=url;return Response.json({code:200,content:{feed:{feedId:8346896,loungeId:'Trickcal',contents:'<article>Exact official update</article>'}}});};
 assert.match(await parsers.regionalDetail(notice,fetcher),/Exact official update/);
 assert.equal(called,'https://comm-api.game.naver.com/nng_main/v1/community/lounge/Trickcal/feed/8346896');
 for(const feed of [{feedId:7,loungeId:'Trickcal',contents:'wrong'},{feedId:8346896,loungeId:'Other',contents:'wrong'},{feedId:8346896,loungeId:'Trickcal',contents:''}])await assert.rejects(()=>parsers.regionalDetail(notice,async()=>Response.json({code:200,content:{feed}})),/identity changed/);
 assert.equal(await parsers.regionalDetail({...notice,url:'https://evil.example/8346896'},fetcher),undefined);
 await assert.rejects(()=>parsers.regionalDetail(notice,async()=>new Response('',{status:403})),/HTTP 403/);
});

test('HI3 official Korean and independent Global bodies remain separate and publication clocks stay date-only',async()=>{
 const {hi3WebsiteSources,parseHi3Website}=await import('../lib/hi3-notices.ts');
 for(const source of hi3WebsiteSources){
  const data={retcode:0,data:{list:[{iInfoId:167008,sTitle:'Current version',dtStartTime:'2026-10-22 17:00:00',sContent:'<article>Full official body</article>'}]}},row=parseHi3Website(data,source)[0];
  assert.equal(row.region,source.region);assert.equal(row.locale,source.locale);assert.equal(row.url,source.site+'167008');assert.equal(row.publishedAt,'2026-10-22');assert.match(row.bodyHtml,/Full official body/);
  assert.equal(await parsers.regionalDetail(row,async url=>{assert.equal(url,source.url);return Response.json(data);}),row.bodyHtml);
  assert.throws(()=>parseHi3Website({retcode:503},source),/format changed/);
 }
});
