import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {default:Radar}=await import('../components/radar.tsx');
const {games}=await import('../lib/games.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const clock=Date.parse('2026-10-23T02:00:00Z');
const entries=games.flatMap(g=>[...new Set(g.regions.map(r=>effectiveRegion(g,r)))].map(r=>({id:'owner-fixture-'+g.id+'-'+r,gameId:g.id,region:r,kind:'event',server:r,title:{ko:g.name.ko+' 시험',en:g.name.en+' fixture',ja:g.name.ja+' 検証',zh:g.name.zh+' 测试'},summary:{ko:'직접 상세',en:'Inline details',ja:'直接詳細',zh:'直接详情'},startAt:'2026-10-01T00:00:00Z',endAt:'2026-11-01T00:00:00Z',publishedAt:null,sourceUrl:g.official,sourceTitle:'Source',verifiedAt:'2026-10-22T00:00:00Z'})));
const data={entries,settings:{},sourceChecks:[],serverTime:new Date(clock).toISOString()};
test('owner buttons are on the real hydrated canvas across 15 games and 4 languages, with no separate entry inspector',async()=>{
 const originalNow=Date.now;Date.now=()=>clock;const props={initialLocale:'ko',initialLocaleManual:true,initialData:data,initialComplete:true};
 const dom=new JSDOM('<div id="root">'+renderToString(React.createElement(Radar,props))+'</div>',{url:'https://gagether.wiki/',pretendToBeVisual:true}),old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','CustomEvent','localStorage','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};Element.prototype.scrollIntoView=()=>{};
 for(const m of ['show','showModal','close'])HTMLDialogElement.prototype[m]=function(){this.open=m!=='close';};
 set('setInterval',()=>0);set('clearInterval',()=>{});
 set('fetch',async url=>({ok:true,status:200,headers:new Headers(),json:async()=>String(url).startsWith('/api/editor?id=')?{entry:entries.find(e=>e.id===new URL(String(url),'https://gagether.wiki').searchParams.get('id'))}:String(url).startsWith('/api/data')?data:String(url).startsWith('/api/favorites')?{counts:{},revision:0}:String(url).startsWith('/api/social')?{channels:[]}:{canEdit:true}}));
 const recovered=[],errors=[],oldError=console.error;console.error=(...a)=>errors.push(a.join(' '));let root;
 try{
  await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Radar,props),{onRecoverableError:e=>recovered.push(e.message)});});
  for(const locale of ['ko','en','ja','zh']){
   await act(async()=>document.querySelector('.language-control button[title="'+({ko:'한국어',en:'English',ja:'日本語',zh:'中文'})[locale]+'"]').click());
   for(const game of games){
    await act(async()=>document.querySelector('.game-nav-link[title="'+game.name[locale]+'"]').click());
    const tile=document.querySelector('#gagether-events .event-tile');assert.ok(tile,game.id+' '+locale);
    const control=tile.querySelector('.owner-edit-small');assert.ok(control,game.id+' '+locale+' needs an edit control');
    await act(async()=>{control.click();await import('../components/owner-inline-form.tsx');});
    const form=tile.querySelector('.owner-inline-form');assert.ok(form,game.id+' opens in its own tile');assert.equal(document.querySelector('.editor-inspector'),null);
    assert.equal(form.querySelector('.editor-field input').value,entries.find(e=>e.id===form.closest('[data-owner-entry]').dataset.ownerEntry).title[locale]);
    assert.equal(form.closest('button'),null,'no nested interactive editor inside a button');
    await act(async()=>form.querySelector('header>button').click());assert.equal(document.querySelector('.owner-inline-form'),null);
   }
  }
  assert.deepEqual(recovered,[]);assert.equal(errors.filter(e=>/same key|cannot be a descendant|hydration|Maximum update/.test(e)).length,0,errors.join('\n'));
 }finally{await act(async()=>root?.unmount());console.error=oldError;Date.now=originalNow;dom.window.close();for(const[k,d] of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
