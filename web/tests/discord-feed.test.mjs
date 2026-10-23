import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const {games}=await import('../lib/games.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {discordFeed}=await import('../lib/discord-feed.ts');
const now=Date.parse('2026-10-23T12:00:00Z'),stamp=new Date(now).toISOString();
const local=s=>({ko:s+' 한',en:s+' EN',ja:s+' 日',zh:s+' 中'});
const entry=(game,region,id=game.id+'-'+region)=>({id,gameId:game.id,region,kind:'pickup',poolType:'character',title:local('캐릭터'),summary:local('내용'),server:game.publisher,sourceUrl:game.official,sourceTitle:'Source',sourceKind:'official',startAt:'2026-10-22T02:00:00Z',endAt:'2026-11-11T04:00:00Z',publishedAt:stamp,verifiedAt:stamp,image:'/assets/test.png',imageLocale:'neutral',imageVerified:true,pickupMembers:[{name:local('캐릭터'),type:'new',role:'featured',image:'/assets/test.png',imageLocale:'neutral',imageVerified:true}],editor:{revision:4,fields:['title'],updatedAt:stamp}});
const entries=games.flatMap(game=>[...new Set(game.regions.map(r=>effectiveRegion(game,r)))].map(region=>entry(game,region)));

test('15 games × 4 languages × requested services retain actual schedule/market scope without private fields',()=>{
  for(const locale of ['ko','en','ja','zh'])for(const requested of ['kr','jp','global','cn']){
    const feed=discordFeed(entries,{},locale,requested,now);assert.equal(feed.games.length,15);
    assert.ok(!JSON.stringify(feed).includes('"editor"'));assert.ok(!JSON.stringify(feed).includes('"entityDetails"'));
    if(requested==='cn')assert.deepEqual([...new Set(feed.entries.map(e=>e.gameId))].sort(),['arknights','gfl2','reverse1999']);
    for(const item of feed.entries){
      const game=games.find(g=>g.id===item.gameId);assert.equal(item.region,effectiveRegion(game,requested));
      assert.equal(item.title,local('캐릭터')[locale]);assert.equal(item.timed,true);assert.equal(item.members[0].image,'/assets/test.png');
    }
  }
});
test('owner effective values, locale-safe artwork and concise copy survive; hidden/brand/foreign assets are excluded',()=>{
  const game=games.find(g=>g.id==='wuwa'),base=entry(game,'global');
  const owner={...base,title:local('운영자 수정'),image:game.logo,pickupMembers:[{...base.pickupMembers[0],image:'/assets/japanese.png',imageLocale:'ja'}]};
  const feed=discordFeed([owner,{...base,id:'hidden',hidden:true}],{},'ko','kr',now);
  assert.equal(feed.entries.length,1);assert.equal(feed.entries[0].title,'운영자 수정 한');assert.equal(feed.entries[0].image,undefined);assert.equal(feed.entries[0].members[0].image,undefined);
});
test('date-only schedules/forecast never gain synthetic clocks; weapon archives stay excluded and support cards remain',()=>{
  const game=games[0],base=entry(game,'global');
  const date={...base,id:'date',startAt:null,endAt:null,startDate:'2026-10-23',endDate:'2026-10-30'};
  const forecast={...base,id:'forecast',startAt:null,endAt:null,pickupArchive:{status:'forecast',startDate:'2026-10-24'}};
  const weapon={...base,id:'weapon-history',kind:'weapon',poolType:'weapon',pickupArchive:{status:'past'}};
  const support={...weapon,id:'support-history',poolType:'support'};
  const feed=discordFeed([date,forecast,weapon,support],{},'ko','kr',now);
  assert.equal(feed.entries.find(e=>e.id==='date').timed,false);assert.equal(feed.entries.find(e=>e.id==='date').startAt,null);
  assert.equal(feed.entries.find(e=>e.id==='forecast').forecast,true);assert.equal(feed.entries.find(e=>e.id==='forecast').timed,false);
  assert.ok(!feed.entries.some(e=>e.id==='weapon-history'));assert.ok(feed.entries.some(e=>e.id==='support-history'));
});
test('broadcast actual locale, archive and owner-ended override are preserved without time-to-LIVE conversion',()=>{
  const game=games[0],base=entry(game,'global'),broadcast={status:'scheduled',youtubeId:'abcdefghijk',locale:'ko',sourceUrl:'https://youtube.com/watch?v=abcdefghijk',announcementUrl:game.official,originalTitle:'방송',announcedAt:stamp,scheduledAt:'2026-10-23T12:30:00Z',endedAt:null,official:true,metadataVerified:true,watched:false,verifiedAt:stamp,statusCheckedAt:stamp};
  let feed=discordFeed([{...base,id:'stream',kind:'update',startAt:null,endAt:null,broadcast}],{},'ko','kr',now);
  assert.equal(feed.entries[0].broadcast.live,false);
  const ended={...base,id:'owner-ended',kind:'update',startAt:null,endAt:null,editor:{revision:1,fields:['broadcast'],updatedAt:stamp},broadcast:{...broadcast,status:'ended'}};
  feed=discordFeed([{...base,id:'older',kind:'update',broadcast},ended],{},'ko','kr',now);
  assert.equal(feed.entries.length,1);assert.equal(feed.entries[0].broadcast.status,'ended');
  assert.equal(discordFeed([ended],{},'ja','jp',now).entries.length,0);
});

globalThis.discordApiData={entries,settings:{},persistent:true};
registerHooks({resolve(s,c,n){if(s==='@/lib/store')return {url:'test:discord-read-store',shortCircuit:true};return n(s,c);},load(u,c,n){if(u==='test:discord-read-store')return {format:'module',source:'export const readData=async()=>globalThis.discordApiData',shortCircuit:true};return n(u,c);}});
const api=await import('../app/api/discord/data/route.ts');
test('deployed read-only endpoint contract: locale/region projection, ETag304, invalid region and persistent failure',async()=>{
  const request=new Request('https://gagether.wiki/api/discord/data?locale=ja&region=jp'),first=await api.GET(request),body=await first.json();
  assert.equal(body.locale,'ja');assert.equal(body.requestedRegion,'jp');assert.equal(body.revision.length,64);assert.equal(first.status,200);
  const same=await api.GET(new Request(request,{headers:{'If-None-Match':first.headers.get('ETag')}}));assert.equal(same.status,304);
  assert.equal((await api.GET(new Request('https://gagether.wiki/api/discord/data?region=oops'))).status,400);
  globalThis.discordApiData.persistent=false;assert.equal((await api.GET(request)).status,503);globalThis.discordApiData.persistent=true;
});
