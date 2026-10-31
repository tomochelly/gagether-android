import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {upcomingPickups}=await import('../lib/upcoming-pickups.ts');
const {timedSchedule}=await import('../lib/pickup-history.ts');
const {default:UpcomingPickups}=await import('../components/upcoming-pickups.tsx');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const local=name=>({ko:name,en:name,ja:name,zh:name});
const now=Date.parse('2026-10-17T00:00:00Z');
const art={image:'/assets/exact.webp',imageSource:'https://publisher.example/exact.webp',imageKind:'splash',imageVerified:true,imageLocale:'neutral'};
const entry={id:'next',gameId:'wuwa',kind:'pickup',region:'global',server:'Common',title:local('Suoming'),summary:local('Next banner'),sourceUrl:'https://publisher.example/phase-two',sourceTitle:'Official phase two',sourceKind:'official',startAt:null,endAt:null,publishedAt:null,verifiedAt:'2026-10-17T00:00:00Z',pickupType:'new',poolType:'character',pickupArchive:{status:'announced',startDate:'2026-10-22',endDate:'2026-11-11'}};

test('each featured character keeps its own art; secondary rate-ups do not become cards',()=>{
 const e={...entry,...art,pickupMembers:[{name:local('Suoming'),type:'new',role:'featured',...art},{name:local('Lynae'),type:'rerun',role:'featured'},{name:local('Lumi'),type:'rerun',role:'rate-up',...art}]};
 const cards=upcomingPickups([e],'ko',now);assert.equal(cards.length,2);assert.equal(cards.find(c=>c.name.en==='Suoming').art.image,art.image);assert.equal(cards.find(c=>c.name.en==='Lynae').art,undefined);
});
test('selectable candidates remain a single pool, not simultaneous featured pickups',()=>{
 const e={...entry,selectionCount:2,pickupMembers:Array.from({length:36},(_,i)=>({name:local('Candidate '+i),type:'rerun',role:'candidate',...art}))};
 assert.equal(upcomingPickups([e],'ko',now).length,1);
});
test('official date-only and community periods remain distinct and never create a clock',()=>{
 const forecast={...entry,id:'forecast',title:local('Forecast'),sourceKind:'community',pickupArchive:{...entry.pickupArchive,status:'forecast'}};
 assert.equal(upcomingPickups([entry,forecast],'ko',now).length,2);assert.equal(timedSchedule(entry),true);assert.equal(timedSchedule(forecast),false);assert.equal(entry.startAt,null);
 assert.equal(upcomingPickups([entry],'ko',Date.parse('2026-10-22T03:00:00Z')).length,0);
 assert.equal(upcomingPickups([forecast],'ko',Date.parse('2026-11-13T00:00:00Z')).length,0);
});
test('repeated archive/current records collapse without merging separate regional services',()=>{
 const regular={...entry,...art,id:'live-record',pickupArchive:undefined,startDate:'2026-10-22',endDate:'2026-11-11'};
 assert.equal(upcomingPickups([entry,regular],'ko',now).length,1);
 assert.equal(upcomingPickups([entry,{...entry,id:'cn',region:'cn'}],'ko',now).length,2);
});
test('reviewed full-body art is visible before release while unreviewed and wrong-language art stays rejected',()=>{
 assert.equal(upcomingPickups([{...entry,...art,imageKind:'character'}],'ko',now)[0].art.image,art.image);
 assert.equal(upcomingPickups([{...entry,...art,imageVerified:false}],'ko',now)[0].art,undefined);
 assert.equal(upcomingPickups([{...entry,...art,imageLocale:'ja'}],'ko',now)[0].art,undefined);
 const full=upcomingPickups([{...entry,...art,previewBounds:{left:40,right:60,top:10,bottom:30},previewArtwork:{...art,image:'/assets/crop.webp',width:400,height:400,verifiedAt:entry.verifiedAt}}],'ko',now)[0].art;
 assert.equal(full.image,art.image);assert.equal(full.previewBounds,undefined);assert.equal(full.previewArtwork,undefined);
});
function render(locale,simpleMode){const games=catalogGames({}),byId=Object.fromEntries(games.map(g=>[g.id,g]));return renderToStaticMarkup(createElement(CatalogContext.Provider,{value:{games,byId,t:catalogUi(locale,{}),settings:{},canEdit:false,editMode:false,simpleMode,openEditor(){}}},createElement(UpcomingPickups,{entries:[{...entry,...art}],locale,now,onOpen(){}})));}
test('all locales display scheduled dates; Simple mode does not mount closed illustrations',()=>{
 for(const locale of ['ko','en','ja','zh']){const regular=render(locale,false),simple=render(locale,true);assert.match(regular,/2026\.10\.22/);assert.match(regular,/upcoming-art/);assert.ok(regular.includes(catalogUi(locale,{}).newPickup));assert.ok(!regular.includes('undefined'));assert.ok(regular.includes(art.image));assert.ok(!simple.includes(art.image));assert.match(simple,/aria-expanded="false"/);}
});

test('registered full character originals fill future previews, without borrowing a different outfit or replacing a current splash',()=>{
 const name={ko:'에이언즈★아하',en:'Aeon ★ Aha',ja:'星神★アッハ',zh:'星神★阿哈'},e={...entry,gameId:'hsr',title:name,pickupMembers:[{name,type:'new',role:'featured'}]};
 const result=upcomingPickups([e],'ko',now)[0];assert.match(result.art.image,/hsr-aha-user-original/);assert.equal(result.art.imageKind,'character');
 const other={...e,pickupMembers:[{...e.pickupMembers[0],name:{...name,ko:'에이언즈★아하(다른 의상)'}}]};assert.equal(upcomingPickups([other],'ko',now)[0].art,undefined);
 const splash={...e,pickupMembers:[{...e.pickupMembers[0],...art}]};assert.equal(upcomingPickups([splash],'ko',now)[0].art.image,art.image);
});
