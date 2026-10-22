import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {displayZone,dateInZone}=await import('../lib/display-time.ts');
const {calendarMarks,activeOnDay,remainingTime}=await import('../lib/schedule.ts');
test('locale display zones do not assume all English readers are in America',()=>{
 assert.equal(displayZone('ko'),'Asia/Seoul');assert.equal(displayZone('ja'),'Asia/Tokyo');assert.equal(displayZone('zh'),'Asia/Shanghai');
 assert.equal(displayZone('en','America/Los_Angeles'),'America/Los_Angeles');assert.equal(displayZone('en','Europe/London'),'Europe/London');assert.equal(displayZone('en','bad zone'),'UTC');
});
test('calendar dates convert exact instants but retain date-only evidence',()=>{
 const e={id:'test',startAt:'2026-10-22T00:30:00Z',endAt:null};
 assert.ok(calendarMarks([e],'America/Los_Angeles').has('2026-10-21'));
 assert.ok(calendarMarks([e],'Asia/Shanghai').has('2026-10-22'));
 assert.ok(calendarMarks([{...e,startAt:null,startDate:'2026-10-22'}],'America/Los_Angeles').has('2026-10-22'));
 assert.equal(e.startAt,'2026-10-22T00:30:00Z');
});
test('DST day boundaries and exclusive midnight endings remain correct',()=>{
 assert.equal(dateInZone('2026-11-01T08:30:00Z','America/Los_Angeles'),'2026-11-01');
 assert.equal(dateInZone('2026-11-01T09:30:00Z','America/Los_Angeles'),'2026-11-01');
 const e={startAt:'2026-10-31T07:00:00Z',endAt:'2026-11-02T08:00:00Z'};
 assert.equal(activeOnDay(e,'2026-11-01','2026-10-31','America/Los_Angeles'),true);
 assert.equal(activeOnDay(e,'2026-11-02','2026-10-31','America/Los_Angeles'),false);
});
test('all countdown locales include hours minutes seconds and clamp elapsed values',()=>{
 const now=Date.parse('2026-10-17T00:00:00Z');
 assert.equal(remainingTime('2026-10-18T01:02:03Z',now,'en'),'1d 01h 02m 03s');
 assert.equal(remainingTime('2026-10-17T00:00:05Z',now,'ko'),'00시간 00분 05초');
 assert.match(remainingTime('2026-10-17T00:00:05Z',now,'ja'),/05秒$/);
 assert.match(remainingTime('2026-10-17T00:00:05Z',now,'zh'),/05秒$/);
 assert.equal(remainingTime('2026-10-16T00:00:00Z',now,'en'),'00h 00m 00s');
});
