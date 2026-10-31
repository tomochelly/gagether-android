import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const {searchScore,searchFeatures}=await import('../lib/site-search.ts');
const {default:Shortcuts}=await import('../components/feature-shortcuts.tsx');
const {default:Radar}=await import('../components/radar.tsx');
const {games}=await import('../lib/games.ts');
const {emptyCatalog}=await import('../lib/initial-shell.ts');
const {nteDiscovery}=await import('../lib/convene-discovery.ts');
test('search matches localized names and spaced aliases, ranks exact titles, and keeps combat links canonical',()=>{
 assert.ok(searchScore('아카네 린','아카네 린')>searchScore('아카네 린','아카네 린 신규 모집'));
 assert.ok(searchScore('ＮＴＥ','NTE Gacha Simulator'));
 assert.ok(searchFeatures('ko','이환 가챠').some(r=>r.href==='/ko/games/nte/convene'));
 assert.ok(searchFeatures('ko','종말 매트릭스')[0].href.endsWith('/combat/endstate-matrix'));
 assert.equal(searchFeatures('ko','이환 가챠','nikke').length,0);
 assert.equal(searchScore('','Anything'),0);
});
test('all four home languages contain usable simulator anchors before opening a menu',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Shortcuts,{locale,games})));
  assert.ok(dom.window.document.querySelector(`a[href="/${locale}/games/nte/convene"]`));
  assert.ok(dom.window.document.querySelector('#feature-simulator-options[hidden]'));
  assert.ok(nteDiscovery[locale].description.length>40);
  dom.window.close();
 }
});
test('eight public update records use readable compact rows, preserve details and bookmark controls, and escape source text',()=>{
 const text=v=>({ko:v,en:v,ja:v,zh:v}),entries=Array.from({length:8},(_,i)=>({id:'qa-update-'+i,gameId:'wuwa',region:'global',server:'Global',kind:'update',title:text(i===0?'<script>alert(1)</script>':'Version update '+i),summary:text('Update summary'),sourceTitle:'Notice',sourceUrl:'https://wutheringwaves.kurogames.com/',publishedAt:'2026-10-30T00:00:00Z',startAt:null,endAt:null,verifiedAt:'2026-10-30T00:00:00Z'}));
 const html=renderToStaticMarkup(React.createElement(Radar,{initialLocale:'en',initialLocaleManual:true,initialView:'game',initialGameId:'wuwa',initialRegion:'global',initialData:{...emptyCatalog(),entries,persistent:true,serverTime:'2026-10-31T00:00:00Z'},initialComplete:true})),dom=new JSDOM(html),rows=dom.window.document.querySelectorAll('.compact-entry-row');
 assert.equal(rows.length,8);assert.equal(dom.window.document.querySelectorAll('.compact-entry-row a[href*="/items/qa-update-"]').length,8);assert.equal(dom.window.document.querySelectorAll('.compact-entry-save[aria-pressed="false"]').length,8);assert.ok(html.includes('&lt;script&gt;'));assert.equal(dom.window.document.querySelectorAll('script').length,0);dom.window.close();
});
