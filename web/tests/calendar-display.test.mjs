import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React,{act} from 'react';import {JSDOM} from 'jsdom';
const {default:Calendar}=await import('../components/schedule-calendar.tsx');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const {calendarPreferencesKey,calendarPreferences,calendarIncludesGame}=await import('../lib/calendar-preferences.ts');
const {calendarDisplayText}=await import('../lib/calendar-display-i18n.ts');
test('calendar choices keep explicit empty selections and ignore malformed settings',()=>{
 const empty=calendarPreferences({version:1,kinds:[],games:'selected',gameIds:[],mode:'notes'});assert.deepEqual(empty.kinds,[]);assert.equal(empty.mode,'notes');assert.equal(calendarIncludesGame(empty,'limbus',['limbus']),false);
 const p=calendarPreferences({version:1,kinds:['event','unknown','event'],games:'bad',gameIds:['limbus','<bad>',{},'limbus']});assert.deepEqual(p.kinds,['event']);assert.deepEqual(p.gameIds,['limbus']);assert.equal(p.games,'all');assert.equal(calendarPreferences(null,true).games,'favorites');
 assert.notEqual(calendarPreferencesKey(),calendarPreferencesKey('wuwa'));
 for(const l of ['ko','en','ja','zh'])assert.deepEqual(Object.keys(calendarDisplayText[l]),Object.keys(calendarDisplayText.ko));
});
test('calendar independently remembers multiple types, chosen games and last tab across remounts and new sessions',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko',pretendToBeVisual:true}),old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','StorageEvent','localStorage','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 const games=catalogGames({}),byId=Object.fromEntries(games.map(g=>[g.id,g])),now=Date.parse('2026-10-29T03:00:00Z'),words=s=>({ko:s,en:s,ja:s,zh:s});
 const entries=[['limbus','pickup'],['dna','event'],['wuwa','pickup'],['limbus','weapon']].map(([gameId,kind],i)=>({id:'calendar-'+i,gameId,region:'global',kind,title:words(gameId+' '+kind),summary:words(''),startAt:'2026-10-29T01:00:00Z',endAt:'2026-11-05T01:00:00Z',sourceKind:'official'}));
 const marker=JSON.stringify({favorites:['wuwa'],saved:['keep'],kind:'event'});localStorage.setItem('patchwork.preferences',marker);
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root')),noop=()=>{};
 const render=key=>React.createElement(CatalogContext.Provider,{value:{games,byId,t:catalogUi('ko',{}),simpleMode:false,locale:'ko',settings:{},openEditor:noop}},React.createElement(Calendar,{key,entries,locale:'ko',now,onOpen:noop,showGameNames:true,persistenceKey:'calendar-session-test',favorites:['wuwa']}));
 try{
  await act(async()=>root.render(render('first')));
  await act(async()=>document.querySelector('.calendar-display-options summary').click());
  await act(async()=>[...document.querySelectorAll('.calendar-game-scopes button')].find(b=>b.textContent==='직접 선택').click());
  for(const name of ['림버스 컴퍼니','듀엣 나이트 어비스'])await act(async()=>[...document.querySelectorAll('.calendar-game-choices label')].find(l=>l.textContent===name).querySelector('input').click());
  for(const label of ['판매 패키지','업데이트'])await act(async()=>[...document.querySelectorAll('.schedule-type-choices label')].find(l=>l.textContent===label).querySelector('input').click());
  await act(async()=>document.querySelectorAll('.calendar-agenda-tabs button')[1].click());
  assert.deepEqual([...document.querySelectorAll('.calendar-agenda-row strong')].map(n=>n.textContent).sort(),['dna event','limbus pickup']);
  const saved=JSON.parse(localStorage.getItem(calendarPreferencesKey()));assert.deepEqual(saved.kinds,['pickup','event']);assert.equal(saved.mode,'active');assert.deepEqual(saved.gameIds,['limbus','dna']);assert.equal(localStorage.getItem('patchwork.preferences'),marker);
  sessionStorage.clear();await act(async()=>root.render(render('revisit')));
  assert.equal(document.querySelectorAll('.calendar-agenda-tabs button')[1].getAttribute('aria-pressed'),'true');assert.equal(JSON.parse(localStorage.getItem(calendarPreferencesKey())).games,'selected');assert.equal(document.querySelectorAll('.calendar-agenda-row').length,2);
  await act(async()=>{localStorage.setItem(calendarPreferencesKey(),JSON.stringify({...saved,kinds:[]}));window.dispatchEvent(new StorageEvent('storage',{key:calendarPreferencesKey()}));});
  assert.equal(document.querySelectorAll('.calendar-agenda-row').length,0);assert.match(document.querySelector('.calendar-display-empty').textContent,/선택/);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
