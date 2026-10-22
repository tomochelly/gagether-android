import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {default:VersionHero}=await import('../components/version-hero.tsx');
const {games}=await import('../lib/games.ts');
const {previewGeometry,previewFocus,versionPreviewAnchor}=await import('../lib/artwork.ts');
test('version headers use a filled, native-limited face crop across every game',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','Element','HTMLElement','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 const observers=new Set();set('ResizeObserver',class{constructor(cb){this.cb=cb;observers.add(this)}observe(){}disconnect(){observers.delete(this)}});
 const root=createRoot(document.getElementById('root'));
 try{
  for(const game of games){
   const image=game.id==='umamusume'?'/assets/versions/uma-island-kv.jpg':'/fixture/'+game.id+'.png';
   const entry={id:game.id,gameId:game.id,region:game.regions[0],kind:'update',title:{ko:'버전',en:'Version',ja:'バージョン',zh:'版本'},image,imageVerified:true,imageLocale:'neutral',imageKind:'banner',versionHero:true};
   await act(async()=>root.render(React.createElement(VersionHero,{entry,game,region:entry.region,locale:'ko',onOpen(){}})));
   const img=document.querySelector('.version-hero-art img');
   Object.defineProperties(img,{naturalWidth:{value:2880,configurable:true},naturalHeight:{value:1620,configurable:true}});
   await act(async()=>{for(const o of observers)o.cb([{contentRect:{width:1100,height:340}}]);img.dispatchEvent(new Event('load'));});
   assert.ok(parseFloat(img.style.width)>=1100,game.id+' must fill width rather than contain the entire poster');
   assert.ok(parseFloat(img.style.width)<=2880,game.id+' must preserve native pixel limit');
   assert.equal(img.getAttribute('src'),image,'source must stay unchanged');
   assert.equal(img.closest('.art-media').classList.contains('version-art-inset'),false,'large originals retain their existing treatment');
   if(game===games[0]){
    Object.defineProperties(img,{naturalWidth:{value:600,configurable:true},naturalHeight:{value:600,configurable:true}});
    Object.defineProperty(window,'devicePixelRatio',{value:2,configurable:true});
    await act(async()=>{img.dispatchEvent(new Event('load'));window.dispatchEvent(new Event('resize'));});
    await act(async()=>{for(const o of observers)o.cb([{contentRect:{width:660,height:340}}]);});
    assert.equal(parseFloat(img.style.width),300,'sharp pixels survive browser zoom / monitor changes');
    assert.ok(parseFloat(img.parentElement.style.left)>=350,'poster moves beside the copy instead of floating in the middle');
    assert.ok(img.closest('.art-media').classList.contains('version-art-inset'),'a small native original activates its continuous softened backdrop');
    await act(async()=>{for(const o of observers)o.cb([{contentRect:{width:2000,height:340}}]);});
    assert.ok(parseFloat(img.parentElement.style.left)<1200,'the small original moves toward the copy on wide screens');
    assert.equal(parseFloat(img.style.width),300,'moving the original never enlarges its pixels');
    Object.defineProperty(window,'devicePixelRatio',{value:1,configurable:true});
    await act(async()=>window.dispatchEvent(new Event('resize')));
   }
  }
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});

test('only native-limited wide version headers move inward',()=>{
 for(const image of [{width:600,height:600},{width:1200,height:675}]){
  const box={width:2000,height:340},focus={x:50,y:32,zoom:1};
  for(const dpr of [1,1.5,2]){
   const anchor=versionPreviewAnchor(image,box,dpr);
   const rect=previewGeometry(image,box,focus,dpr,undefined,anchor);
   const old=previewGeometry(image,box,focus,dpr,undefined,.8);
   assert.equal(anchor,.64);assert.ok(rect.left<old.left);
   assert.ok(rect.width*dpr<=image.width+.001);
  }
 }
 assert.equal(versionPreviewAnchor({width:3840,height:2160},{width:2000,height:340},1.5),.8,'Wuthering Waves and NIKKE 4K art keep their existing crop');
 assert.equal(versionPreviewAnchor({width:600,height:600},{width:660,height:340},2),.8,'narrow desktop copy keeps its space');
 assert.equal(versionPreviewAnchor({width:600,height:600},{width:390,height:400},2),.5,'phones retain centered composition');
});
test('reviewed face anchor stays visible, owner focus wins, and high-DPI previews never upscale',()=>{
 const image='/assets/versions/uma-island-kv.jpg',focus=previewFocus({image});
 assert.equal(focus.y,30);
 const g=previewGeometry({width:2880,height:1620},{width:1600,height:340},focus);
 assert.equal(g.width,1600);assert.ok(g.top+g.height*focus.y/100>0&&g.top+g.height*focus.y/100<340);
 const owner={x:70,y:42,zoom:1.2};assert.deepEqual(previewFocus({image,previewFocus:owner}),owner);
 for(const ratio of [1,2,3]){
  const rect=previewGeometry({width:600,height:600},{width:1400,height:340},focus,ratio);
  assert.ok(rect.width<=600/ratio&&rect.height<=600/ratio);
 }
});

test('shared-width banners keep source pixels sharp on mobile through 4K viewports',()=>{
 for(const image of [{width:600,height:600},{width:1200,height:675},{width:1200,height:630}]){
  for(const viewport of [390,1280,1920,3840])for(const ratio of [1,1.5,2,3]){
   const box={width:viewport,height:340};
   const rect=previewGeometry(image,box,{x:50,y:32,zoom:1},ratio,undefined,box.width>600?.8:.5);
   assert.ok(rect.width*ratio<=image.width+.001);
   assert.ok(rect.height*ratio<=image.height+.001);
   assert.ok(rect.left+rect.width*.5>=0&&rect.left+rect.width*.5<=box.width);
  }
 }
});
