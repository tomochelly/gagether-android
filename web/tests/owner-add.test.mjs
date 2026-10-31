import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToString} from 'react-dom/server';

import {JSDOM} from 'jsdom';
const {editorText}=await import('../lib/editor-i18n.ts');
const {default:Radar}=await import('../components/radar.tsx');
const {games}=await import('../lib/games.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const clock=Date.parse('2026-10-23T02:00:00Z');
const entries=games.flatMap(g=>[...new Set(g.regions.map(r=>effectiveRegion(g,r)))].map(r=>({id:'owner-fixture-'+g.id+'-'+r,gameId:g.id,region:r,kind:'event',server:r,title:{ko:g.name.ko+' 시험',en:g.name.en+' fixture',ja:g.name.ja+' 検証',zh:g.name.zh+' 测试'},summary:{ko:'직접 상세',en:'Inline details',ja:'直接詳細',zh:'直接详情'},startAt:'2026-10-01T00:00:00Z',endAt:'2026-11-01T00:00:00Z',publishedAt:null,sourceUrl:g.official,sourceTitle:'Source',verifiedAt:'2026-10-22T00:00:00Z'})));
const data={entries,settings:{},sourceChecks:[],serverTime:new Date(clock).toISOString()};
test('real owner canvas: add, retry, consecutive creation, library game/text edit and mobile menu handoff',async()=>{
 const originalNow=Date.now;Date.now=()=>clock;const props={initialLocale:'ko',initialLocaleManual:true,initialData:data,initialComplete:true};
 const dom=new JSDOM('<div id="root">'+renderToString(React.createElement(Radar,props))+'</div>',{url:'https://gagether.wiki/',pretendToBeVisual:true}),old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','CustomEvent','localStorage','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};Element.prototype.scrollIntoView=()=>{};
 for(const m of ['show','showModal','close'])HTMLDialogElement.prototype[m]=function(){this.open=m!=='close';};
 set('setInterval',()=>0);set('clearInterval',()=>{});
 set('fetch',async url=>({ok:true,status:200,headers:new Headers(),json:async()=>String(url).startsWith('/api/editor?id=')?{entry:entries.find(e=>e.id===new URL(String(url),'https://gagether.wiki').searchParams.get('id'))}:(String(url).startsWith('/api/data')||String(url)==='/api/editor')?data:String(url).startsWith('/api/favorites')?{counts:{},revision:0}:String(url).startsWith('/api/social')?{channels:[]}:{canEdit:true}}));
 let posts=[],failSave=false;
 const getFetch=globalThis.fetch;
 set('fetch',async(url,options)=>{if(options?.method==='POST'&&String(url).startsWith('/api/editor')){const body=JSON.parse(options.body);posts.push(body);if(failSave)return {ok:false,status:503,json:async()=>({error:'Temporary failure'})};if(body.target==='site'){data.settings=body.changes;data.settingsRevision=(data.settingsRevision||0)+1;}else{const old=data.entries.find(e=>e.id===body.id);const next={...old,...body.changes,id:body.id,verifiedAt:old?.verifiedAt||new Date(clock).toISOString(),editor:{revision:(old?.editor?.revision||0)+1,updatedAt:new Date(clock).toISOString(),fields:Object.keys(body.changes)}};data.entries=[next,...data.entries.filter(e=>e.id!==next.id)];}return {ok:true,json:async()=>String(url).includes('view=entry')?{entry:data.entries.find(e=>e.id===body.id)}:data};}return getFetch(url,options);});
 const typeValue=(node,value)=>{const proto=node.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));};
 const {hydrateRoot}=await import('react-dom/client');
 const recovered=[],errors=[],oldError=console.error;console.error=(...a)=>errors.push(a.join(' '));let root;
 try{
  await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Radar,props),{onRecoverableError:e=>recovered.push(e.message)});});
  assert.ok(!document.querySelector('.app-shell.editing'));await act(async()=>document.querySelector('.editor-toggle-button').click());
  await act(async()=>{document.querySelector('.editor-toolbar button:nth-of-type(2)').click();await import('../components/editor-panel.tsx');});
  assert.ok(document.querySelector('.editor-inspector'),'Add opens the editor');
  assert.ok(document.querySelector('.editor-inspector textarea[aria-label="'+editorText.ko.title+'"]'),'New item fields render');
  assert.equal(document.querySelector('.owner-settings-inline').parentElement.tagName,'MAIN','Editor must not be buried in reorderable sections');
  let title=document.querySelector('.editor-inspector textarea[aria-label="'+editorText.ko.title+'"]');
  await act(async()=>document.querySelector('.editor-footer button.editor-primary').click());assert.match(document.querySelector('.editor-error').textContent,/title/);
  await act(async()=>typeValue(title,'New pickup'));
  failSave=true;await act(async()=>{document.querySelector('.editor-footer button.editor-primary').click();document.querySelector('.editor-footer button.editor-primary').click();});assert.equal(posts.length,1);assert.equal(title.value,'New pickup');assert.match(document.querySelector('.editor-error').textContent,/Temporary failure/);
  failSave=false;await act(async()=>document.querySelector('.editor-footer button.editor-primary').click());assert.equal(posts[1].create,true);assert.equal(posts[1].revision,0);const first=posts[1].id;
  await act(async()=>document.querySelector('.editor-toolbar button:nth-of-type(2)').click());title=document.querySelector('.editor-inspector textarea[aria-label="'+editorText.ko.title+'"]');assert.equal(title.value,'');await act(async()=>typeValue(title,'Another new pickup'));await act(async()=>document.querySelector('.editor-footer button.editor-primary').click());assert.equal(posts[2].create,true);assert.notEqual(posts[2].id,first);
  await act(async()=>document.querySelector('.editor-header button:last-child').click());
  const addHere=()=>[...document.querySelectorAll('.owner-edit-small')].find(b=>b.textContent==='여기에 새 항목 추가');
  const inlineIds=[];
  for(let i=0;i<2;i++){
   await act(async()=>{addHere().click();await import('../components/owner-inline-form.tsx');});const form=document.querySelector('.owner-inline-form');inlineIds.push(form.closest('[data-owner-entry]').dataset.ownerEntry);
   await act(async()=>typeValue(form.querySelector('textarea[aria-label="'+editorText.ko.title+'"]'),'Inline created '+i));await act(async()=>form.querySelector('.editor-primary').click());assert.equal(document.querySelector('.owner-inline-form'),null);assert.equal(posts.at(-1).create,true);
  }
  assert.notEqual(inlineIds[0],inlineIds[1]);
  // Sidebar game edits must close the mobile menu and remove inert before opening.
  await act(async()=>document.querySelector('.mobile-menu').click());assert.equal(document.querySelector('.workspace').hasAttribute('inert'),true);
  await act(async()=>document.querySelector('.game-nav-group .nav-edit').click());assert.equal(document.querySelector('.workspace').hasAttribute('inert'),false);assert.equal(document.querySelector('.sidebar-scrim'),null);
  assert.equal(document.querySelector('.editor-inspector .editor-field input').value,games[0].name.ko);
  await act(async()=>typeValue(document.querySelector('.editor-inspector .editor-field input'),'Edited library game'));
  await act(async()=>document.querySelector('.editor-footer button.editor-primary').click());assert.ok([...document.querySelectorAll('.game-nav-link')].some(e=>e.title==='Edited library game'));assert.equal(posts.at(-1).target,'site');
  await act(async()=>document.querySelector('.library-heading button').click());await act(async()=>typeValue(document.querySelector('.editor-inspector .editor-field textarea'),'My edited library'));
  await act(async()=>document.querySelector('.editor-footer button.editor-primary').click());assert.equal(document.querySelector('.library-heading>span').textContent,'My edited library');
  // Every library tile has a real owner-only edit control.
  const nav=[...document.querySelectorAll('.sidebar nav')].find(n=>n.querySelector('button.active'));
  await act(async()=>nav.querySelectorAll('button')[1].click());assert.equal(document.querySelectorAll('.game-tile .tile-edit').length,18);
  await act(async()=>document.querySelector('.game-tile .tile-edit').click());assert.ok(document.querySelector('.editor-inspector .editor-field input'));
  assert.deepEqual(recovered,[]);assert.equal(errors.filter(e=>/same key|cannot be a descendant|hydration|Maximum update/.test(e)).length,0,errors.join('\n'));
 }finally{await act(async()=>root?.unmount());console.error=oldError;Date.now=originalNow;dom.window.close();for(const[k,d] of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
