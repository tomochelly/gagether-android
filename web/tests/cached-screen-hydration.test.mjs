import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {default:Radar}=await import('../components/radar.tsx');
const {packCatalog}=await import('../lib/catalog-transport.ts');
const {remainingTime}=await import('../lib/schedule.ts');
const names={ko:'검수 픽업',en:'Reviewed pickup',ja:'確認済みピックアップ',zh:'已核实招募'};
const seedClock='2026-10-18T00:00:00Z',currentClock=Date.parse('2026-10-18T00:04:00Z');
const entry={id:'hydration-wuwa',gameId:'wuwa',region:'global',kind:'pickup',title:names,summary:names,startAt:'2026-10-01T00:00:00Z',endAt:'2026-10-19T00:00:00Z',verifiedAt:seedClock,sourceUrl:'https://example.com/notice',sourceTitle:'Verified notice'};
const data={entries:[entry],settings:{},settingsRevision:0,sourceChecks:[],serverTime:seedClock,persistent:true};
test('packed screens hydrate without mismatches: fresh screens avoid duplicate requests, stale screens refresh, all locales retain private preferences',async()=>{
 const originalNow=Date.now;Date.now=()=>currentClock;
 try{for(const {locale,mobile=false,fresh=false} of [...['ko','en','ja','zh'].flatMap(locale=>[{locale},{locale,fresh:true}]),{locale:'ja',mobile:true}]){
  const props={initialLocale:locale,initialLocaleManual:true,initialCatalog:packCatalog({...data,serverTime:fresh?new Date(currentClock).toISOString():seedClock}),initialComplete:false,initialDeferred:true,revalidateOnMount:true,appMode:mobile,initialMobileView:mobile?'simple':'full',initialCompactWidth:mobile};
  const markup=renderToString(React.createElement(Radar,props));
  const dom=new JSDOM('<div id="root">'+markup+'</div>',{url:'https://gagether.wiki/',pretendToBeVisual:true}),saved=new Map();
  const replace=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
  for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','localStorage','sessionStorage'])replace(k,dom.window[k]);replace('IS_REACT_ACT_ENVIRONMENT',true);
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};HTMLDialogElement.prototype.close=function(){this.open=false};
  replace('ResizeObserver',class{observe(){} disconnect(){}});
  const timers=new Map();let timerId=0;replace('setInterval',(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId});replace('clearInterval',id=>timers.delete(id));
  const preference={locale,localeManual:true,favorites:['wuwa'],saved:[entry.id],myOnly:true,region:'global',gameRegions:{wuwa:'global'},mobileView:mobile?'simple':'full'};
  localStorage.setItem('patchwork.preferences',JSON.stringify(preference));const privateNote='{"unread":"visitor private note"}';localStorage.setItem('gagether.personal-notes.v1',privateNote);
  const calls=[];let resolveIndex;replace('fetch',async path=>{calls.push(path);if(String(path).startsWith('/api/data'))return new Promise(resolve=>resolveIndex=resolve);return {ok:true,status:200,json:async()=>String(path).startsWith('/api/favorites')?{counts:{},revision:0}:{canEdit:false}}});
  const recovered=[],errors=[];const previousError=console.error;console.error=(...args)=>errors.push(args.join(' '));let root;
  try{
   await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Radar,props),{onRecoverableError:e=>recovered.push(e.message)})});
   assert.deepEqual(recovered,[]);assert.ok(!errors.some(e=>/hydration|did not match/i.test(e)),errors.join('\n'));
   assert.equal(calls.filter(p=>p==='/api/data?view=index').length,fresh?0:1);
   if(fresh){await act(async()=>{for(const t of timers.values())if(t.ms===60000)t.fn()});assert.equal(calls.filter(p=>p==='/api/data?view=index').length,1);}
   assert.equal(document.documentElement.lang,locale);
   assert.equal(!!document.querySelector('.app-shell.simple-mode'),mobile);
   assert.ok(document.querySelector('.entry-countdown').textContent.includes(remainingTime(entry.endAt,currentClock,locale)),'cached countdown updates to the current clock immediately');
   assert.ok([...timers.values()].some(t=>t.ms===1000),'second countdown remains enabled');
   const changed={...entry,title:{ko:'변경된 픽업',en:'Updated pickup',ja:'更新済みピックアップ',zh:'已更新招募'}};
   await act(async()=>resolveIndex({ok:true,status:200,headers:new Headers({ETag:'"new"'}),json:async()=>({...data,entries:[changed],serverTime:new Date(currentClock).toISOString()})}));
   assert.ok(document.body.textContent.includes(changed.title[locale]));
   const retained=JSON.parse(localStorage.getItem('patchwork.preferences'));for(const k of ['locale','favorites','saved','myOnly','gameRegions','mobileView'])assert.deepEqual(retained[k],preference[k]);
   assert.equal(localStorage.getItem('gagether.personal-notes.v1'),privateNote);
   await act(async()=>{for(const t of timers.values())if(t.ms===1000)t.fn()});
  }finally{if(root)await act(async()=>root.unmount());console.error=previousError;dom.window.close();for(const [k,d] of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k]}}
 }}finally{Date.now=originalNow}
});
