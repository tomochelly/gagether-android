import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {games}=await import('../lib/games.ts');
const {contentInAudience,audienceRestrictions}=await import('../lib/content-audience.ts');
const {artworkForLocale,detailArtworkForLocale}=await import('../lib/artwork.ts');
const {gameBroadcasts,broadcastState}=await import('../lib/broadcast-visibility.ts');
const {favoriteNoticeGroups}=await import('../lib/favorite-updates.ts');
const game=id=>games.find(g=>g.id===id);
const titles={ko:'지역 행사',en:'Local event',ja:'地域イベント',zh:'地区活动'};
const base={id:'local',gameId:'hsr',kind:'event',region:'global',title:titles,summary:titles,sourceUrl:'https://official.example/event',sourceTitle:'Local event',verifiedAt:'2026-10-21T03:00:00Z',publishedAt:'2026-10-21T00:00:00Z',startAt:null,endAt:null};
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
