import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {linkedWeaponOnly}=await import('../lib/linked-weapon-presentation.ts');
const {calendarMarks}=await import('../lib/schedule.ts');
const {calendarPreferences,defaultCalendarPreferences,calendarIncludesKind}=await import('../lib/calendar-preferences.ts');
const {timelineGroups}=await import('../lib/schedule-timeline.ts');
const {signatureWeapons}=await import('../lib/weapon-links.ts');
const entries=JSON.parse(readFileSync(new URL('./fixtures/weapon-links.json',import.meta.url)));
test('weapon schedules disappear while the exact original remains available through character links',()=>{
 const character=entries.find(e=>e.id==='wuwa-hsin'),weapon=entries.find(e=>e.id==='wuwa-blooming-jadehaven'),before=JSON.stringify(entries),p=defaultCalendarPreferences();
 assert.equal(linkedWeaponOnly(weapon),true);assert.equal(calendarIncludesKind(p,weapon),false);
 const timed=[character,weapon].map(e=>({...e,startAt:null,endAt:null,startDate:'2026-11-01',endDate:'2026-11-20'}));
 const marks=[...calendarMarks(timed).values()].flat();assert.ok(marks.some(m=>m.entry.id===character.id));assert.equal(marks.some(m=>m.entry.id===weapon.id),false);
 const now=Date.parse('2026-10-30T00:00:00Z');
 assert.equal(timelineGroups(timed,p,[],'wuwa',now,'Asia/Seoul',60).flatMap(g=>g.marks).some(m=>m.entry.id===weapon.id),false);
 assert.equal(signatureWeapons(character,entries)[0].entry.id,weapon.id);assert.equal(JSON.stringify(entries),before);
});
test('support recruitment remains distinct from a weapon even when its stored category is weapon',()=>{
 const support=entries.find(e=>e.poolType==='support'),p=defaultCalendarPreferences();assert.ok(support);assert.equal(linkedWeaponOnly(support),false);assert.equal(calendarIncludesKind(p,support),true);assert.equal(calendarIncludesKind({...p,pools:['character']},support),false);assert.equal(calendarIncludesKind({...p,pools:['support']},support),true);
});
test('legacy weapon-only choices migrate to linked character schedules without losing selected games or private tabs',()=>{
 const p=calendarPreferences({version:1,kinds:['weapon'],pools:['character','support'],games:'selected',gameIds:['wuwa'],mode:'notes',fullMonth:true});assert.deepEqual(p.kinds,['pickup']);assert.deepEqual(p.gameIds,['wuwa']);assert.equal(p.mode,'notes');assert.equal(p.fullMonth,true);assert.deepEqual(calendarPreferences({version:1,kinds:[]}).kinds,[]);
});
