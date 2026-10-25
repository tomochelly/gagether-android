import './load-typescript.mjs';import {test} from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {JSDOM} from 'jsdom';
import releases from '../content/release-additions-20261025.json' with {type:'json'};
const {default:PVBanner}=await import('../components/pv-banner.tsx');
test('new PV banner keeps official languages and owner title styles, mounts video only after play, stops on close/switch and removes expired trailers',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();for(const k of ['window','document','HTMLElement','HTMLInputElement','Element','Node','Event','MouseEvent','KeyboardEvent']){saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true})}saved.set('IS_REACT_ACT_ENVIRONMENT',Object.getOwnPropertyDescriptor(globalThis,'IS_REACT_ACT_ENVIRONMENT'));globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=await import('react-dom/client');let root;const now=Date.parse('2026-10-25T04:00:00Z'),entries=releases.map(e=>e.sourceLocale==='ko'?{...e,title:{...e.title,ko:'운영자 PV 제목'},textStyle:{ko:{titleSize:31,titleFormat:{bold:true}}}}:e);
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(PVBanner,{entries,locale:'ko',now}))});
  assert.equal(document.querySelector('iframe'),null);assert.equal(document.querySelector('h2').textContent,'운영자 PV 제목');assert.equal(document.querySelector('h2').style.fontSize,'31px');assert.equal(document.querySelectorAll('.pv-banner-choices button').length,0);
  await act(async()=>document.querySelector('.primary-button').click());assert.match(document.querySelector('iframe').src,/3DK6XYB7icE\?autoplay=1/);
  await act(async()=>document.querySelector('.pv-banner-player button').click());assert.equal(document.querySelector('iframe'),null);
  await act(async()=>root.render(React.createElement(PVBanner,{entries,locale:'en',now})));assert.match(document.querySelector('h2').textContent,/Lore Trailer/);assert.equal(document.querySelector('iframe'),null);
  await act(async()=>document.querySelector('.primary-button').click());assert.match(document.querySelector('iframe').src,/LXyEJPjiMsU/);
  await act(async()=>root.render(React.createElement(PVBanner,{entries,locale:'ko',now})));assert.equal(document.querySelector('iframe'),null);
  await act(async()=>root.render(React.createElement(PVBanner,{entries,locale:'en',now})));assert.equal(document.querySelector('iframe'),null);
  const second=structuredClone(entries.find(e=>e.gameId==='wuwa'&&e.sourceLocale==='ko'));second.id='ui-fixture-second-pv';second.videos[0].youtubeId='fixturePV12';second.videos[0].originalTitle='두 번째 테스트 PV';second.videos[0].publishedAt='2026-10-25T03:59:00Z';
  await act(async()=>root.render(React.createElement(PVBanner,{entries:[...entries,second],locale:'ko',now})));assert.equal(document.querySelectorAll('.pv-banner-choices button').length,2);
  await act(async()=>document.querySelector('.primary-button').click());assert.ok(document.querySelector('iframe'));await act(async()=>document.querySelectorAll('.pv-banner-choices button')[1].click());assert.equal(document.querySelector('iframe'),null);
  await act(async()=>document.querySelector('.primary-button').click());await act(async()=>document.querySelector('.pv-banner-player button').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(document.querySelector('iframe'),null);
  await act(async()=>root.render(React.createElement(PVBanner,{entries,locale:'ko',now:now+8*86400000})));assert.equal(document.querySelector('.pv-banner'),null);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
