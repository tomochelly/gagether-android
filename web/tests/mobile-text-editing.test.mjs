import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToString,renderToStaticMarkup} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {drawerGesture}=await import('../lib/mobile-drawer.ts');
const {default:Radar}=await import('../components/radar.tsx');
const {default:DetailCopy}=await import('../components/detail-copy.tsx');
const {default:ContentBlocks}=await import('../components/content-blocks.tsx');
const {emptyCatalog}=await import('../lib/initial-shell.ts');
const {entrySchema}=await import('../lib/content-schema.ts');
const {displaySummary}=await import('../lib/content-display.ts');
const {entryDiff}=await import('../lib/inline-edit.ts');
const blank={ko:'',en:'',ja:'',zh:''};
const item={id:'owner-text-style',gameId:'limbus',region:'global',server:'Global',kind:'event',title:{...blank,ko:'첫째 줄\n둘째 줄'},summary:{...blank,ko:'첫 줄\r\n\r\n  들여쓴 다음 줄\n끝'},sourceTitle:'Notice',sourceUrl:'https://store.steampowered.com/news/app/1973530',publishedAt:null,startAt:null,endAt:null,verifiedAt:'2026-10-24T00:00:00Z',editor:{revision:1,fields:['title','summary'],updatedAt:'2026-10-24T00:00:00Z'}};
test('only deliberate mobile edge swipes open and inside swipes close; vertical, desktop and editing gestures are ignored',()=>{
 const start={x:8,y:100,at:0,open:false};assert.equal(drawerGesture(start,{x:110,y:108,at:200},390),'open');assert.equal(drawerGesture(start,{x:10,y:270,at:200},390),null);assert.equal(drawerGesture({...start,x:90},{x:190,y:108,at:200},390),null);assert.equal(drawerGesture(start,{x:110,y:108,at:200},1440),null);assert.equal(drawerGesture(start,{x:110,y:108,at:200},390,true),null);assert.equal(drawerGesture({...start,x:190,open:true},{x:80,y:108,at:200},390),'close');
});
test('owner Enter, blank lines, indentation and escaped text survive display; per-language typography validates and roundtrips',()=>{
 const e={...item,textStyle:{ko:{titleSize:24,bodySize:17,lineHeight:1.8},ja:{titleSize:20}},contentBlocks:[{id:'body',type:'text',body:{...blank,ko:'<img src=x onerror=alert(1)>\n\n A'},textStyle:{ko:{bodySize:18}}}]};
 assert.deepEqual(entrySchema.parse(e).textStyle,e.textStyle);assert.equal(displaySummary(e,'ko'),'첫 줄\n\n  들여쓴 다음 줄\n끝');
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(DetailCopy,{text:displaySummary(e,'ko'),locale:'ko',preserve:true,appearance:e.textStyle.ko})));assert.equal(dom.window.document.querySelectorAll('.detail-copy-line').length,4);assert.equal(dom.window.document.querySelectorAll('.detail-copy-line')[2].textContent,'  들여쓴 다음 줄');assert.equal(dom.window.document.querySelector('.detail-copy').style.fontSize,'17px');dom.window.close();
 const html=renderToStaticMarkup(React.createElement(ContentBlocks,{entry:e,locale:'ko'}));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src="x"'));
 const draft={...e,textStyle:{...e.textStyle,ja:{titleSize:22}}};assert.equal(entryDiff(e,draft).changes.textStyle.ko.bodySize,17);assert.equal(entryDiff(e,draft).changes.textStyle.ja.titleSize,22);
 assert.equal(entrySchema.safeParse({...e,textStyle:{ko:{titleSize:999}}}).success,false);assert.equal(entrySchema.safeParse({...e,textStyle:{ko:{fontFamily:'url(javascript:evil)'}}}).success,false);
});
for(const appMode of [false,true])test(`real mounted ${appMode?'app':'web'} drawer supports swipe, inert background, Escape and scroll restoration`,async()=>{
 const props={appMode,initialLocale:'ko',initialLocaleManual:true,initialData:{...emptyCatalog(),persistent:true,serverTime:new Date().toISOString()},initialComplete:true};const dom=new JSDOM('<div id="root">'+renderToString(React.createElement(Radar,props))+'</div>',{url:'https://gagether.wiki/ko',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','CustomEvent','localStorage','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});set('setInterval',()=>1);set('clearInterval',()=>{});
 Object.defineProperty(window,'innerWidth',{value:390,configurable:true});const mediaListeners=[];const media={matches:true,addEventListener(_t,fn){mediaListeners.push(fn)},removeEventListener(){}};window.matchMedia=q=>q.includes('1100')?media:{matches:false,addEventListener(){},removeEventListener(){}};window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};Element.prototype.scrollIntoView=()=>{};for(const m of ['show','showModal','close'])HTMLDialogElement.prototype[m]=function(){this.open=m!=='close';};
 set('fetch',async url=>({ok:true,status:200,headers:new Headers(),json:async()=>String(url).startsWith('/api/favorites')?{counts:{},revision:0}:String(url).startsWith('/api/social')?{channels:[]}:{canEdit:false}}));
 const touch=(target,type,x,y)=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,type==='touchend'?'changedTouches':'touches',{value:[{clientX:x,clientY:y}]});target.dispatchEvent(e);};let root;
 try{await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Radar,props));});const workspace=document.querySelector('.workspace');
  await act(async()=>{touch(workspace,'touchstart',8,100);touch(document,'touchmove',10,270);touch(document,'touchend',10,270);});assert.ok(!document.querySelector('.sidebar.is-open'));
  await act(async()=>{touch(workspace,'touchstart',8,100);touch(document,'touchmove',115,105);touch(document,'touchend',115,105);});assert.ok(document.querySelector('.sidebar.is-open'));assert.ok(workspace.hasAttribute('inert'));assert.equal(document.body.style.overflow,'hidden');assert.equal(document.querySelector('.sidebar').getAttribute('aria-modal'),'true');
  const nested=document.createElement('dialog');nested.open=true;document.body.appendChild(nested);await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.ok(document.querySelector('.sidebar.is-open'),'native modal handles its own Escape');nested.remove();await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.ok(!document.querySelector('.sidebar.is-open'));assert.equal(document.body.style.overflow,'');assert.ok(!workspace.hasAttribute('inert'));
  const input=document.querySelector('.search-box input');await act(async()=>{touch(input,'touchstart',8,100);touch(document,'touchend',115,105);});assert.ok(!document.querySelector('.sidebar.is-open'));
  await act(async()=>document.querySelector('.mobile-menu').click());assert.ok(document.querySelector('.sidebar.is-open'));Object.defineProperty(window,'innerWidth',{value:1440,configurable:true});await act(async()=>{media.matches=false;mediaListeners.forEach(fn=>fn());});assert.ok(!document.querySelector('.sidebar.is-open'));assert.ok(!workspace.hasAttribute('inert'));assert.equal(document.body.style.overflow,'');
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
