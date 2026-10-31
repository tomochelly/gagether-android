import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
// ReactDOM detects native input support when loaded; provide a DOM before importing it.
const eventDOM=new JSDOM('<!doctype html>');
Object.defineProperties(globalThis,{window:{value:eventDOM.window,configurable:true},document:{value:eventDOM.window.document,configurable:true},navigator:{value:eventDOM.window.navigator,configurable:true}});
const {createRoot}=await import('react-dom/client');
import {catalog} from './fixtures/wuwa-convene-fixture.mjs';
registerHooks({load(url,context,next){if(url.endsWith('/components/wuwa-convene.css'))return {format:'module',source:'',shortCircuit:true};return next(url,context);}});
const {default:Simulator}=await import('../components/wuwa-convene.tsx');
const {emptyConveneState,CONVENE_KEY}=await import('../lib/wuwa-convene.ts');
const {conveneCopy}=await import('../lib/wuwa-convene-copy.ts');
const {characterConveneClips}=await import('../lib/wuwa-convene-media.ts');
const {CONVENE_COST_KEY}=await import('../lib/wuwa-convene-cost.ts');
async function mount(saved,costRaw){
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko/games/wuwa/convene',pretendToBeVisual:true});
 const names=['window','document','navigator','localStorage','matchMedia','devicePixelRatio','IS_REACT_ACT_ENVIRONMENT'];const descriptors=new Map(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)]));
 Object.defineProperties(globalThis,{window:{value:dom.window,configurable:true},document:{value:dom.window.document,configurable:true},navigator:{value:dom.window.navigator,configurable:true},localStorage:{value:dom.window.localStorage,configurable:true},matchMedia:{value:()=>({matches:false,addEventListener(){},removeEventListener(){}}),configurable:true},devicePixelRatio:{value:1,configurable:true},IS_REACT_ACT_ENVIRONMENT:{value:true,configurable:true}});
 dom.window.HTMLMediaElement.prototype.play=function(){return Promise.resolve();};dom.window.HTMLMediaElement.prototype.pause=function(){};dom.window.HTMLMediaElement.prototype.load=function(){};
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 if(saved!==undefined)localStorage.setItem(CONVENE_KEY,saved);if(costRaw!==undefined)localStorage.setItem(CONVENE_COST_KEY,costRaw);localStorage.setItem('gagether.personal-notes.v1','private-notes-fixture');
 let root=createRoot(document.getElementById('root'));await act(async()=>{root.render(React.createElement(Simulator,{locale:'ko',initialCatalog:catalog,copy:conveneCopy.ko}));});
 const click=async text=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);assert.ok(button,'button '+text);await act(async()=>{button.click();await Promise.resolve();});};
 return {dom,click,async unmount(){await act(async()=>root.unmount());dom.window.close();for(const [key,value]of descriptors){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}};
}
test('all four language screens label a fan simulation and disclose the probability model',()=>{
 for(const locale of ['ko','en','ja','zh']){const html=renderToStaticMarkup(React.createElement(Simulator,{locale,initialCatalog:catalog,copy:conveneCopy[locale]}));assert.ok(html.includes(conveneCopy[locale].tag));assert.ok(html.includes(conveneCopy[locale].draw10));assert.ok(html.includes(conveneCopy[locale].model));assert.ok(html.includes('data-')||html.includes('convene-stage'));assert.ok(!html.includes('account/sync'));}
});
test('mounted ten-pull double clicks commit once; skip, reveal and history never reroll or touch private notes',async()=>{
 const state={...emptyConveneState(),pity5:79,guaranteed5:true};const env=await mount(JSON.stringify(state));
 try{
  const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('10회 튜닝'));assert.ok(button&&!button.disabled);
  await act(async()=>{button.click();button.click();await Promise.resolve();});
  const saved=localStorage.getItem(CONVENE_KEY);const drawn=JSON.parse(saved);assert.equal(drawn.total,10);assert.equal(drawn.history.length,10);assert.ok(document.querySelector('.convene-signal.rarity-5'));assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'private-notes-fixture');
  await env.click('건너뛰기');assert.equal(document.querySelectorAll('.convene-result-card').length,10);assert.equal(localStorage.getItem(CONVENE_KEY),saved);
  await act(async()=>document.querySelector('.convene-result-card.rarity-5').click());assert.ok(document.querySelector('.phase-grade'));await act(async()=>document.querySelector('video').dispatchEvent(new env.dom.window.Event('ended')));assert.ok(document.querySelector('.convene-reveal.rarity-5'));assert.equal(localStorage.getItem(CONVENE_KEY),saved);
  await env.click('전체 결과');await env.click('튜닝 화면으로');await env.click('튜닝 기록');assert.equal(document.querySelectorAll('.convene-history>div').length,10);assert.equal(localStorage.getItem(CONVENE_KEY),saved);
 }finally{await env.unmount();}
});
test('malformed saved history remains untouched while an in-memory practice draw works',async()=>{
 const env=await mount('{malformed');
 try{assert.ok(document.querySelector('.convene-notice').textContent.includes('기존 기록을 보호'));await env.click('1회 튜닝×1');assert.equal(localStorage.getItem(CONVENE_KEY),'{malformed');assert.ok(document.querySelector('.convene-signal'));assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'private-notes-fixture');}finally{await env.unmount();}
});
test('guarantee settings preserve inventory and explicit reset clears only simulator data',async()=>{
 const env=await mount(JSON.stringify({...emptyConveneState(),owned:{'weapon:three':1},total:27,pity5:27}));
 try{
  await act(async()=>document.querySelector('button[aria-label="시작 상태"]').click());
  const checkbox=document.querySelector('.convene-settings input[type="checkbox"]');
  await act(async()=>checkbox.click());
  await env.click('적용');let saved=JSON.parse(localStorage.getItem(CONVENE_KEY));assert.equal(saved.total,27);assert.equal(saved.owned['weapon:three'],1);assert.equal(saved.guaranteed5,true);
  assert.equal(document.querySelector('.convene-pity>b').textContent,'27 / 80');await env.click('체험 기록 초기화');assert.equal(JSON.parse(localStorage.getItem(CONVENE_KEY)).total,27);await env.click('취소');assert.equal(JSON.parse(localStorage.getItem(CONVENE_KEY)).total,27);await env.click('체험 기록 초기화');await env.click('초기화');saved=JSON.parse(localStorage.getItem(CONVENE_KEY));assert.equal(saved.total,0);assert.deepEqual(saved.owned,{});assert.equal(saved.pity5,0);assert.equal(saved.guaranteed5,false);assert.equal(document.querySelector('.convene-pity>b').textContent,'0 / 80');assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'private-notes-fixture');
 }finally{await env.unmount();}
});

test('video and audio load only after a committed draw; media ending or failure cannot reroll',async()=>{
 const env=await mount(JSON.stringify({...emptyConveneState(),pity5:79,guaranteed5:true}));
 try{assert.equal(document.querySelectorAll('video,audio').length,0);await env.click('1회 튜닝×1');const stored=localStorage.getItem(CONVENE_KEY),video=document.querySelector('video');assert.ok(video);assert.match(video.src,/\/api\/wuwa\/convene-media\/[a-f0-9]{64}$/);assert.equal(video.muted,false);
 await act(async()=>video.dispatchEvent(new env.dom.window.Event('playing')));assert.ok(video.classList.contains('is-playing'));await act(async()=>video.dispatchEvent(new env.dom.window.Event('ended')));assert.ok(document.querySelector('.phase-grade'));await act(async()=>document.querySelector('video').dispatchEvent(new env.dom.window.Event('ended')));assert.ok(document.querySelector('.convene-reveal.rarity-5'));assert.equal(document.querySelectorAll('video').length,0);assert.equal(video.getAttribute('src'),null);assert.equal(localStorage.getItem(CONVENE_KEY),stored);
 await env.click('튜닝 화면으로');await env.click('10회 튜닝×10');const storedAgain=localStorage.getItem(CONVENE_KEY),next=document.querySelector('video');await act(async()=>next.dispatchEvent(new env.dom.window.Event('error')));assert.equal(document.querySelectorAll('video').length,0);await env.click('건너뛰기');assert.equal(document.querySelectorAll('.convene-result-card').length,10);assert.equal(localStorage.getItem(CONVENE_KEY),storedAgain);assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'private-notes-fixture');
 }finally{await env.unmount();}
});

test('committed results, pity and inventory stay concealed throughout both video phases; revealed items stay chronological',async()=>{
 const cryptoDescriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues(a){a[0]=Math.floor(.99*4294967296);return a;}}});
 const clip={characterId:'a',sha256:'f'.repeat(64),bytes:1,duration:1,width:1920,height:1080,contentType:'video/mp4',sourceUrl:'https://example.test'};
 characterConveneClips.push(clip);
 const env=await mount(JSON.stringify({...emptyConveneState(),pity5:77,guaranteed5:true}));
 try{
  await env.click('10회 튜닝×10');const stored=localStorage.getItem(CONVENE_KEY);assert.equal(JSON.parse(stored).total,10);
  assert.equal(document.querySelector('.convene-top').getAttribute('aria-hidden'),'true');assert.equal(document.querySelector('.convene-bottom').getAttribute('aria-hidden'),'true');assert.equal(document.querySelector('.convene-stat>b').textContent,'0');assert.equal(document.querySelector('.convene-pity>b').textContent,'77 / 80');assert.equal(document.querySelector('.convene-reveal'),null);
  const beam=document.querySelector('video');await act(async()=>{beam.currentTime=6;beam.dispatchEvent(new env.dom.window.Event('timeupdate'));});
  assert.equal(document.querySelector('.phase-grade'),null);assert.equal(document.querySelector('.convene-reveal h2').textContent,'weapon:three');assert.equal(document.querySelector('.convene-bottom').getAttribute('aria-hidden'),'true');
  await act(async()=>document.querySelector('button[aria-label="다음"]').click());assert.ok(document.querySelector('.phase-grade'));const stars=document.querySelector('video');await act(async()=>stars.dispatchEvent(new env.dom.window.Event('loadedmetadata')));assert.equal(stars.currentTime,6);assert.equal(stars.muted,false);assert.equal(document.querySelector('.convene-reveal'),null);await act(async()=>stars.dispatchEvent(new env.dom.window.Event('ended')));assert.ok(document.querySelector('.phase-character'));assert.equal(document.querySelector('.convene-reveal'),null);assert.equal(document.querySelector('.convene-top').getAttribute('aria-hidden'),'true');assert.ok(document.querySelector('video').src.endsWith(clip.sha256));
  await act(async()=>document.querySelector('video').dispatchEvent(new env.dom.window.Event('ended')));assert.equal(document.querySelector('.convene-reveal h2').textContent,'character:a');
  await env.click('등장 연출 다시보기');assert.ok(document.querySelector('.phase-grade'));await env.click('건너뛰기');await env.click('전체 결과');assert.equal(document.querySelectorAll('.convene-result-card').length,10);assert.equal(document.querySelector('.convene-stat>b').textContent,'10');assert.equal(localStorage.getItem(CONVENE_KEY),stored);assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'private-notes-fixture');
 }finally{await env.unmount();characterConveneClips.pop();if(cryptoDescriptor)Object.defineProperty(globalThis,'crypto',cryptoDescriptor);else delete globalThis.crypto;}
});
test('cash estimates are editable without changing draws or private records; malformed preferences stay protected',async()=>{
 const env=await mount(JSON.stringify({...emptyConveneState(),total:10}));
 try{
  const before=localStorage.getItem(CONVENE_KEY);await act(async()=>document.querySelector('button[aria-label="환산 기준"]').click());assert.ok(document.querySelector('.convene-dialog').textContent.includes('실제 결제액은 아니며'));assert.equal(document.querySelector('.convene-cost-source a'),null);
  const inputs=[...document.querySelectorAll('.convene-settings input')];await act(async()=>{const set=Object.getOwnPropertyDescriptor(env.dom.window.HTMLInputElement.prototype,'value').set;set.call(inputs[0],'100');inputs[0].dispatchEvent(new env.dom.window.Event('input',{bubbles:true}));inputs[0].dispatchEvent(new env.dom.window.Event('change',{bubbles:true}));});
  await env.click('적용');assert.equal(JSON.parse(localStorage.getItem(CONVENE_COST_KEY)).packPrice,100);assert.equal(localStorage.getItem(CONVENE_KEY),before);assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'private-notes-fixture');
  await env.click('체험 기록 초기화');await env.click('초기화');assert.equal(document.querySelector('.convene-resource b').textContent,'0');assert.ok(localStorage.getItem(CONVENE_COST_KEY));
 }finally{await env.unmount();}
});

test('broken or future cash preferences are never silently overwritten by an edit',async()=>{
 const raw='{"version":99,"private":"fixture"}',env=await mount(undefined,raw);
 try{await act(async()=>document.querySelector('button[aria-label="환산 기준"]').click());assert.ok(document.querySelector('.convene-dialog').textContent.includes('이번 화면에만'));await env.click('적용');assert.equal(localStorage.getItem(CONVENE_COST_KEY),raw);assert.equal(localStorage.getItem('gagether.personal-notes.v1'),'private-notes-fixture');}finally{await env.unmount();}
});

test('raw pool source links mount only after explicit source disclosure and disappear when collapsed',async()=>{
 const original=catalog.poolSources;catalog.poolSources=['https://github.com/source/fixture-research'];const env=await mount();
 try{await env.click('튜닝 규칙');const details=[...document.querySelectorAll('.convene-rules details')].find(d=>d.querySelector('summary').textContent===conveneCopy.ko.pool);assert.equal(details.querySelectorAll('a').length,0);await act(async()=>{details.open=true;details.dispatchEvent(new env.dom.window.Event('toggle'));});assert.equal(details.querySelectorAll('a').length,1);await act(async()=>{details.open=false;details.dispatchEvent(new env.dom.window.Event('toggle'));});assert.equal(details.querySelectorAll('a').length,0);assert.equal(localStorage.getItem(CONVENE_KEY),null);}
 finally{await env.unmount();catalog.poolSources=original;}
});
