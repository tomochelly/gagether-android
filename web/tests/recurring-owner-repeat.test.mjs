import './load-typescript.mjs';
import {test}from'node:test';import assert from'node:assert/strict';
const {recurringItems,recurringReset}=await import('../lib/recurring-events.ts'),{recurringWindow,recurringDisplayEntry}=await import('../lib/recurring-schedule.ts'),{validateEditedEntry}=await import('../lib/editor-schema.ts'),{retainEntityDetails}=await import('../lib/presentation.ts');
const C=s=>({ko:s,en:s,ja:s,zh:s}),now=Date.parse('2026-10-26T01:00:00Z'),at='2026-10-25T23:11:45Z';
const base={id:'wuwa-recurring-whimpering-wastes',gameId:'wuwa',region:'global',kind:'event',server:'UTC+8',title:C('Whimpering Wastes'),summary:C('Mode guide'),startAt:'2026-10-26T05:00:00+09:00',endAt:'2026-11-23T05:00:00+09:00',publishedAt:null,verifiedAt:at,sourceUrl:'https://wuther.in/ko/activity/100390001/',sourceTitle:'Reference',sourceKind:'community',editor:{revision:5,updatedAt:at,fields:['startAt','endAt','startDate','endDate']},recurring:{modeId:'whimpering-wastes',cycleLabel:C('Four weeks'),sourceKind:'community',sourceUrls:['https://wuther.in/ko/activity/100390001/'],verifiedAt:at,resetAt:'2026-10-26T05:00:00+09:00',resetEvidence:{kind:'owner-confirmed',timeZone:'Asia/Seoul',note:C('Owner confirmed previous occurrence'),verifiedAt:at}}};
const repeat={kind:'owner-defined',enabled:true,intervalDays:28,anchorAt:base.endAt,timeZone:'Asia/Seoul',confirmedAt:at};
test('actual owner-edited WuWa period stays visible despite the stale separate reset, and follows its confirmed 28-day rule',()=>{
 const before=JSON.stringify(base);assert.equal(recurringItems([base],'ko',now)[0].id,base.id);assert.equal(Date.parse(recurringReset(base,now).at),Date.parse(base.endAt));
 const boundary=Date.parse(base.endAt),next=recurringReset(base,boundary);assert.equal(Date.parse(next.at),boundary+28*86400000);assert.equal(recurringItems([base],'ko',boundary).length,1);assert.equal(JSON.stringify(base),before);
 const late=boundary+280*86400000+1000;assert.equal(Date.parse(recurringReset(base,late).at),boundary+308*86400000);
 const other={...base,id:'unconfigured',editor:undefined};assert.equal(recurringItems([other],'ko',now).length,0);
});
test('owner-defined source-free schedules validate; ordinary source-free entries and malformed rules do not',()=>{
 const e={...base,id:'custom-owner-repeat',sourceUrl:'',sourceTitle:'',recurring:{...base.recurring,sourceKind:'owner',sourceUrls:[],repeat}};
 assert.equal(validateEditedEntry(e).ok,true);assert.equal(validateEditedEntry({...e,recurring:undefined}).ok,false);
 for(const change of [{intervalDays:0},{intervalDays:367},{anchorDate:'2026-11-23'},{timeZone:'invalid-zone'},{anchorAt:undefined}])assert.equal(validateEditedEntry({...e,recurring:{...e.recurring,repeat:{...repeat,...change}}}).ok,false);
 assert.equal(validateEditedEntry({...e,recurring:{...e.recurring,repeat:{...repeat,enabled:false}}}).ok,true);
});
test('date-only cycles stay dates through year/leap boundaries and a paused repeat stops rolling',()=>{
 const e={...base,id:'date-only',startAt:null,endAt:null,recurring:{...base.recurring,resetAt:null,resetDate:'2028-02-01',repeat:{...repeat,anchorAt:undefined,anchorDate:'2028-02-01'}}};
 const w=recurringWindow(e,Date.parse('2028-02-02T00:00:00+09:00'));assert.equal(w.endDate,'2028-02-29');assert.equal(w.endAt,null);assert.equal(recurringReset(e,Date.parse('2028-02-02T00:00:00+09:00')).at,undefined);
 const paused={...base,recurring:{...base.recurring,repeat:{...repeat,enabled:false}}};assert.equal(recurringWindow(paused,now),undefined);assert.equal(recurringItems([paused],'ko',Date.parse(base.endAt)+1).length,0);
 const projected=recurringDisplayEntry({...base,recurring:{...base.recurring,repeat}},Date.parse(base.endAt));assert.equal(projected.id,base.id);assert.equal(projected.recurring.repeat.anchorAt,base.endAt);assert.notEqual(projected.endAt,base.endAt);
});
test('automatic recurring metadata omissions preserve the explicit owner repeat rule without changing the original',()=>{
 const previous={...base,recurring:{...base.recurring,repeat}},before=JSON.stringify(previous),result=retainEntityDetails({...base,recurring:{...base.recurring,cycleLabel:C('New source description')}},previous);assert.deepEqual(result.recurring.repeat,repeat);assert.equal(result.recurring.cycleLabel.ko,'New source description');assert.equal(JSON.stringify(previous),before);
});
test('mounted recurring editor edits the same reset and end, preserves other language labels, and previews source-free 28-day repetition',async()=>{
 const React=await import('react'),{createRoot}=await import('react-dom/client'),{JSDOM}=await import('jsdom'),{default:Editor}=await import('../components/recurring-editor.tsx');const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki'});const old={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});let draft={...base,id:'custom-editor',sourceUrl:'',recurring:{...base.recurring,sourceKind:'owner',sourceUrls:[],repeat}};
 const root=createRoot(document.getElementById('root'));const render=()=>root.render(React.createElement(Editor,{entry:draft,locale:'ko',lang:'ko',onChange:p=>{draft={...draft,...p};render();}}));try{
  await React.act(async()=>render());const reset=document.querySelector('input[type="datetime-local"]');await React.act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(reset,'2026-12-21T05:00');reset.dispatchEvent(new dom.window.Event('input',{bubbles:true}));reset.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  // Direct adapter also covers React's native date-input event differences.
  const {editRecurringEnd}=await import('../components/recurring-editor.tsx');const p=editRecurringEnd(draft,'2026-12-21T05:00');assert.equal(p.endAt,'2026-12-21T05:00:00+09:00');assert.equal(p.recurring.resetAt,p.endAt);assert.equal(p.recurring.repeat.anchorAt,p.endAt);assert.equal(p.recurring.cycleLabel.en,base.recurring.cycleLabel.en);assert.match(document.body.textContent,/출처 링크 없이|다음 초기화/);
 }finally{await React.act(async()=>root.unmount());Object.assign(globalThis,old);dom.window.close();}
});
