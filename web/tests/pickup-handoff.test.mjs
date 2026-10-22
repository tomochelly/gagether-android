import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {spotlightSlides}=await import('../lib/spotlight.ts');
const {cycleStartDate,pickupStartLabel}=await import('../lib/pickup-estimates.ts');
const {entrySchema,safePickupArchive,safeArtwork}=await import('../lib/content-schema.ts');
const {artworkForLocale}=await import('../lib/artwork.ts');
const {default:ArtworkMedia}=await import('../components/artwork-media.tsx');
const {pickupPeriod,timedSchedule}=await import('../lib/pickup-history.ts');
const {calendarMarks,activeOnDay}=await import('../lib/schedule.ts');
const {mobileFeed}=await import('../lib/mobile.ts');
const {retainEntityDetails}=await import('../lib/presentation.ts');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const {default:Spotlight}=await import('../components/spotlight.tsx');
const {historyText}=await import('../lib/pickup-history.ts');
const local=v=>({ko:v,en:v,ja:v,zh:v});
const now=Date.parse('2026-10-20T07:00:00Z');
const base={id:'old',gameId:'zzz',kind:'pickup',region:'global',server:'Global',title:local('Old'),summary:local('Summary'),sourceUrl:'https://zenless.hoyoverse.com/ko-kr/news/166475',sourceTitle:'Official',sourceKind:'official',startAt:'2026-09-30T04:00:00Z',endAt:'2026-10-20T07:00:00Z',publishedAt:null,verifiedAt:'2026-10-19T00:00:00Z',poolType:'character',pickupType:'new'};
const next={...base,id:'next',title:local('Next'),startAt:'2026-10-21T03:00:00Z',endAt:'2026-11-11T03:00:00Z',pickupArchive:{status:'announced',startDate:'2026-10-21',endDate:'2026-11-11'}};
const estimate={method:'cycle',scope:'version',anchorDate:'2026-09-30',cycleDays:42,startDate:'2026-11-11',basis:local('42 days from reviewed version start; phase unknown'),sourceUrls:[base.sourceUrl],verifiedAt:base.verifiedAt};
test('every game hands off at exact expiry to its nearest stored next rotation',()=>{
 for(const g of catalogGames({})){
  const old={...base,gameId:g.id},future={...next,gameId:g.id},later={...future,id:'later',startAt:'2026-11-15T03:00:00Z',endAt:'2026-12-01T03:00:00Z',pickupArchive:{status:'announced',startDate:'2026-11-15',endDate:'2026-12-01'}};
  assert.deepEqual(spotlightSlides([old,future,later],now-1).map(s=>s.entry.id),['old']);
  assert.deepEqual(spotlightSlides([old,future,later],now).map(s=>s.entry.id),['next']);
  assert.equal(pickupPeriod(spotlightSlides([old,future],now)[0].entry,now),'upcoming');
  assert.equal(pickupPeriod(spotlightSlides([old,future],Date.parse(future.startAt))[0].entry,Date.parse(future.startAt)),'current');
 }
});
test('another active game, independent service, or support pool cannot block handoff',()=>{
 const other={...base,id:'other',gameId:'wuwa',endAt:'2026-11-02T00:00:00Z'};
 const jp={...base,id:'jp',region:'jp',endAt:'2026-11-02T00:00:00Z'};
 const support={...next,id:'support',kind:'weapon',poolType:'support'};
 assert.deepEqual(new Set(spotlightSlides([base,next,other,jp,support],now).map(s=>s.entry.id)),new Set(['next','other','jp','support']));
});
test('all featured members retain their own full artwork; candidate and rate-up pools stay distinct',()=>{
 const art={image:'/assets/whole.webp',imageSource:base.sourceUrl,imageVerified:true,imageLocale:'neutral',imageKind:'splash',previewFocus:{x:42,y:34,zoom:1.1}};
 const pool={...next,...art,pickupMembers:[{name:local('A'),type:'new',role:'featured',...art,previewBounds:{left:40,right:60,top:10,bottom:40}},{name:local('B'),type:'rerun',role:'featured'},{name:local('C'),type:'rerun',role:'rate-up',...art}]};
 const slides=spotlightSlides([pool],now);assert.equal(slides.length,2);assert.equal(slides[0].art.image,art.image);assert.deepEqual(slides[0].art.previewFocus,art.previewFocus);assert.equal(slides[0].art.previewBounds,undefined);assert.equal(slides[1].art.image,undefined);
 assert.equal(spotlightSlides([{...pool,selectionCount:2,pickupMembers:pool.pickupMembers.map(m=>({...m,role:'candidate'}))}],now).length,1);
 const single={...next,pickupMembers:[pool.pickupMembers[0]]};assert.equal(spotlightSlides([single],now)[0].art.image,art.image);
 const owned={...single,...art,previewFocus:{x:57,y:42,zoom:1.2},previewBounds:{left:10,right:90,top:0,bottom:100},editor:{revision:1,updatedAt:base.verifiedAt,fields:['previewFocus','previewBounds']}};
 assert.deepEqual(spotlightSlides([owned],now)[0].art.previewFocus,owned.previewFocus);assert.deepEqual(spotlightSlides([owned],now)[0].art.previewBounds,owned.previewBounds);
});
test('duplicate archive/current rotation collapses and expired/hidden/weapon archives never revive',()=>{
 const current={...next,pickupArchive:undefined,id:'current'};
 const slides=spotlightSlides([next,current,{...next,id:'hidden',hidden:true},{...next,id:'weapon',kind:'weapon',poolType:'weapon'},{...base,id:'history',pickupArchive:{status:'past'}}],now);
 assert.equal(slides.length,1);assert.equal(slides[0].entry.id,'current');
});
test('independent Japanese service artwork keeps its real language; legacy fallback cannot override shared-service locale',()=>{
 const art={image:'/assets/exact-banner.webp',imageSource:base.sourceUrl,imageKind:'banner',imageVerified:true,imageLocale:'ja',originalLanguageFallback:true,imageCaption:local('Original Japanese release')};
 assert.equal(safeArtwork(art),true);
 for(const locale of ['ko','en','ja','zh']){
  assert.equal(artworkForLocale(art,locale,'full','ja').image,art.image);
  assert.equal(artworkForLocale(art,locale,'full').image,locale==='ja'?art.image:undefined);
 }
});
test('date estimates validate calendar arithmetic, survive omission, and never become live or alarms',()=>{
 assert.equal(cycleStartDate('2026-09-30',42),'2026-11-11');assert.equal(cycleStartDate('2026-02-30',42),undefined);
 const forecast={...next,id:'estimate',startAt:null,endAt:null,sourceKind:'community',pickupArchive:{status:'forecast',estimate}};
 assert.equal(entrySchema.safeParse(forecast).success,true);assert.equal(safePickupArchive(forecast),true);
 assert.equal(safePickupArchive({...forecast,pickupArchive:{status:'announced',estimate}}),false);
 assert.equal(safePickupArchive({...forecast,pickupArchive:{status:'forecast',estimate:{...estimate,startDate:'2026-11-12'}}}),false);
 assert.equal(pickupPeriod(forecast,Date.parse('2026-11-11T12:00:00Z')),'upcoming');
 assert.equal(timedSchedule(forecast),false);assert.equal(calendarMarks([forecast]).size,0);assert.equal(activeOnDay(forecast,'2026-11-11','2026-11-11'),false);assert.equal(mobileFeed([forecast],{},'ko').entries.length,0);
 assert.deepEqual(retainEntityDetails({...forecast,pickupArchive:{status:'forecast'}},forecast).pickupArchive.estimate,estimate);
 assert.equal(retainEntityDetails(next,forecast).pickupArchive.estimate,undefined);
 for(const l of ['ko','en','ja','zh'])assert.match(pickupStartLabel(forecast,l),/2026\.11\.11/);
 assert.match(pickupStartLabel(forecast,'ko'),/예상/);
});
test('all four languages show upcoming dates on the main banner without a synthetic clock',()=>{
 const games=catalogGames({}),byId=Object.fromEntries(games.map(g=>[g.id,g]));
 for(const locale of ['ko','en','ja','zh']){
  const forecast={...next,startAt:null,endAt:null,sourceKind:'community',pickupArchive:{status:'forecast',estimate}};
  const html=renderToStaticMarkup(createElement(CatalogContext.Provider,{value:{games,byId,t:catalogUi(locale,{}),settings:{},canEdit:false,editMode:false,simpleMode:false,openEditor(){}}},createElement(Spotlight,{slides:spotlightSlides([forecast],now),index:0,onIndex(){},locale,now,region:'global',fallbackGame:byId.zzz,gameView:true,onOpen(){},onGame(){},favorite:false,onFavorite(){}})));
  assert.match(html,/2026\.11\.11/);assert.match(html,/is-upcoming/);assert.doesNotMatch(html,/00:00:00|undefined/);
  const dateOnly={...next,startAt:null,endAt:null,startDate:'2026-10-20',pickupArchive:{status:'announced',startDate:'2026-10-20',endDate:'2026-11-11'}};
  const dayHtml=renderToStaticMarkup(createElement(CatalogContext.Provider,{value:{games,byId,t:catalogUi(locale,{}),settings:{},canEdit:false,editMode:false,simpleMode:false,openEditor(){}}},createElement(Spotlight,{slides:spotlightSlides([dateOnly],now),index:0,onIndex(){},locale,now,region:'global',fallbackGame:byId.zzz,gameView:true,onOpen(){},onGame(){},favorite:false,onFavorite(){}})));
  assert.match(dayHtml,/is-date-only/);assert.ok(dayHtml.includes(historyText[locale].dateOnly));assert.match(dayHtml,/spotlight-deadline/);
 }
});
