import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
const {default:ArtworkMedia}=await import('../components/artwork-media.tsx');
const {reviewedPickupArtwork,reviewedPickupArtworkRules:rules}=await import('../lib/reviewed-pickup-artwork.ts');
const rule=rules.find(r=>r.gameId==='holodreams'),loc=s=>({ko:s,en:s,ja:s,zh:s});
function rawEntry(){const name={...loc('exact card'),...rule.name},old={...rule.previous[0],imageVerified:true,imageLocale:'neutral',imageKind:'splash'};return{id:rule.entryId,gameId:rule.gameId,kind:'pickup',region:rule.region,sourceUrl:rule.sourceUrl,title:name,...old,pickupMembers:[{name,type:'new',role:'featured',...old}]};}

test('reviewed pickup thumbnails use card defaults with native DPR caps; saved owner and genuine full views retain existing behavior',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map(),set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});};
 for(const k of ['window','document','HTMLElement','Element','Node','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);Object.defineProperty(window,'devicePixelRatio',{value:3,configurable:true});
 let measure;set('ResizeObserver',class{constructor(fn){measure=fn}observe(){measure([{contentRect:{width:350,height:420}}]);}disconnect(){}});
 const {createRoot}=await import('react-dom/client');let root;
 async function load(width=1920,height=1080){await act(async()=>{const img=document.querySelector('.art-surface img');Object.defineProperties(img,{naturalWidth:{value:width,configurable:true},naturalHeight:{value:height,configurable:true}});img.dispatchEvent(new Event('load'));});}
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(ArtworkMedia,{art:rawEntry(),alt:'reviewed',fullThumbnail:true}));});await load();
  let surface=document.querySelector('.art-media'),img=document.querySelector('.art-surface img');assert.equal(surface.dataset.reviewedPickup,'native-default');assert.equal(surface.dataset.artFrame,'card');assert.equal(img.src,rule.asset.image);assert.ok(parseFloat(img.style.width)>350,'card default shows readable head/body instead of tiny complete landscape');assert.ok(parseFloat(img.style.width)<=640.001,'DPR3 source cap');
  await act(async()=>measure([{contentRect:{width:3840,height:2160}}]));img=document.querySelector('.art-surface img');assert.ok(parseFloat(img.style.width)<=640.001);
  for(const locale of ['en','ja','zh']){await act(async()=>root.render(React.createElement(ArtworkMedia,{art:rawEntry(),alt:locale,locale,fullThumbnail:true})));await load();assert.equal(document.querySelector('.art-surface img').src,rule.asset.image);}
  const projected=reviewedPickupArtwork(rawEntry()),owner={...projected,imageFraming:{card:{x:50,y:50,zoom:4,fit:'cover'}}};
  await act(async()=>root.render(React.createElement(ArtworkMedia,{art:owner,alt:'owner'})));await load();assert.equal(document.querySelector('.art-media').dataset.reviewedPickup,undefined);assert.ok(parseFloat(document.querySelector('.art-surface img').style.width)>640,'saved owner zoom is unchanged');
  await act(async()=>root.render(React.createElement(ArtworkMedia,{art:rawEntry(),alt:'full original',mode:'full'})));assert.equal(document.querySelector('.art-media').dataset.reviewedPickup,undefined);assert.equal(document.querySelector('img').src,rule.previous[0].image);assert.equal(document.querySelector('img').style.objectFit,'contain');
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
