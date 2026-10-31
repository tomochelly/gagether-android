import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {JSDOM} from 'jsdom';
const {calendarPreferences,defaultCalendarPreferences,calendarIncludesKind,calendarPreferencesKey}=await import('../lib/calendar-preferences.ts');
const {timelineGroups}=await import('../lib/schedule-timeline.ts');
const {defaultLayoutOrder,sectionOrder}=await import('../lib/site-layout.ts');
const {publicScreenVariant}=await import('../lib/public-screen-cache.ts');
const words=s=>({ko:s,en:s,ja:s,zh:s}),now=Date.parse('2026-10-30T12:00:00Z');
const entry=(id,props={})=>({id,gameId:'wuwa',region:'kr',kind:'pickup',title:words(id),summary:words(''),sourceKind:'official',startDate:'2026-11-01',endDate:'2026-11-20',...props});
test('old saved calendar choices migrate without losing selections, tabs or month preference',()=>{
 const p=calendarPreferences({version:1,kinds:['pickup','event'],games:'selected',gameIds:['wuwa'],mode:'notes',fullMonth:true});assert.deepEqual(p.pools,['character','support']);assert.deepEqual(p.gameIds,['wuwa']);assert.equal(p.mode,'notes');assert.equal(p.fullMonth,true);
 const selected=calendarPreferences({...p,pools:['support']});assert.equal(calendarIncludesKind(selected,entry('char')),false);assert.equal(calendarIncludesKind(selected,entry('support',{poolType:'support'})),true);assert.equal(calendarIncludesKind(selected,entry('event',{kind:'event'})),true);
});
test('timeline respects kind, service-scoped game, date-only values and exact timezone dates',()=>{
 const p=defaultCalendarPreferences(),items=[entry('date'),entry('clock',{startDate:undefined,startAt:'2026-11-01T01:00:00Z'}),entry('other',{gameId:'nikke'}),entry('forecast',{pickupArchive:{status:'forecast',startDate:'2026-11-01'}}),entry('hidden',{hidden:true}),entry('recurring',{recurring:{}}),entry('broadcast',{broadcast:{}})];
 const groups=timelineGroups(items,p,[],'wuwa',now,'America/Los_Angeles');assert.ok(groups.find(g=>g.date==='2026-10-31').marks.some(m=>m.entry.id==='clock'));assert.ok(groups.find(g=>g.date==='2026-11-01').marks.some(m=>m.entry.id==='date'&&m.dateOnly));assert.deepEqual(new Set(groups.flatMap(g=>g.marks.map(m=>m.entry.id))),new Set(['date','clock']));
 const favorites=timelineGroups(items,{...p,games:'favorites'},['nikke'],undefined,now,'Asia/Seoul');assert.deepEqual(new Set(favorites.flatMap(g=>g.marks.map(m=>m.entry.id))),new Set(['other']));
});
test('new default places aligned group after hero while existing owner order stays exact',()=>{
 assert.deepEqual(defaultLayoutOrder('game').slice(0,4),['version','resets','events','deadlines']);assert.deepEqual(defaultLayoutOrder('overview').slice(0,4),['pickup','resets','events','deadlines']);const custom=['calendar','version','pickup','resets','events','deadlines','content'];assert.deepEqual(sectionOrder(custom).slice(0,7),['calendar','version','pv','pickup','resets','events','deadlines']);
});
test('public desktop/mobile HTML uses only the correct independent density preference',()=>{
 const variant=(path,ua,cookie)=>publicScreenVariant(new Request('https://gagether.wiki'+path,{headers:{'user-agent':ua,cookie}}));
 const desktop=variant('/','Desktop','gagether.desktop-view=simple; gagether.mobile-view=full; secret=keep-private');assert.match(desktop.key,/:simple:wide:/);assert.equal(desktop.request.headers.get('cookie'),'gagether.mobile-view=full; gagether.desktop-view=simple');
 assert.match(variant('/','Android','gagether.desktop-view=simple; gagether.mobile-view=full').key,/:full:compact:/);assert.match(variant('/mobile','Desktop','gagether.desktop-view=full; gagether.mobile-view=simple').key,/:simple:wide:/);
});
test('calendar and timeline selectors synchronize immediately without losing active calendar day or other storage',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko',pretendToBeVisual:true}),old=new Map();const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});};for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','StorageEvent','localStorage','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 const {createRoot}=await import('react-dom/client'),{useCalendarPreferences}=await import('../components/use-calendar-preferences.ts'),{SchedulePresets,ScheduleTypeSelection}=await import('../components/schedule-selection.tsx');const root=createRoot(document.getElementById('root'));
 function Choice({id}){const display=useCalendarPreferences();return React.createElement('div',{'data-copy':id},React.createElement(SchedulePresets,{display,locale:'ko'}),React.createElement(ScheduleTypeSelection,{display,locale:'ko'}),React.createElement('output',null,JSON.stringify(display.value)));}
 localStorage.setItem('unrelated','preserve');sessionStorage.setItem('calendar-date','2026-12-15');
 try{await act(async()=>root.render(React.createElement(React.Fragment,null,React.createElement(Choice,{id:'timeline'}),React.createElement(Choice,{id:'calendar'}))));await act(async()=>document.querySelector('[data-copy=timeline] button:nth-child(2)').click());assert.equal(document.querySelector('[data-copy=calendar] button:nth-child(2)').getAttribute('aria-pressed'),'true');assert.deepEqual(JSON.parse(localStorage.getItem(calendarPreferencesKey())).kinds,['pickup']);await act(async()=>document.querySelector('[data-copy=calendar] button:nth-child(3)').click());assert.equal(document.querySelector('[data-copy=timeline] button:nth-child(3)').getAttribute('aria-pressed'),'true');await act(async()=>document.querySelector('[data-copy=timeline] input').click());assert.deepEqual(JSON.parse(localStorage.getItem(calendarPreferencesKey())).pools,['character']);assert.equal(localStorage.getItem('unrelated'),'preserve');assert.equal(sessionStorage.getItem('calendar-date'),'2026-12-15');}
 finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
