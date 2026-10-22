import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {mobileFeed,mobileDefaults}=await import('../lib/mobile.ts');
const {notificationCharacters}=await import('../lib/notification-voices.ts');
const {reminderRules,cleanOffsets}=await import('../lib/notification-settings.ts');
const {notificationText,offsetLabel}=await import('../lib/notification-i18n.ts');
const name={ko:'치사',en:'Chisa',ja:'千咲',zh:'千咲'};
const entry={id:'test-chisa',gameId:'wuwa',kind:'pickup',poolType:'character',region:'global',title:name,summary:name,startAt:null,endAt:'2026-10-22T10:59:00+09:00',verifiedAt:'2026-10-16T23:00:00Z',pickupGroup:'test-phase',pickupMembers:[{name,type:'rerun'}]};
test('native feed preserves exact times and groups while excluding forecasts and date-only entries',()=>{
 const feed=mobileFeed([entry,{...entry,id:'unknown',endAt:null,startDate:'2026-10-22'},{...entry,id:'forecast',pickupArchive:{status:'forecast'}},{...entry,id:'hidden',hidden:true}],{},'ko');
 assert.equal(feed.entries.length,1);assert.equal(feed.entries[0].startAt,null);assert.equal(feed.entries[0].endAt,entry.endAt);assert.equal(feed.entries[0].notificationGroup,'test-phase');assert.equal(feed.entries[0].notificationCharacters[0].voice.locale,'ko');
});
test('character style matches the precise entity and language; candidates, rate-ups and support cards never speak',()=>{
 assert.equal(notificationCharacters(entry,'ko')[0].voice.original,false);assert.equal(notificationCharacters(entry,'ja')[0].voice,undefined);
 assert.equal(notificationCharacters({...entry,poolType:'support'},'ko').length,0);
 assert.equal(notificationCharacters({...entry,selectionCount:2},'ko').length,0);
 assert.equal(notificationCharacters({...entry,pickupMembers:[{name,role:'rate-up'},{name,role:'candidate'}]},'ko').length,0);
 assert.equal(notificationCharacters({...entry,pickupMembers:[{name:{...name,en:'Chisa (another outfit)'}}]},'ko')[0].voice,undefined);
});
test('legacy rules preserve previous choices, explicit empty selections and new-install defaults',()=>{
 const old=reminderRules(undefined,{starts:false,offsets:[1440,60]});assert.equal(old.pickup.starts,false);assert.deepEqual(old.event.endOffsets,[1440,60]);
 const edited=reminderRules({pickup:{starts:true,ends:true,startOffsets:[],endOffsets:[2880,90,0]}},{starts:true,offsets:[60]});assert.deepEqual(edited.pickup.startOffsets,[]);assert.deepEqual(edited.pickup.endOffsets,[2880,90,0]);
 assert.deepEqual(cleanOffsets([0,60,60,10081,-1,1.5,'1440',null]),[60,0]);assert.equal(cleanOffsets(Array.from({length:12},(_,i)=>i)).length,8);
 assert.equal(mobileDefaults().followMyGames,true);assert.equal(mobileDefaults().characterTone,false);assert.ok(mobileDefaults().notificationRules.event.endOffsets.includes(0));
});
test('notification controls have all four locales and accurately label sub-hour custom offsets',()=>{
 const keys=Object.keys(notificationText.ko).sort();for(const locale of ['en','ja','zh']){assert.deepEqual(Object.keys(notificationText[locale]).sort(),keys);assert.ok(Object.values(notificationText[locale]).every(s=>!/[가-힣]/.test(s)));}
 assert.match(offsetLabel(30,'ko'),/30분/);assert.match(offsetLabel(90,'en'),/90 minutes/);assert.equal(offsetLabel(0,'ja'),notificationText.ja.at);
});
