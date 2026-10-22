import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {calendarEvent,calendarEventId,calendarTemplateUrl,calendarUi,insertCalendarEvent,CalendarRequestError}=await import('../lib/google-calendar.ts');
const {default:GoogleCalendar}=await import('../components/google-calendar.tsx');
const {games}=await import('../lib/games.ts');
const game=games.find(g=>g.id==='wuwa');
const text={ko:'테스트 픽업',en:'Test banner',ja:'テストガチャ',zh:'测试卡池'};
const entry={id:'rotation-one',gameId:'wuwa',kind:'pickup',region:'global',title:text,summary:text,sourceKind:'official',sourceUrl:'https://publisher.example/notice',startAt:'2026-10-22T10:00:00+09:00',endAt:'2026-11-11T11:59:59+09:00'};
test('preserves exact instants and localized names without creating reminders',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const event=calendarEvent(entry,game,locale);
  assert.equal(event.start.dateTime,entry.startAt);assert.equal(event.end.dateTime,entry.endAt);
  assert.ok(event.summary.includes(text[locale]));assert.ok(event.description.includes(entry.sourceUrl));
  assert.deepEqual(event.reminders,{useDefault:false,overrides:[]});assert.equal(event.transparency,'transparent');
  const url=new URL(calendarTemplateUrl(event));assert.equal(url.origin,'https://calendar.google.com');
  assert.equal(url.searchParams.get('dates'),'20261022T010000Z/20261111T025959Z');
 }
});
test('date-only intervals include the final day without manufacturing a clock',()=>{
 const event=calendarEvent({...entry,startAt:null,endAt:null,pickupArchive:{status:'announced',startDate:'2028-02-28',endDate:'2028-02-29'}},game,'ko');
 assert.deepEqual(event.start,{date:'2028-02-28'});assert.deepEqual(event.end,{date:'2028-03-01'});
 assert.equal(new URL(calendarTemplateUrl(event)).searchParams.get('dates'),'20280228/20280301');
 const same=calendarEvent({...entry,startAt:null,endAt:null,startDate:'2026-12-31',endDate:'2026-12-31'},game,'en');
 assert.deepEqual(same.end,{date:'2027-01-01'});
});
test('rejects forecast, community, broadcast, incomplete, reversed, invalid and offsetless schedules',()=>{
 for(const overrides of [{sourceKind:'community'},{pickupArchive:{status:'forecast'}},{broadcast:{status:'scheduled'}},{hidden:true},{endAt:null},{startAt:null},{endAt:entry.startAt},{endAt:'2026-10-21T10:00:00Z'},{startAt:'2026-10-22T10:00:00'},{startAt:null,endAt:null,startDate:'2026-02-30',endDate:'2026-03-03'},{startAt:null,endAt:null,startDate:'2026-11-01',endDate:'2026-10-31'}])assert.equal(calendarEvent({...entry,...overrides},game,'ko'),null);
});
test('stable provider-compatible IDs survive translated titles or changed dates and separate services',async()=>{
 const id=await calendarEventId(entry);assert.match(id,/^[0-9a-v]{5,1024}$/);
 assert.equal(id,await calendarEventId({...entry,title:{...text,en:'Changed'},endAt:'2026-11-12T00:00:00Z'}));
 assert.notEqual(id,await calendarEventId({...entry,region:'jp'}));
});
test('only an explicit insert writes to primary; conflicts read the exact event without overwriting',async()=>{
 const event=calendarEvent(entry,game,'ko'),id=await calendarEventId(entry),calls=[];
 const request=async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify({id,htmlLink:'https://calendar.google.com/calendar/event?eid=test'}),{status:200});};
 const result=await insertCalendarEvent('test-only-token',id,event,request);
 assert.equal(result.duplicate,false);assert.equal(calls.length,1);assert.equal(calls[0].init.method,'POST');
 assert.equal(calls[0].url,'https://www.googleapis.com/calendar/v3/calendars/primary/events');
 assert.equal(JSON.parse(calls[0].init.body).id,id);
 const duplicateCalls=[];
 const duplicate=await insertCalendarEvent('test-only-token',id,event,async(url,init)=>{duplicateCalls.push({url,init});return duplicateCalls.length===1?new Response('{}',{status:409}):new Response(JSON.stringify({id,htmlLink:'https://calendar.google.com/calendar/event?eid=old'}));});
 assert.equal(duplicate.duplicate,true);assert.equal(duplicateCalls.length,2);assert.ok(duplicateCalls[1].url.endsWith('/'+id));assert.equal(duplicateCalls[1].init.method,undefined);
});
test('permission errors, uncertain writes, deleted records and invalid success payloads are not success',async()=>{
 const id=await calendarEventId(entry),event=calendarEvent(entry,game,'ko');
 for(const status of [401,403,429,500])await assert.rejects(insertCalendarEvent('test',id,event,async()=>new Response('{}',{status})),error=>error instanceof CalendarRequestError&&error.status===status);
 await assert.rejects(insertCalendarEvent('test',id,event,async()=>{throw Error('Network lost');}));
 await assert.rejects(insertCalendarEvent('test',id,event,async()=>new Response('{}')));
 let n=0;await assert.rejects(insertCalendarEvent('test',id,event,async()=>++n===1?new Response('{}',{status:409}):new Response(JSON.stringify({id,status:'cancelled'}))));
});
test('rendering never authorizes or writes, and labels exist in all four languages',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const html=renderToStaticMarkup(createElement(GoogleCalendar,{entry,game,locale}));
  assert.ok(html.includes(calendarUi[locale].title));assert.ok(html.includes('aria-expanded="false"'));assert.ok(!html.includes('<script'));
 }
});
