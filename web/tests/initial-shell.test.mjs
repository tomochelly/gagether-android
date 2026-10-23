import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {emptyCatalog,isInitialShellRequest}=await import('../lib/initial-shell.ts');
const {packCatalog}=await import('../lib/catalog-transport.ts');
const {default:Radar}=await import('../components/radar.tsx');
const {byId}=await import('../lib/games.ts');
let reads=0;
globalThis.__shellEnv={DB:{prepare(){reads++;throw Error('Catalog is deliberately unavailable')}}};
globalThis.__shellLocale='ko';
registerHooks({resolve(specifier,context,next){
 if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.__shellEnv',shortCircuit:true};
 if(specifier==='next/headers')return {url:'data:text/javascript,export async function cookies(){return {get:()=>undefined}};export async function headers(){return new Headers({"accept-language":globalThis.__shellLocale})}',shortCircuit:true};
 return next(specifier,context);
}});
const {default:Home}=await import('../app/page.tsx');
const {default:Mobile}=await import('../app/mobile/page.tsx');

test('web/mobile frames render all four languages even when the database is unavailable',async()=>{
 for(const locale of ['ko','en','ja','zh'])for(const page of [Home,Mobile]){
  globalThis.__shellLocale=locale;
  const result=await page({searchParams:Promise.resolve({})});
  const markup=renderToString(result);
  assert.match(markup,/data-catalog-state="shell"/);
  assert.match(markup,/class="sidebar ?"/);
  assert.match(markup,/catalog-pending/);
  assert.equal((markup.match(/class="game-nav-link"/g)||[]).length,18);
  assert.doesNotMatch(markup,/class="ambient"|id="S:|empty-state/);
  assert.ok(Buffer.byteLength(markup)<80000,Buffer.byteLength(markup));
 }
 assert.equal(reads,0);
 assert.equal(isInitialShellRequest(new Request('https://example.test/')),true);
 for(const path of ['/owner','/api/data','/?entry=record'])assert.equal(isInitialShellRequest(new Request('https://example.test'+path)),false);
});

test('navigation works while data is pending; retry loads compact data without resetting the selected game',async()=>{
 const props={initialData:emptyCatalog(),initialPending:true,initialDeferred:true,initialComplete:false,initialLocale:'ko',initialLocaleManual:true};
 const markup=renderToString(React.createElement(Radar,props));
 const dom=new JSDOM('<div id="root">'+markup+'</div>',{url:'https://example.test/',pretendToBeVisual:true}),saved=new Map();
 const replace=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true})};
 for(const key of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','localStorage','sessionStorage'])replace(key,dom.window[key]);
 replace('IS_REACT_ACT_ENVIRONMENT',true);
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};
 HTMLDialogElement.prototype.close=function(){this.open=false};
 replace('ResizeObserver',class{observe(){} disconnect(){}});replace('setInterval',()=>1);replace('clearInterval',()=>{});
 const snapshots=new Map();
 replace('caches',{open:async()=>({match:async key=>snapshots.get(key)?.clone(),put:async(key,response)=>snapshots.set(key,response)})});
 let requests=0,resolveData,rejectData;
 replace('fetch',async path=>{
  if(String(path).startsWith('/api/data')){requests++;return new Promise((resolve,reject)=>{resolveData=resolve;rejectData=reject})}
  return {ok:true,status:200,json:async()=>String(path).startsWith('/api/favorites')?{counts:{},revision:0}:{canEdit:false,channels:[]}};
 });
 const recovered=[];let root;
 try{
  await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Radar,props),{onRecoverableError:e=>recovered.push(e.message)})});
  assert.equal(requests,1);assert.ok(document.querySelector('.catalog-pending'));
  await act(async()=>document.querySelector(`.game-nav-link[title="${byId.zzz.name.ko}"]`).click());
  assert.equal(document.querySelector('.breadcrumb strong').textContent,byId.zzz.name.ko);
  await act(async()=>rejectData(Error('Offline')));
  assert.equal(document.querySelector('.catalog-pending-status button').textContent,'다시 시도');
  await act(async()=>document.querySelector('.catalog-pending-status button').click());
  assert.equal(requests,2);
  const title={ko:'검수된 이벤트',en:'Reviewed event',ja:'確認済みイベント',zh:'已核实活动'};
  const entry={id:'shell-zzz',gameId:'zzz',region:'global',kind:'event',title,summary:title,startAt:null,endAt:null,publishedAt:null,verifiedAt:'2026-10-21T00:00:00Z',sourceUrl:'https://zenless.hoyoverse.com/',sourceTitle:'Official'};
  await act(async()=>resolveData({ok:true,status:200,headers:new Headers(),json:async()=>packCatalog({...emptyCatalog(),persistent:true,entries:[entry],settings:{brand:{name:'Owner brand'}}})}));
  assert.equal(document.querySelector('.catalog-pending'),null);
  assert.equal(document.querySelector('.breadcrumb strong').textContent,byId.zzz.name.ko);
  assert.ok(document.body.textContent.includes('검수된 이벤트'));
  assert.ok(document.querySelector('.brand').textContent.includes('Owner brand'));
  assert.deepEqual(recovered,[]);
  // A second visit paints the last good catalog while its new request is pending.
  await act(async()=>root.unmount());document.getElementById('root').innerHTML=markup;
  await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Radar,props),{onRecoverableError:e=>recovered.push(e.message)})});
  assert.equal(document.querySelector('.catalog-pending'),null);
  assert.ok(document.querySelector('.brand').textContent.includes('Owner brand'));
  assert.ok(document.querySelector('.catalog-recheck').textContent.includes('저장된 정보'));
  await act(async()=>rejectData(Error('Network unavailable')));
  assert.equal(document.querySelector('.catalog-pending'),null);
  assert.ok(document.querySelector('.brand').textContent.includes('Owner brand'));
  assert.ok(document.querySelector('.catalog-recheck').textContent.includes('마지막으로 받은 정보'));
  assert.deepEqual(recovered,[]);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[key,d]of saved){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key]}}
});
