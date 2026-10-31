import './load-typescript.mjs';import{test}from'node:test';import assert from'node:assert/strict';import React,{act}from'react';import{JSDOM}from'jsdom';
const {default:Companion}=await import('../components/mobile-companion.tsx'),{CatalogContext}=await import('../components/catalog-context.tsx'),{catalogGames,catalogUi}=await import('../lib/editorial.ts'),{mobileDefaults}=await import('../lib/mobile.ts');
test('three newer favorites reach the 1.0.4 widget bridge only after preferences load, without replacing My games',async()=>{
 const d=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/mobile',pretendToBeVisual:true}),old=new Map(),set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};for(const k of ['window','document','HTMLElement','Element','Node','Event','CustomEvent'])set(k,d.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('fetch',async()=>({ok:true,json:async()=>({schemaVersion:1,webRevision:'development',revision:'fixture',entries:[]})}));
 const sent=[],favorites=['limbus','dna','holodreams'],games=catalogGames({}),noop=()=>{};let favoriteWrites=0;window.PatchworkNative={onmessage:null,postMessage:s=>sent.push(JSON.parse(s))};const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 const render=ready=>React.createElement(CatalogContext.Provider,{value:{games,t:catalogUi('ko',{}),byId:Object.fromEntries(games.map(g=>[g.id,g])),settings:{},simpleMode:false,canEdit:false,editMode:false,openEditor:noop}},React.createElement(Companion,{locale:'ko',open:true,onClose:noop,onData:noop,favorites:ready?favorites:[],favoriteRegions:{},favoriteRegion:'kr',preferencesReady:ready,onFavorites:()=>favoriteWrites++,onFavoriteRegions:noop}));
 try{
  await act(async()=>root.render(render(false)));
  await act(async()=>window.PatchworkNative.onmessage({data:JSON.stringify({type:'state',appVersion:'1.0.4',reminderConfigVersion:4,supportedGameIds:games.filter(g=>!g.launch).map(g=>g.id),preferences:{...mobileDefaults('ko'),followMyGames:undefined,games:[]}})}));
  assert.equal(sent.filter(m=>m.type==='preferences').length,0);
  await act(async()=>root.render(render(true)));let p=sent.filter(m=>m.type==='preferences').at(-1).payload;
  assert.deepEqual(p.games,favorites);assert.deepEqual(p.gameRegions,{limbus:'global',dna:'global',holodreams:'global'});assert.equal(p.region,'kr');assert.equal(favoriteWrites,0);
  assert.equal(document.querySelectorAll('.companion-games input:checked').length,3);
  assert.equal(document.querySelectorAll('.companion-games>div').length,18);
  sent.length=0;await act(async()=>window.PatchworkNative.onmessage({data:JSON.stringify({type:'state',appVersion:'1.0.4',reminderConfigVersion:4,supportedGameIds:games.filter(g=>!g.launch).map(g=>g.id),preferences:{...mobileDefaults('ko'),followMyGames:false,games:['wuwa']}})}));assert.equal(sent.filter(m=>m.type==='preferences').length,0,'explicit custom selection is retained');
  assert.equal(sent.filter(m=>m.type==='pushAudience').length,0,'unrelated broadcast push is never sent by the old bridge');
 }finally{await act(async()=>root.unmount());d.window.close();for(const[k,v]of old){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
