import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {games}=await import('../lib/games.ts');
const {contentInAudience,audienceRestrictions}=await import('../lib/content-audience.ts');
const {noticeEntry}=await import('../lib/fast-notices.ts');
const {artworkForLocale,detailArtworkForLocale}=await import('../lib/artwork.ts');
const {gameBroadcasts,broadcastState}=await import('../lib/broadcast-visibility.ts');
const {favoriteNoticeGroups}=await import('../lib/favorite-updates.ts');
const game=id=>games.find(g=>g.id===id);
const titles={ko:'지역 행사',en:'Local event',ja:'地域イベント',zh:'地区活动'};
const base={id:'local',gameId:'hsr',kind:'event',region:'global',title:titles,summary:titles,sourceUrl:'https://official.example/event',sourceTitle:'Local event',verifiedAt:'2026-10-21T03:00:00Z',publishedAt:'2026-10-21T00:00:00Z',startAt:null,endAt:null};

test('four native recap editions do not duplicate each other in translated update lists',()=>{
 const rows=['ko','en','ja','zh'].map(sourceLocale=>({...base,id:'recap-hsr-'+sourceLocale,kind:'update',sourceLocale,translatedLocales:['ko','en','ja','zh'],broadcastRecap:{youtubeId:'psifFhA2QAA'}}));
 const original=JSON.stringify(rows);
 for(const locale of ['ko','en','ja','zh'])assert.deepEqual(rows.filter(e=>contentInAudience(e,game('hsr'),'global',locale)).map(e=>e.sourceLocale),[locale]);
 assert.equal(JSON.stringify(rows),original);
});
test('new physical-campaign followups inherit the reviewed market while Korean gameplay and global in-game collaborations remain available',()=>{
 const n={gameId:'wuwa',region:'global',locale:'ko',id:'8367516',title:'[명조 X 롯데시네마 콜라보] 2주차 사전 예약',url:'https://game.naver.com/lounge/WutheringWaves/board/detail/8367516',publishedAt:'2026-10-26'};
 const entry=noticeEntry(n,'2026-10-27T00:00:00Z');assert.equal(entry.marketRegion,'kr');
 const {marketRegion,...legacy}=entry;
 assert.equal(contentInAudience(legacy,game('wuwa'),'global','en'),false);
 assert.equal(contentInAudience(legacy,game('wuwa'),'global','ko'),true);
 assert.equal(contentInAudience(legacy,game('wuwa'),'global','ja'),false);
 assert.equal(contentInAudience({...legacy,collaboration:{scope:'ingame'}},game('wuwa'),'global','en'),true);
 assert.equal(contentInAudience({...legacy,marketRegion:'global'},game('wuwa'),'global','en'),true);
 const gameplay=noticeEntry({...n,title:'3.8 버전 신규 캐릭터 및 전투 업데이트'},'2026-10-27T00:00:00Z');assert.equal(gameplay.marketRegion,undefined);assert.equal(contentInAudience(gameplay,game('wuwa'),'global','en'),true);
 const cafe=noticeEntry({...n,gameId:'trickcal',region:'kr',title:'토끼 카페 대작전 게임 이벤트',url:'https://game.naver.com/lounge/Trickcal/board/detail/8189600'},'2026-10-27T00:00:00Z');assert.equal(cafe.marketRegion,undefined);
});
test('reviewed campaign secondary originals restrict duplicate notices, without widening across games',()=>{
 const url='https://game.naver.com/lounge/WutheringWaves/board/detail/8311300',reviewed={...base,gameId:'wuwa',marketRegion:'kr',collaboration:{scope:'offline',sourceUrls:[url]}},feed={...base,gameId:'wuwa',id:'feed-copy',sourceUrl:url};
 const original=JSON.stringify([reviewed,feed]),restrict=audienceRestrictions([reviewed,feed]);
 assert.equal(contentInAudience(restrict(feed),game('wuwa'),'global','en'),false);
 assert.equal(contentInAudience(restrict(feed),game('wuwa'),'global','ko'),true);
 assert.equal(restrict({...feed,gameId:'hsr'}).audienceRegions,undefined);
 assert.equal(JSON.stringify([reviewed,feed]),original);
});
test('all content surfaces reject KR-only local campaigns in EN/JP, without removing shared gameplay',()=>{
 for(const kind of ['event','package','update']){
  const e={...base,kind,marketRegion:'kr'};
  assert.equal(contentInAudience(e,game('hsr'),'global','en'),false);
  assert.equal(contentInAudience(e,game('hsr'),'global','ja'),false);
  assert.equal(contentInAudience(e,game('hsr'),'global','ko'),true);
 }
 for(const locale of ['ko','en','ja','zh'])assert.equal(contentInAudience(base,game('hsr'),'global',locale),true);
 const regional={...base,marketRegion:'kr'},feed={...base,id:'feed-copy',kind:'update'};
 assert.equal(contentInAudience(audienceRestrictions([regional,feed])(feed),game('hsr'),'global','en'),false);
 assert.equal(favoriteNoticeGroups([regional,feed],[game('hsr')],['hsr'],'global',{},'en')[0].notices.length,0);
});
test('canonical shared KR schedule does not leak KRW into English; independent JP/CN retains its real market',()=>{
 const ba={...base,gameId:'bluearchive',kind:'package',region:'kr',marketRegion:'kr',price:{amount:11000,currency:'KRW',platform:'In-game'}};
 assert.equal(contentInAudience(ba,game('bluearchive'),'global','en'),false);
 assert.equal(contentInAudience({...ba,region:'jp',marketRegion:'jp',price:{...ba.price,currency:'JPY'}},game('bluearchive'),'jp','ko'),true);
 assert.equal(contentInAudience({...ba,gameId:'reverse1999',region:'cn',marketRegion:'cn',price:{...ba.price,currency:'CNY'}},game('reverse1999'),'cn','en'),true);
 assert.equal(contentInAudience(ba,game('hsr'),'kr','ko'),false);
});
test('selected JP/CN service current originals and detail art survive Korean UI; shared foreign fallback stays blocked',()=>{
 for(const [region,imageLocale] of [['jp','ja'],['cn','zh']]){
  const art={...base,gameId:region==='jp'?'bluearchive':'reverse1999',region,image:'https://official.example/banner.png',imageLocale,imageVerified:true};
  assert.equal(artworkForLocale(art,'ko','full').image,art.image);
  assert.equal(detailArtworkForLocale({...art,detailImages:[{...art,image:'https://official.example/detail.png'}]},'ko').length,1);
 }
 assert.equal(artworkForLocale({...base,image:'x',imageLocale:'ja',imageVerified:true},'ko','full').image,undefined);
});
test('broadcasts follow independent service, shared visitor language and fresh verified status only',()=>{
 const now=Date.parse('2026-10-21T03:30:00Z');
 const broadcast={status:'scheduled',official:true,metadataVerified:true,watched:false,locale:'ja',verifiedAt:'2026-10-21T03:00:00Z',scheduledAt:'2026-10-24T10:00:00Z',endedAt:null};
 const jp={...base,gameId:'bluearchive',region:'jp',broadcast};
 assert.equal(gameBroadcasts([jp],game('bluearchive'),'jp','ko',now).length,1);
 assert.equal(gameBroadcasts([jp],game('bluearchive'),'global','ko',now).length,0);
 assert.equal(gameBroadcasts([{...base,broadcast}],game('hsr'),'global','ko',now).length,0);
 assert.equal(broadcastState({...broadcast,status:'ended'},now),'inactive');
 assert.equal(broadcastState({...broadcast,status:'cancelled'},now),'inactive');
 assert.equal(broadcastState({...broadcast,verifiedAt:'2026-10-20T00:00:00Z'},now),'scheduled');
 assert.equal(broadcastState({...broadcast,verifiedAt:'2026-10-20T00:00:00Z',scheduledAt:'2026-10-21T01:00:00Z'},now),'inactive');
 assert.equal(broadcastState({...broadcast,scheduledAt:'2026-10-21T03:15:00Z'},now),'scheduled');
});

test('independent Global service remains global in Korean UI, while a shared global schedule uses the local market',()=>{
 const e={...base,gameId:'umamusume',kind:'package',region:'global',marketRegion:'global',price:{amount:9.99,currency:'USD'}};
 assert.equal(contentInAudience(e,game('umamusume'),'global','ko'),true);
 assert.equal(contentInAudience({...e,gameId:'hsr'},game('hsr'),'global','ko'),false);
 assert.equal(artworkForLocale({...e,image:'official-en',imageVerified:true,imageLocale:'en'},'ko','full').image,'official-en');
 assert.equal(artworkForLocale({...e,gameId:'hsr',image:'official-en',imageVerified:true,imageLocale:'en'},'ko','full').image,undefined);
});


test('Umamusume JP and Arknights CN banners keep service originals ahead of Korean variants',()=>{
 for(const [gameId,region,imageLocale] of [['umamusume','jp','ja'],['arknights','cn','zh']]){
  const art={...base,gameId,region,image:'service-original',imageLocale,imageVerified:true,localizedArtwork:{ko:{image:'korean-variant',imageLocale:'ko',imageVerified:true}}};
  for(const locale of ['ko','en','ja','zh'])for(const mode of ['preview','full'])assert.equal(artworkForLocale(art,locale,mode).image,'service-original');
  const withWrongPreview={...art,previewArtwork:{image:'korean-preview',imageLocale:'ko',imageVerified:true}};
  assert.equal(artworkForLocale(withWrongPreview,'ko','preview').image,'service-original');
  const withServiceVariant={...art,image:'korean-base',imageLocale:'ko',localizedArtwork:{...art.localizedArtwork,[imageLocale]:{image:'service-variant',imageLocale,imageVerified:true}}};
  for(const locale of ['ko','en','ja','zh'])for(const mode of ['preview','full'])assert.equal(artworkForLocale(withServiceVariant,locale,mode).image,'service-variant');
  assert.equal(artworkForLocale({...art,image:'korean-base',imageLocale:'ko'},'ko','full').image,undefined);
 }
});
