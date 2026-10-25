import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React,{act} from 'react';import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const {default:Panel}=await import('../components/character-roster.tsx');
test('roster gallery keeps all form links, opens deferred details, isolates nested originals and restores focus/scroll',async()=>{
 const data=bootstrap.find(r=>r.gameId==='bluearchive'),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko/games/bluearchive/characters',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','HTMLInputElement','Element','Node','Event','MouseEvent'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);Object.defineProperty(window,'devicePixelRatio',{value:2});
 let columnCount=6,resize;const computed=window.getComputedStyle.bind(window);
 window.getComputedStyle=e=>e.classList.contains('roster-gallery')?{gridTemplateColumns:Array(columnCount).fill('180px').join(' ')}:computed(e);
 set('ResizeObserver',class{constructor(callback){resize=callback}observe(){}disconnect(){}});
 HTMLDialogElement.prototype.showModal=function(){this.open=true};HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new Event('close'))};
 // Simulate images that finished loading before hydration, with no load event.
 Object.defineProperties(dom.window.HTMLImageElement.prototype,{complete:{get:()=>true,configurable:true},naturalWidth:{get:()=>889,configurable:true},naturalHeight:{get:()=>1280,configurable:true}});
 const requests=[];set('fetch',async value=>{const u=new URL(value,'https://gagether.wiki');requests.push(u);return u.searchParams.has('id')?Response.json({gameId:data.gameId,character:data.characters.find(c=>c.id===u.searchParams.get('id'))}):Response.json({data,revision:'fixture'});});
 const {createRoot}=await import('react-dom/client');let root;const click=selector=>act(async()=>document.querySelector(selector).click());
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Panel,{gameId:data.gameId,locale:'ko',region:'jp',initialData:data}));await new Promise(setImmediate)});
  const cards=[...document.querySelectorAll('.roster-card')];assert.equal(cards.length,data.characters.length);assert.ok(cards.every(c=>c.getAttribute('aria-haspopup')==='dialog'));assert.equal(document.querySelector('dialog'),null);assert.equal(requests.filter(u=>u.searchParams.has('id')).length,0);
  assert.equal(cards[3].dataset.rowWide,'1');assert.equal(cards[2].dataset.rowNarrow,'1');assert.equal(cards[0].querySelector('.roster-card-image').getAttribute('loading'),'eager');assert.equal(cards[3].querySelector('.roster-card-image').getAttribute('loading'),'lazy');assert.equal(cards.at(-1).querySelector('.roster-seam'),null);
  assert.equal(cards[5].dataset.rowPortrait,'0');assert.equal(cards[6].dataset.rowPortrait,'1');assert.equal(cards[5].querySelector('.roster-seam').dataset.portrait,'false');assert.equal(cards[4].querySelector('.roster-seam').dataset.portrait,'true');
  const thumbnail=cards[0].querySelector('.roster-card-image'),cachedZoom=Number(thumbnail.style.getPropertyValue('--roster-card-zoom'));assert.ok(cachedZoom>1.18);assert.ok(Number.parseFloat(thumbnail.style.maxWidth)*cachedZoom<=889/2+1e-6);
  await act(async()=>{columnCount=8;const size=document.querySelector('select[aria-label="크기"]');size.value='compact';size.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(Number(thumbnail.style.getPropertyValue('--roster-card-zoom')),cachedZoom);
  assert.equal(cards[7].dataset.rowPortrait,'0');assert.equal(cards[8].dataset.rowPortrait,'1');assert.equal(cards[7].querySelector('.roster-seam').dataset.portrait,'false');
  await act(async()=>{columnCount=2;resize()});assert.equal(cards[2].dataset.rowPortrait,'1');assert.equal(cards[1].querySelector('.roster-seam').dataset.portrait,'false');assert.equal(cards[0].querySelector('.roster-seam').dataset.portrait,'true');
  const opener=cards[0];opener.focus();await click('.roster-card');assert.equal(document.querySelector('.roster-character-dialog').open,true);assert.equal(document.documentElement.style.overflow,'hidden');assert.ok(document.querySelectorAll('.roster-stats dd').length>0);assert.equal(requests.filter(u=>u.searchParams.has('id')).length,1);
  const image=document.querySelector('.roster-detail-art img');Object.defineProperty(image,'naturalWidth',{value:800});Object.defineProperty(image,'naturalHeight',{value:1200});await act(async()=>image.dispatchEvent(new Event('load')));assert.equal(image.style.maxWidth,'400px');assert.equal(image.style.maxHeight,'600px');
  await click('.roster-detail-art .art-zoom-trigger');assert.ok(document.querySelector('.image-lightbox[open]'));await act(async()=>document.querySelector('.image-lightbox').dispatchEvent(new Event('cancel',{cancelable:true})));assert.ok(document.querySelector('.roster-character-dialog[open]'));assert.equal(document.documentElement.style.overflow,'hidden');
  const before=document.querySelector('.roster-detail-caption h2').textContent;await click('.roster-character-navigation button:last-child');assert.notEqual(document.querySelector('.roster-detail-caption h2').textContent,before);
  await act(async()=>document.querySelector('.roster-character-dialog').dispatchEvent(new Event('cancel',{cancelable:true})));assert.equal(document.querySelector('dialog'),null);assert.equal(document.documentElement.style.overflow,'');assert.equal(document.activeElement,opener);
  const detailCount=requests.filter(u=>u.searchParams.has('id')).length;await act(async()=>root.unmount());await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Panel,{gameId:data.gameId,locale:'ko',region:'jp'}));await new Promise(setImmediate)});assert.equal(document.querySelectorAll('.roster-card').length,data.characters.length);await click('.roster-card');assert.equal(requests.filter(u=>u.searchParams.has('id')).length,detailCount);assert.ok(document.querySelectorAll('.roster-stats dd').length>0);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
