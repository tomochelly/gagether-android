import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {Script} from 'node:vm';
import {createElement,act} from 'react';
import {createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
const {default:DisplaySettings}=await import('../components/display-settings.tsx');
const {displayBootstrap,DISPLAY_PREFERENCES_KEY,displayText,parseDisplayPreferences}=await import('../lib/display-preferences.ts');
const {monthCells}=await import('../lib/schedule.ts');
const {weekDates}=await import('../lib/personal-notes.ts');
const {calendarNames}=await import('../lib/calendar-labels.ts');
const {games}=await import('../lib/games.ts');

test('display bootstrap is isolated from other scripts and safe to repeat',()=>{
 const dom=new JSDOM('',{url:'https://gagether.wiki/orbit/ko',runScripts:'outside-only'});
 const context=dom.getInternalVMContext();new Script('let o=17;let p=23;let r=42;let s=100;').runInContext(context);
 assert.doesNotThrow(()=>{new Script(displayBootstrap).runInContext(context);new Script(displayBootstrap).runInContext(context);});
 assert.equal(new Script('o+p+r+s').runInContext(context),182);
 assert.equal(dom.window.document.documentElement.dataset.theme,'dark');dom.window.close();
});
test('Orbit uses independent display preferences while classic preferences remain intact',()=>{
 const classic=JSON.stringify({theme:'light',textScale:130}),orbit=JSON.stringify({theme:'dark',textScale:115});
 for(const pathname of ['/ko','/orbit/ko']){
  const dom=new JSDOM('',{url:'https://gagether.wiki'+pathname,runScripts:'outside-only'});
  dom.window.localStorage.setItem(DISPLAY_PREFERENCES_KEY,classic);
  dom.window.localStorage.setItem('gagether.orbit.display.v1',orbit);
  dom.window.eval(displayBootstrap);
  assert.equal(dom.window.document.documentElement.dataset.theme,pathname==='/ko'?'light':'dark');
  assert.equal(dom.window.document.documentElement.dataset.textScale,pathname==='/ko'?'130':'115');
  assert.equal(dom.window.localStorage.getItem(DISPLAY_PREFERENCES_KEY),classic);
  dom.window.localStorage.removeItem('gagether.orbit.display.v1');dom.window.eval(displayBootstrap);
  assert.equal(dom.window.document.documentElement.dataset.theme,pathname==='/ko'?'light':'dark');
  dom.window.close();
 }
});

test('Sunday-first month and week agree across leap days and year boundaries',()=>{
 for(const month of ['2026-10','2026-11','2027-01','2028-02']){
  const cells=monthCells(month);assert.equal(new Date(cells[0]+'T12:00:00Z').getUTCDay(),0);assert.equal(cells.length%7,0);
  for(let i=0;i<cells.length;i+=7)assert.deepEqual(weekDates(cells[i+3]),cells.slice(i,i+7));
  const days=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate();assert.equal(cells.filter(d=>d.startsWith(month)).length,days);
 }
 assert.equal(monthCells('2026-11')[0],'2026-11-01');
 for(const game of games)for(const locale of ['ko','en','ja','zh'])assert.ok(calendarNames[game.id][locale]);
});
test('quick theme switch and separate gear settings preserve preferences, bounds, focus and personal records',async()=>{
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
  const click=async(text)=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent===text||b.getAttribute('aria-label')===text);assert.ok(button,text);await act(()=>button.click());};
  const gear=()=>document.querySelector('.display-settings-trigger'),toggle=()=>document.querySelector('[role=switch]');
  assert.equal(toggle().getAttribute('aria-checked'),'false');assert.equal(gear().textContent,'');
  await click('다크 모드');assert.equal(toggle().getAttribute('aria-checked'),'true');assert.equal(document.querySelector('dialog[open]'),null);
  assert.equal(document.querySelector('meta[name="theme-color"]').content,'#101711');
  await click('설정');assert.ok(document.querySelector('dialog[open]'));assert.equal(gear().getAttribute('aria-expanded'),'true');
  assert.equal(gear().getAttribute('aria-controls'),document.querySelector('dialog').id);
  assert.equal(document.querySelector('dialog [role=switch]'),null);assert.equal(document.querySelector('.display-options'),null);
  await click('175%');await click('배율 줄이기');assert.equal(document.documentElement.dataset.textScale,'150');await click('배율 늘리기');
  await click('200%');assert.equal(document.querySelector('[aria-label="배율 늘리기"]').disabled,true);
  await click('100%');assert.equal(document.querySelector('[aria-label="배율 줄이기"]').disabled,true);
  await click('175%');
  assert.equal(document.documentElement.dataset.theme,'dark');assert.equal(document.documentElement.dataset.textScale,'175');
  await act(()=>root.unmount());root=createRoot(document.getElementById('root'));await act(()=>root.render(createElement(DisplaySettings,{locale:'en'})));
  assert.equal(document.querySelector('.text-scale-options [aria-pressed=true]').textContent,'175%');assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'keep-notes');assert.equal(localStorage.getItem('patchwork.preferences'),'keep-favorites');
  assert.equal(toggle().getAttribute('aria-checked'),'true');assert.equal(document.querySelector('dialog[open]'),null);
  await act(()=>window.dispatchEvent(new dom.window.StorageEvent('storage',{key:DISPLAY_PREFERENCES_KEY,newValue:JSON.stringify({theme:'light',textScale:115})})));
  assert.equal(toggle().getAttribute('aria-checked'),'false');assert.equal(document.documentElement.dataset.textScale,'115');
  await click('Settings');await click('Default size');assert.equal(document.documentElement.dataset.textScale,'100');assert.equal(document.documentElement.dataset.theme,'light');
  await act(()=>document.querySelector('dialog').dispatchEvent(new dom.window.Event('cancel',{cancelable:true})));
  assert.equal(document.querySelector('dialog[open]'),null);assert.equal(gear().getAttribute('aria-expanded'),'false');assert.equal(document.activeElement,gear());
  await click('Settings');await click('Close');assert.equal(document.activeElement,gear());
  assert.deepEqual(parseDisplayPreferences('{bad'),{theme:'light',textScale:100});assert.deepEqual(parseDisplayPreferences('{"theme":"bad","textScale":9999}'),{theme:'light',textScale:100});
 }finally{await act(()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);}
});
test('display controls have real translated labels in all four languages',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const html=renderToStaticMarkup(createElement(DisplaySettings,{locale})),dom=new JSDOM(html),doc=dom.window.document,t=displayText[locale];
  assert.equal(doc.querySelector('[role=switch]').getAttribute('aria-label'),t.darkMode);
  assert.equal(doc.querySelector('[role=switch]').getAttribute('aria-checked'),'false');
  assert.equal(doc.querySelector('.display-settings-trigger').getAttribute('aria-label'),t.settings);
  assert.equal(doc.querySelector('.display-settings-trigger').textContent,'');assert.ok(doc.querySelector('.display-settings-trigger .lucide-settings'));
  assert.equal(doc.querySelector('dialog h2').textContent,t.settings);assert.equal(doc.querySelector('legend').textContent,t.size);
  assert.equal(doc.querySelector('.text-scale-options').children.length,6);assert.equal(doc.querySelector('.display-preview>span').textContent,t.preview);
  assert.doesNotMatch(html,/화면 설정|display-options/);if(locale!=='ko')assert.doesNotMatch(html,/[가-힣]/);dom.window.close();
 }
});
