import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {default:DetailCopy}=await import('../components/detail-copy.tsx');
const {default:DocumentReader}=await import('../components/document-reader.tsx');
const {default:Radar}=await import('../components/radar.tsx');
const {default:RecurringEditor}=await import('../components/recurring-editor.tsx');
const {emptyCatalog}=await import('../lib/initial-shell.ts');
const {displaySummary,displaySection}=await import('../lib/content-display.ts');
const blank={ko:'',en:'',ja:'',zh:''},copy=ko=>({...blank,ko}),time='2026-10-26T00:00:00Z';
const entry={id:'custom-copy-projection',gameId:'limbus',region:'global',kind:'event',server:'Global',title:copy('참여 이벤트'),summary:copy('운영자가 설정한 일정입니다.\n\n  보상 300개\n수령 조건: 레벨 30'),sourceTitle:'Event',sourceUrl:'https://store.steampowered.com/news/app/1973530',sourceLocale:'ko',sourceKind:'community',startAt:'2026-10-25T00:00:00Z',endAt:'2026-11-12T05:00:00+09:00',publishedAt:null,verifiedAt:time,editor:{revision:1,fields:['summary','detailSections'],updatedAt:time},highlights:[copy('커뮤니티 참고'),copy('1인당 10회')],contents:[copy('운영자 설정'),copy('유료 상품 3,900원 · 일일 1회')],detailSections:[{title:copy('없어질 빈 단락'),body:copy('운영자가 직접 입력한 초기화 일정')},{title:copy('운영자 설정'),body:copy('참여 조건: 계정 레벨 30')},{title:copy('수령 제한'),body:copy('수량은 미공개이며, 1인당 10회까지 참여할 수 있습니다.')}],contentBlocks:[{id:'noise',type:'text',title:copy('없어질 빈 블록'),body:copy('커뮤니티 참고')},{id:'facts',type:'text',title:copy('운영자 설정'),body:copy('가격: 3,900원\n\n  구매 한도: 1일 1회'),textStyle:{ko:{bodySize:18,lineHeight:1.9}}}]};

test('authored summary and sections remove fixed process filler while preserving facts and typography',()=>{
 const before=JSON.stringify(entry);assert.equal(displaySummary(entry,'ko'),'  보상 300개\n수령 조건: 레벨 30');
 assert.equal(displaySection('없어질 빈 단락','운영자가 직접 입력한 초기화 일정',true),false);
 assert.equal(displaySection('수령 제한','수량은 미공개이며, 1인당 10회까지 참여할 수 있습니다.',true),true);
 assert.equal(JSON.stringify(entry),before);
});

test('document and dashboard projections hide empty editorial wrappers and retain actual conditions, prices and highlights',()=>{
 const before=JSON.stringify(entry),doc=new JSDOM(renderToStaticMarkup(React.createElement(DocumentReader,{entry,locale:'ko'}))),body=doc.window.document;
 assert.equal(body.querySelectorAll('.content-details>.detail-section').length,2);assert.equal(body.querySelectorAll('.content-details h2').length,1);
 assert.equal(body.querySelectorAll('.owner-content-blocks .detail-section').length,1);assert.equal(body.querySelectorAll('.owner-content-blocks h4').length,0);
 assert.equal(body.querySelector('.owner-content-blocks .detail-copy').style.fontSize,'18px');assert.match(body.querySelector('.owner-content-blocks').textContent,/가격: 3,900원/);
 assert.match(body.querySelector('.content-details').textContent,/수량은 미공개.*1인당 10회/);assert.equal(body.querySelectorAll('.document-contents li').length,1);assert.match(body.querySelector('.document-contents').textContent,/3,900원.*일일 1회/);
 assert.doesNotMatch(body.querySelector('article').textContent,/운영자 설정|커뮤니티 참고|없어질 빈/);doc.window.close();
 const dashboard=new JSDOM(renderToStaticMarkup(React.createElement(Radar,{initialLocale:'ko',initialLocaleManual:true,initialGameId:'limbus',initialRegion:'global',initialView:'game',initialData:{...emptyCatalog(),entries:[{...entry,kind:'package'}],persistent:true,serverTime:time},initialComplete:true}))),card=dashboard.window.document.querySelector('.entry-card');
 assert.ok(card);assert.match(card.textContent,/1인당 10회/);assert.doesNotMatch(card.textContent,/운영자 설정|커뮤니티 참고|운영자가 설정/);dashboard.window.close();assert.equal(JSON.stringify(entry),before);
});

test('mounted literal editorial copy remains editable-looking while an explicit source original is rendered verbatim',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki'}),previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});const root=createRoot(document.getElementById('root'));
 try{
  const text='운영자가 직접 입력한 초기화 일정\n\n  보상: 300개\n미공개 수량은 추후 공지합니다.';
  await act(()=>root.render(React.createElement(DetailCopy,{text,locale:'ko',preserve:true,appearance:{bodySize:19,lineHeight:1.8,bodyFormat:{bold:true}}})));
  assert.doesNotMatch(document.body.textContent,/운영자가/);assert.match(document.body.textContent,/보상: 300개.*미공개 수량/);assert.equal(document.querySelector('.detail-copy').style.fontWeight,'700');assert.equal(document.querySelector('.detail-copy-line').textContent,'  보상: 300개');
  await act(()=>root.render(React.createElement(DetailCopy,{text,locale:'ko',preserve:true,sourceOriginal:true})));assert.match(document.body.textContent,/운영자가 직접 입력한 초기화 일정/);
 }finally{await act(()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);}
 const original={locale:'ko',sourceUrl:entry.sourceUrl,sourceKind:'official',bodyHash:'a'.repeat(64),importedAt:time,images:[],text:'운영자가 직접 입력한 초기화 일정\n공식 원문 보상: 500개'};
 const html=new JSDOM(renderToStaticMarkup(React.createElement(DocumentReader,{entry:{...entry,sourceBodies:{ko:original}},locale:'ko'})));assert.match(html.window.document.querySelector('.source-article-body').textContent,/운영자가 직접 입력한 초기화 일정/);assert.match(html.window.document.querySelector('.source-article-body').textContent,/500개/);html.window.close();
});

test('new recurring entries start without a public owner-defined label and retain the exact reset/source behavior',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki'}),previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});const root=createRoot(document.getElementById('root'));let changes;
 try{await act(()=>root.render(React.createElement(RecurringEditor,{entry,locale:'ko',lang:'ko',onChange:value=>{changes=value}})));await act(()=>document.querySelector('input[type=checkbox]').click());assert.deepEqual(changes.recurring.cycleLabel,blank);assert.equal(changes.recurring.sourceKind,'owner');assert.equal(changes.recurring.resetAt,entry.endAt);assert.deepEqual(changes.recurring.sourceUrls,[entry.sourceUrl]);assert.equal(changes.recurring.repeat,undefined);
 }finally{await act(()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);}
});
