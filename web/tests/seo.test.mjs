import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {renderToString} from 'react-dom/server';import {hydrateRoot} from 'react-dom/client';import {JSDOM} from 'jsdom';
const {default:sitemap}=await import('../app/sitemap.ts');const {catalogMetadata}=await import('../lib/seo.ts');const {catalogPath,catalogLocation,catalogLocaleHeaders,supportedLocales}=await import('../lib/catalog-paths.ts');const {games,byId}=await import('../lib/games.ts');const {default:Radar}=await import('../components/radar.tsx');const {emptyCatalog}=await import('../lib/initial-shell.ts');
test('65 discoverable URLs have reciprocal language links and self canonicals',()=>{
 const pages=sitemap();assert.equal(pages.length,65);assert.equal(new Set(pages.map(p=>p.url)).size,65);
 for(const locale of supportedLocales)for(const game of [undefined,...games]){
  const meta=catalogMetadata(locale,game?{id:game.id,name:game.name[locale]}:undefined);const url='https://gagether.wiki'+catalogPath(locale,game?.id);assert.equal(meta.alternates.canonical,url);assert.equal(meta.alternates.languages[locale],url);assert.equal(pages.find(p=>p.url===url).alternates.languages[locale],url);
  assert.ok(meta.description.length>30);assert.equal(meta.robots.index,true);assert.equal(meta.keywords,undefined);if(game)assert.ok(meta.title.includes(game.name[locale]));
  assert.deepEqual(catalogLocation(catalogPath(locale,game?.id)),{locale,gameId:game?.id});
 }
 assert.equal(catalogMetadata('ja',{id:'umamusume',name:'ウマ娘'},false,'kr').alternates.canonical,'https://gagether.wiki/ja/games/umamusume?region=kr');
 assert.match(catalogMetadata('en').title,/Gacha Banner Calendar/);assert.match(catalogMetadata('ja').title,/ガチャ/);
 assert.equal(catalogLocation('/owner'),null);assert.equal(catalogLocation('/en/games/../owner'),null);assert.equal(catalogLocation('/fr'),null);
 assert.ok(pages.every(p=>!p.lastModified&&!/\/api\/|\/account|\/owner/.test(p.url)),'no invented content refresh times or private routes');
});
test('explicit catalog language is derived from the URL and discards spoofed hints',()=>{
 for(const locale of supportedLocales){
  const request=new Request('https://gagether.wiki/'+locale+'/games/hsr',{headers:{'x-gagether-route-locale':'ja',cookie:'patchwork.locale=ko','x-patchwork-country':'JP'}});
  const headers=catalogLocaleHeaders(request);assert.equal(headers.get('x-gagether-route-locale'),locale);assert.equal(headers.get('cookie'),'patchwork.locale=ko');
 }
 assert.equal(catalogLocaleHeaders(new Request('https://gagether.wiki/',{headers:{'x-gagether-route-locale':'en'}})).get('x-gagether-route-locale'),null);
 assert.equal(catalogLocaleHeaders(new Request('https://gagether.wiki/owner',{headers:{'x-gagether-route-locale':'en'}})).get('x-gagether-route-locale'),null);
});
test('localized game SSR includes actual stored content and crawlable game/language links',()=>{
 const titles={ko:'검수된 픽업',en:'Reviewed banner',ja:'確認済みピックアップ',zh:'已核实卡池'};
 for(const locale of supportedLocales){
  const entry={id:'seo-hsr',gameId:'hsr',region:'global',kind:'pickup',title:titles,summary:titles,startAt:'2026-10-01T00:00:00+09:00',endAt:'2026-11-01T00:00:00+09:00',publishedAt:null,verifiedAt:'2026-10-20T00:00:00Z',sourceUrl:'https://hsr.hoyoverse.com/',sourceTitle:'Official',officialLocales:['ko','en','ja','zh']};
  const html=renderToString(React.createElement(Radar,{initialLocale:locale,initialLocaleManual:true,initialView:'game',initialGameId:'hsr',initialRegion:'global',initialData:{...emptyCatalog(),persistent:true,serverTime:'2026-10-21T18:00:00Z',entries:[entry]},initialComplete:false,initialDeferred:true}));
  const dom=new JSDOM(html);assert.equal(dom.window.document.querySelector('.breadcrumb strong').textContent,byId.hsr.name[locale]);assert.ok(dom.window.document.body.textContent.includes(titles[locale]));assert.equal(dom.window.document.querySelectorAll('.game-nav-link[href]').length,15);assert.equal(dom.window.document.querySelectorAll('.site-language-links a[href]').length,4);assert.equal(dom.window.document.querySelector('.site-language-links a[hreflang="ja"]').getAttribute('href'),'/ja/games/hsr');dom.window.close();
 }
});
test('language links preserve an independently selected gameplay service',()=>{
 const html=renderToString(React.createElement(Radar,{initialLocale:'ja',initialLocaleManual:true,initialView:'game',initialGameId:'umamusume',initialRegion:'kr',initialData:{...emptyCatalog(),persistent:true,serverTime:new Date().toISOString()},initialComplete:false,initialDeferred:true}));
 const dom=new JSDOM(html);assert.equal(dom.window.document.querySelector('.site-language-links a[hreflang="en"]').getAttribute('href'),'/en/games/umamusume?region=kr');dom.window.close();
});
test('SPA navigation keeps shareable game/language addresses and back navigation without another catalog request',async()=>{
 const props={initialLocale:'en',initialLocaleManual:true,initialView:'game',initialGameId:'hsr',initialRegion:'global',initialData:{...emptyCatalog(),persistent:true,serverTime:new Date().toISOString()},initialComplete:false,initialDeferred:true};
 const markup=renderToString(React.createElement(Radar,props));const dom=new JSDOM('<head><link rel="canonical" href="https://gagether.wiki/en/games/hsr"><meta name="description"></head><body><div id="root">'+markup+'</div></body>',{url:'https://gagether.wiki/en/games/hsr',pretendToBeVisual:true}),saved=new Map();const set=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true})};
 for(const key of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','localStorage','sessionStorage'])set(key,dom.window[key]);set('IS_REACT_ACT_ENVIRONMENT',true);window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};HTMLDialogElement.prototype.close=function(){this.open=false};set('ResizeObserver',class{observe(){}disconnect(){}});set('setInterval',()=>1);set('clearInterval',()=>{});let catalogRequests=0;set('fetch',async path=>{if(String(path).startsWith('/api/data'))catalogRequests++;return {ok:true,status:200,json:async()=>String(path).startsWith('/api/favorites')?{counts:{},revision:0}:{canEdit:false,channels:[]}}});
 let root;const errors=[];
 try{
  localStorage.setItem('patchwork.preferences',JSON.stringify({locale:'ko',localeManual:true,region:'jp'}));
  await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Radar,props),{onRecoverableError:e=>errors.push(e.message)})});
  assert.equal(document.querySelector('.breadcrumb strong').textContent,byId.hsr.name.en);assert.equal(window.location.pathname,'/en/games/hsr');
  await act(async()=>document.querySelector('.game-nav-link[href="/en/games/zzz"]').click());assert.equal(window.location.pathname,'/en/games/zzz');assert.equal(document.querySelector('.breadcrumb strong').textContent,byId.zzz.name.en);assert.match(document.title,/Zenless/);
  await act(async()=>document.querySelector('.language-control button[title="日本語"]').click());assert.equal(window.location.pathname,'/ja/games/zzz');assert.match(document.title,/ゼンレス/);
  await act(async()=>{window.history.replaceState(null,'','/en/games/hsr');window.dispatchEvent(new window.PopStateEvent('popstate'))});assert.equal(document.querySelector('.breadcrumb strong').textContent,byId.hsr.name.en);assert.equal(catalogRequests,0);assert.deepEqual(errors,[]);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k]}}
});
