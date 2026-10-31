import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {countdownIsUrgent,DAY}=await import('../lib/schedule.ts');
const {default:Countdown}=await import('../components/countdown.tsx');
const {EventClock}=await import('../components/event-overview.tsx');
const {ResetClock}=await import('../components/recurring-overview.tsx');
const now=Date.parse('2026-10-31T06:00:00Z'),at=ms=>new Date(now+ms).toISOString();
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,{locale:'ko',now,...props}));
const entry={id:'qa',gameId:'wuwa',region:'global',kind:'event',title:{ko:'테스트',en:'Test',ja:'テスト',zh:'测试'},summary:{ko:'',en:'',ja:'',zh:''}};
test('bold countdown is strictly inside the next 24 hours; dates and ended values never qualify',()=>{
 for(const delta of [1,1000,DAY-1])assert.equal(countdownIsUrgent(at(delta),now),true);
 for(const delta of [-DAY,-1,0,DAY,DAY+1,4*DAY])assert.equal(countdownIsUrgent(at(delta),now),false);
 for(const value of [undefined,'invalid','2026-10-31','2026-11-01'])assert.equal(countdownIsUrgent(value,now),false);
});
test('event clocks emphasize the displayed boundary, including upcoming starts',()=>{
 assert.match(render(EventClock,{entry:{...entry,startAt:at(DAY-1),endAt:at(5*DAY)}}),/data-urgent="true"/);
 assert.match(render(EventClock,{entry:{...entry,startAt:at(-DAY),endAt:at(DAY)}}),/data-urgent="false"/);
 assert.match(render(EventClock,{entry:{...entry,startAt:at(-DAY),endAt:at(DAY-1)}}),/data-urgent="true"/);
 assert.doesNotMatch(render(EventClock,{entry:{...entry,endAt:at(-1)}}),/countdown-value|<b>/);
 const dated=render(EventClock,{entry:{...entry,startDate:'2026-10-01',endDate:'2026-11-04'}});
 assert.match(dated,/<time dateTime="2026-11-04">/);assert.doesNotMatch(dated,/<b>|4 일/);
});
test('confirmed recurring resets use the same exact threshold',()=>{
 for(const delta of [DAY-1,DAY,5*DAY])assert.match(render(ResetClock,{entry:{...entry,recurring:{modeId:'qa',sourceKind:'official',resetAt:at(delta)}}}),new RegExp('data-urgent="'+(delta<DAY)+'"'));
});
test('all locales retain complete accessible time and atomic number-unit groups in compact cards',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const html=render(Countdown,{at:at(4*DAY+3661000),locale,compact:true});
  assert.match(html,/data-urgent="false"/);assert.equal((html.match(/<span>/g)||[]).length,2);assert.match(html,/aria-label="[^"]+"/);assert.doesNotMatch(html,/<b>/);
 }
});

test('date-only and exact news dates use the same locale punctuation without shifting date-only days',async()=>{
 const {dashboardDateLabel}=await import('../lib/dashboard-groups.ts');
 for(const locale of ['ko','en','ja','zh']){
  assert.equal(dashboardDateLabel('2026-11-12',locale,'Asia/Seoul'),dashboardDateLabel('2026-11-12T03:00:00Z',locale,'Asia/Seoul'));
  assert.equal(dashboardDateLabel('2026-11-12',locale,'Pacific/Kiritimati'),dashboardDateLabel('2026-11-12',locale,'America/Los_Angeles'));
 }
});
