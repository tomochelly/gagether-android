import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createElement,act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
const {default:DisplaySettings}=await import('../components/display-settings.tsx');
const {displayBootstrap,DISPLAY_PREFERENCES_KEY,parseDisplayPreferences}=await import('../lib/display-preferences.ts');
const {monthCells}=await import('../lib/schedule.ts');
const {weekDates}=await import('../lib/personal-notes.ts');
const {calendarNames}=await import('../lib/calendar-labels.ts');
const {games}=await import('../lib/games.ts');

test('Sunday-first month and week agree across leap days and year boundaries',()=>{
 for(const month of ['2026-10','2026-11','2027-01','2028-02']){
  const cells=monthCells(month);assert.equal(new Date(cells[0]+'T12:00:00Z').getUTCDay(),0);assert.equal(cells.length%7,0);
  for(let i=0;i<cells.length;i+=7)assert.deepEqual(weekDates(cells[i+3]),cells.slice(i,i+7));
  const days=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate();assert.equal(cells.filter(d=>d.startsWith(month)).length,days);
 }
 assert.equal(monthCells('2026-11')[0],'2026-11-01');
 for(const game of games)for(const locale of ['ko','en','ja','zh'])assert.ok(calendarNames[game.id][locale]);
});
test('display preferences persist through a remount without altering personal records',async()=>{
 const dom=new JSDOM('<meta name="theme-color" content="#101711"><div id="root"></div>',{url:'https://gagether.wiki/',runScripts:'outside-only'});
 const previous={window:globalThis.window,document:globalThis.document,localStorage:globalThis.localStorage,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 localStorage.setItem('gagether.personal-notes.v1','keep-notes');localStorage.setItem('patchwork.preferences','keep-favorites');
 localStorage.setItem(DISPLAY_PREFERENCES_KEY,JSON.stringify({theme:'light',textScale:130}));dom.window.eval(displayBootstrap);
 assert.equal(document.documentElement.dataset.theme,'light');assert.equal(document.documentElement.style.getPropertyValue('--text-scale'),'1.3');
 let root=createRoot(document.getElementById('root'));
 try{
  await act(()=>root.render(createElement(DisplaySettings,{locale:'ko'})));
  const click=async(text)=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(button,text);await act(()=>button.click());};
  await click('화면 설정');assert.ok(document.querySelector('dialog[open]'));await click('다크');await click('175%');
  assert.equal(document.documentElement.dataset.theme,'dark');assert.equal(document.documentElement.dataset.textScale,'175');
  await act(()=>root.unmount());root=createRoot(document.getElementById('root'));await act(()=>root.render(createElement(DisplaySettings,{locale:'en'})));
  assert.equal(document.querySelector('.text-scale-options [aria-pressed=true]').textContent,'175%');assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'keep-notes');assert.equal(localStorage.getItem('patchwork.preferences'),'keep-favorites');
  assert.deepEqual(parseDisplayPreferences('{bad'),{theme:'light',textScale:100});assert.deepEqual(parseDisplayPreferences('{"theme":"bad","textScale":9999}'),{theme:'light',textScale:100});
 }finally{await act(()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);}
});
test('display controls have real translated labels in all four languages',()=>{
 for(const locale of ['ko','en','ja','zh']){const html=renderToStaticMarkup(createElement(DisplaySettings,{locale}));assert.match(html,/aria-haspopup="dialog"/);if(locale!=='ko')assert.doesNotMatch(html,/[가-힣]/);}
});
