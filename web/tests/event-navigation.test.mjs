import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {default:Radar}=await import('../components/radar.tsx');
const {byId}=await import('../lib/games.ts');
const clock=Date.parse('2026-10-21T00:00:00Z');
const text=n=>{const id=n.replace(/[^0-9]/g,'');return {ko:n,en:'Event '+id,ja:'イベント '+id,zh:'活动 '+id}};
const fixture=(gameId,n)=>({id:`${gameId}-event-${n}`,gameId,region:'global',kind:'event',server:'Asia · UTC+8',title:text(`이벤트 ${n}`),summary:text(`이벤트 ${n} 참여 안내`),startAt:'2026-10-01T00:00:00Z',endAt:'2026-11-01T00:00:00Z',sourceUrl:'https://example.com/notice/'+n,sourceTitle:'Original',verifiedAt:'2026-10-20T00:00:00Z',...(n===0?{image:`/test/${gameId}-poster.png`,imageVerified:true,imageLocale:'neutral',imageKind:'banner'}:{})});
const entries=['wuwa','zzz','hsr'].flatMap(g=>Array.from({length:9},(_,i)=>fixture(g,i)));
const data={entries,settings:{},sourceChecks:[],serverTime:new Date(clock).toISOString()};

// The event and upcoming siblings previously shared a key. A static render
// passed while each countdown tick leaked another event section into the DOM.
test('event sections stay singular across clock ticks, scroll, data refresh and game navigation',async()=>{
 const originalNow=Date.now;let now=clock;Date.now=()=>now;
 const props={initialLocale:'ko',initialLocaleManual:true,initialData:data,initialComplete:true};
 const dom=new JSDOM('<div id="root">'+renderToString(React.createElement(Radar,props))+'</div>',{url:'https://gagether.wiki/',pretendToBeVisual:true}),saved=new Map();
 const replace=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','localStorage','sessionStorage'])replace(k,dom.window[k]);replace('IS_REACT_ACT_ENVIRONMENT',true);
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};
 for(const method of ['show','showModal','close'])HTMLDialogElement.prototype[method]=function(){this.open=method!=='close'};
 const observers=new Set();replace('ResizeObserver',class{constructor(fn){this.fn=fn;observers.add(this)}observe(node){this.node=node}disconnect(){observers.delete(this)}});
 const timers=new Map();let timerId=0;replace('setInterval',(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId});replace('clearInterval',id=>timers.delete(id));
 replace('fetch',async url=>({ok:true,status:200,headers:new Headers(),json:async()=>String(url).startsWith('/api/data')?data:String(url).startsWith('/api/favorites')?{counts:{wuwa:12},revision:0}:String(url).startsWith('/api/social')?{channels:[]}:{canEdit:false}}));
 const recovered=[],errors=[],oldError=console.error;console.error=(...args)=>errors.push(args.join(' '));let root;
 const singular=()=>{assert.equal(document.querySelectorAll('#gagether-events').length,1,'one event section');const ids=[...document.querySelectorAll('#gagether-events [data-entry-id]')].map(n=>n.dataset.entryId);assert.equal(ids.length,new Set(ids).size,'unique event cards');};
 const tick=async()=>act(async()=>{now+=1000;for(const t of [...timers.values()])if(t.ms===1000)t.fn();window.dispatchEvent(new Event('scroll'));window.dispatchEvent(new Event('resize'));for(const o of observers)if(o.node?.isConnected)o.fn([{contentRect:{width:320,height:180}}]);});
 try{
  await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Radar,props),{onRecoverableError:e=>recovered.push(e.message)})});
  singular();
  const picker=document.querySelector('.calendar-my-games .my-games-picker');
  assert.ok(picker);
  picker.open=true;
  await act(async()=>document.querySelector('.mobile-menu').click());
  assert.equal(picker.open,false,'opening library dismisses calendar picker');
  assert.ok(document.querySelector('.workspace').hasAttribute('inert'),'background is noninteractive');
  assert.ok(document.querySelector('.sidebar').classList.contains('is-open'));
  await act(async()=>document.querySelector('.sidebar-scrim').click());
  assert.equal(document.querySelector('.workspace').hasAttribute('inert'),false);
  assert.equal(document.querySelector('.library-heading .library-count').textContent,'15');
  assert.equal(document.querySelectorAll('a[href="/owner/analytics"]').length,0);
  assert.equal(document.querySelector('.visitor-account-link').getAttribute('href'),'/account?locale=ko');
  assert.ok(document.querySelector('.main-nav>button:nth-of-type(6)').nextElementSibling.matches('.nav-account'));
  assert.equal(document.querySelectorAll('.visitor-account-link').length,1);
  // Cloud-applied values must update the mounted UI, and subsequent clicks
  // must persist against that current snapshot instead of stale React state.
  await act(async()=>{
   const prefs=JSON.parse(localStorage.getItem('patchwork.preferences')||'{}');
   localStorage.setItem('patchwork.preferences',JSON.stringify({...prefs,favorites:['zzz'],saved:['wuwa-event-0']}));
   localStorage.setItem('gagether.game-order.v1',JSON.stringify({version:1,ids:['zzz','wuwa']}));
   window.dispatchEvent(new Event('gagether:personal-applied'));
  });
  const star=id=>document.querySelector(`.game-nav-link[title="${byId[id].name.ko}"]`).parentElement.querySelector('.game-star');
  assert.equal(star('zzz').getAttribute('aria-pressed'),'true');
  assert.equal(document.querySelector('.main-nav>button:nth-of-type(6) small').textContent,'1');
  await act(async()=>star('wuwa').click());
  assert.deepEqual(JSON.parse(localStorage.getItem('patchwork.preferences')).favorites,['zzz','wuwa']);
  assert.deepEqual(JSON.parse(localStorage.getItem('patchwork.preferences')).saved,['wuwa-event-0']);
  assert.equal(document.querySelectorAll('.event-game-group').length,3);
  for(const group of document.querySelectorAll('.event-game-group')){
   assert.equal(group.querySelectorAll('.event-tile').length,2,'two compact previews per game');
   assert.ok([...group.querySelectorAll('.event-tile')].every(n=>n.dataset.gameId===group.dataset.gameId));
  }
  await act(async()=>{for(const image of document.querySelectorAll('.event-poster img')){Object.defineProperties(image,{naturalWidth:{value:1600},naturalHeight:{value:2400}});image.dispatchEvent(new Event('load'));}});
  for(let i=0;i<12;i++){await tick();singular();}
  for(const gameId of ['wuwa','zzz','wuwa']){
   await act(async()=>document.querySelector(`.game-nav-link[title="${byId[gameId].name.ko}"]`).click());
   singular();assert.equal(document.querySelector('.app-shell').classList.contains('sidebar-auto'),false);
   const ownEvents=()=>assert.ok([...document.querySelectorAll('#gagether-events [data-entry-id]')].every(n=>n.dataset.entryId.startsWith(gameId+'-')),'only selected game events');
   ownEvents();
   for(let i=0;i<5;i++){await tick();singular();ownEvents();}
   const more=document.querySelector('.event-more');if(more)await act(async()=>more.click());
   singular();ownEvents();assert.equal(document.querySelectorAll('#gagether-events [data-entry-id]').length,9);
   for(let i=0;i<3;i++)await act(async()=>window.dispatchEvent(new Event('gagether:data-changed')));
   singular();ownEvents();
  }
  for(let i=1;i<4;i++){
   await act(async()=>document.querySelectorAll('.language-control button')[i].click());singular();
   assert.ok([...document.querySelectorAll('#gagether-events [data-game-id]')].every(n=>n.dataset.gameId==='wuwa'));
   await tick();singular();
  }
  await act(async()=>document.querySelector('.main-nav button').click());singular();
  for(let i=0;i<4;i++){await tick();singular();}
  await act(async()=>document.querySelector('.event-game-group[data-game-id="zzz"] .event-game-more').click());
  singular();assert.equal(document.querySelector('#gagether-events').dataset.gameId,'zzz');
  assert.ok([...document.querySelectorAll('#gagether-events [data-entry-id]')].every(n=>n.dataset.gameId==='zzz'));
  await tick();singular();
  assert.deepEqual(recovered,[]);assert.ok(!errors.some(e=>/same key|hydration|did not match/i.test(e)),errors.join('\n'));
 }finally{if(root)await act(async()=>root.unmount());console.error=oldError;Date.now=originalNow;dom.window.close();for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k]}}
});
