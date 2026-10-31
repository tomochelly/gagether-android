import './load-typescript.mjs';import{test}from'node:test';import assert from'node:assert/strict';
import fixture from '../android/app/src/test/resources/widget-six-games.json' with{type:'json'};
const {mobileFeed,mobileWidgetDateWindow}=await import('../lib/mobile.ts');
const {mobileSupportedGameIds}=await import('../lib/mobile-compatibility.ts');
const now=Date.parse('2026-10-29T13:00:00Z'),sample={...fixture.widgetEntries[0],sourceKind:'official'};
test('six real reported games survive the display projection and date facts never enter the alarm entries',()=>{
 const source=[...fixture.entries,...fixture.widgetEntries],feed=mobileFeed(source,{},'ko',undefined,now);
 assert.deepEqual([...new Set([...feed.entries,...feed.widgetEntries].map(e=>e.gameId))].sort(),['trickcal','hi3','reverse1999','limbus','dna','holodreams'].sort());
 assert.equal(feed.entries.length,3);assert.equal(feed.widgetEntries.length,3);
 for(const e of feed.widgetEntries){assert.equal(e.startAt,null);assert.equal(e.endAt,null);assert.equal(e.dateOnly,true);assert.equal(feed.entries.some(v=>v.id===e.id),false);assert.equal(e.endDate,source.find(s=>s.id===e.id).endDate);}
});
test('invalid, inferred, expired, hidden and other-market dates are not promoted',()=>{
 for(const e of [{...sample,startDate:'2026-02-30'},{...sample,startDate:'2026-11-05',endDate:'2026-10-29'},{...sample,endDate:'2026-10-28'},{...sample,pickupArchive:{status:'forecast'}},{...sample,sourceKind:'community'},{...sample,startDate:null,endDate:null}])assert.equal(mobileWidgetDateWindow(e,'ko',now),false);
 assert.equal(mobileFeed([{...sample,hidden:true}],{},'ko',undefined,now).widgetEntries.length,0);
 assert.equal(mobileFeed([{...sample,marketRegion:'jp'}],{},'ko',undefined,now).widgetEntries.length,0);
 assert.equal(mobileWidgetDateWindow({...sample,startDate:'2026-10-29',endDate:'2026-10-29'},'en',Date.parse('2026-10-30T02:00:00Z')),true,'western device still on previous date');
});
test('native capability fallback supports the added games in 1.0.4 and preserves explicit older-app limits',()=>{
 const ids=fixture.games.map(g=>g.id),added=['limbus','dna','holodreams'];
 for(const v of ['1.0.3','1.0.4','1.0.5'])for(const id of added)assert.ok(mobileSupportedGameIds({appVersion:v},ids).includes(id));
 for(const id of added)assert.ok(!mobileSupportedGameIds({appVersion:'1.0.2'},ids).includes(id));
 assert.deepEqual(mobileSupportedGameIds({appVersion:'1.0.5',supportedGameIds:['wuwa']},ids),['wuwa']);
});
