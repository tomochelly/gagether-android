import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {recurringItems,recurringReset}=await import('../lib/recurring-events.ts');
const {entrySchema,safeExtras}=await import('../lib/content-schema.ts');
const {retainEntityDetails}=await import('../lib/presentation.ts');
const {catalogEntry}=await import('../lib/catalog-index.ts');
const {ResetClock}=await import('../components/recurring-overview.tsx');
const {default:RecurringOverview}=await import('../components/recurring-overview.tsx');
const {games}=await import('../lib/games.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const now=Date.parse('2026-10-21T12:00:00Z'),text={ko:'반복 도전',en:'Recurring challenge',ja:'周期挑戦',zh:'周期挑战'},url='https://wutheringwaves.kurogames.com/kr/main/news/detail/5572';
const base={id:'current',gameId:'wuwa',region:'global',kind:'event',server:'UTC+8',title:text,summary:text,startAt:null,endAt:null,publishedAt:null,verifiedAt:'2026-10-21T11:00:00Z',sourceUrl:url,sourceTitle:'Review',recurring:{modeId:'tower',cycleLabel:text,sourceKind:'official',sourceUrls:[url],verifiedAt:'2026-10-21T11:00:00Z'}};
test('one current occurrence per actual service, ended removed and next takes over',()=>{
 const current={...base,startAt:'2026-10-01T00:00:00Z',endAt:'2026-10-22T00:00:00Z'},next={...base,id:'next',startAt:current.endAt,endAt:'2026-11-01T00:00:00Z'},foreign={...current,id:'jp',region:'jp'};
 assert.deepEqual(recurringItems([next,current,foreign], 'ko',now).map(e=>e.id).sort(),['current','jp']);
 assert.deepEqual(recurringItems([current,next], 'ko',Date.parse(current.endAt)).map(e=>e.id),['next']);
 assert.deepEqual(recurringItems([{...base,hidden:true},{...base,id:'ordinary',recurring:undefined}], 'ko',now),[]);
});
test('past reset never rolls forward and community dates never become a countdown',()=>{
 const past={...base,recurring:{...base.recurring,resetAt:'2026-10-20T00:00:00Z'}};assert.equal(recurringReset(past,now),null);
 const estimated={...base,recurring:{...base.recurring,sourceKind:'community',resetAt:'2026-10-26T00:00:00Z'}};assert.equal(recurringReset(estimated,now),null);assert.equal(safeExtras(estimated),false);
 const dated={...base,recurring:{...base.recurring,resetDate:'2026-10-26'}};
 const html=renderToStaticMarkup(React.createElement(ResetClock,{entry:dated,locale:'ko',now}));assert.match(html,/2026-10-26/);assert.doesNotMatch(html,/시각 미확인|날짜 기준/);assert.doesNotMatch(html,/00:00|초기화까지/);
});
test('metadata survives transport and routine omissions; invalid source/kind rejected',()=>{
 assert.deepEqual(entrySchema.parse(base).recurring,base.recurring);assert.deepEqual(catalogEntry(base).recurring,base.recurring);
 assert.deepEqual(retainEntityDetails({...base,recurring:undefined},base).recurring,base.recurring);
 assert.equal(safeExtras({...base,kind:'pickup'}),false);assert.equal(safeExtras({...base,recurring:{...base.recurring,sourceUrls:['https://example.org']}}),false);
});
test('every game and language obeys selected-game and canonical-service boundaries',()=>{
 const entries=games.map(g=>({...base,id:g.id,gameId:g.id,region:effectiveRegion(g,'kr')}));
 for(const locale of ['ko','en','ja','zh'])for(const game of games){
  const html=renderToStaticMarkup(React.createElement(RecurringOverview,{entries:[...entries,{...base,id:'foreign',gameId:'arknights',region:'cn'}],locale,now,region:'kr',gameId:game.id,onOpen:()=>{}}));
  assert.match(html,new RegExp('data-entry-id="'+game.id+'"'));
  assert.equal((html.match(/data-entry-id=/g)||[]).length,1);
  assert.doesNotMatch(html,/data-entry-id="foreign"/);
 }
});
test('known next season replaces an undated mode definition, and tied modes follow library order',()=>{
 const next={...base,id:'next',startDate:'2026-10-25',endDate:'2026-11-08'};
 assert.deepEqual(recurringItems([base,next],'ko',now).map(e=>e.id),['next']);
 const other={...base,id:'other',gameId:'hsr'};
 assert.deepEqual(recurringItems([base,other],'ko',now,['hsr','wuwa']).map(e=>e.id),['other','current']);
});
test('owner-confirmed game reset retains provenance, ticks seconds, and expires without rollover',()=>{
 const evidence={kind:'owner-confirmed',timeZone:'Asia/Seoul',note:text,verifiedAt:'2026-10-21T11:00:00Z'};
 const e={...base,sourceKind:'community',sourceUrl:'https://www.inven.co.kr/board/party/6196/1091',recurring:{...base.recurring,sourceKind:'community',sourceUrls:['https://www.inven.co.kr/board/party/6196/1091'],resetAt:'2026-10-26T05:00:00+09:00',resetEvidence:evidence}};
 assert.equal(safeExtras(entrySchema.parse(e)),true);
 assert.equal(entrySchema.parse(e).sourceKind,'community');
 assert.equal(catalogEntry(e).recurring.resetEvidence.kind,'owner-confirmed');
 const before=Date.parse('2026-10-22T00:43:22+09:00');
 const render=t=>renderToStaticMarkup(React.createElement(ResetClock,{entry:e,locale:'ko',now:t}));
 assert.match(render(before),/4일 04시간 16분 38초/);
 assert.match(render(before+1000),/4일 04시간 16분 37초/);
 assert.equal(recurringItems([e],'ko',Date.parse(e.recurring.resetAt)).length,0);
 assert.equal(recurringReset(e,Date.parse(e.recurring.resetAt)),null);
 assert.equal(safeExtras({...e,recurring:{...e.recurring,resetEvidence:{...evidence,timeZone:'invalid-zone'}}}),false);
});
