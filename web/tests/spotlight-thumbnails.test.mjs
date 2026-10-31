import './load-typescript.mjs';
import{test}from'node:test';import assert from'node:assert/strict';import React,{act}from'react';import{JSDOM}from'jsdom';
const{default:ArtworkMedia}=await import('../components/artwork-media.tsx');
test('full banner thumbnails contain the exact localized original at desktop/mobile sizes while saved card crops remain independent',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map(),set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true})};
 for(const k of ['window','document','HTMLElement','Element','Node','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 let measure;set('ResizeObserver',class{constructor(fn){measure=fn}observe(){measure([{contentRect:{width:144,height:81}}])}disconnect(){}});
 const art={image:'https://example.org/original.webp',imageVerified:true,imageLocale:'neutral',imageFraming:{card:{x:20,y:40,zoom:2,fit:'cover'}},previewArtwork:{image:'https://example.org/cropped-preview.webp',imageVerified:true,imageLocale:'neutral'}};
 const original=JSON.stringify(art),{createRoot}=await import('react-dom/client');let root;
 const load=async()=>act(async()=>{const image=document.querySelector('.art-surface img');Object.defineProperties(image,{naturalWidth:{value:1600,configurable:true},naturalHeight:{value:900,configurable:true}});image.dispatchEvent(new Event('load'));});
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(ArtworkMedia,{art,alt:'Banner',fullThumbnail:true}));});await load();
  const check=(width,height)=>{const image=document.querySelector('.art-surface img'),surface=image.parentElement;assert.equal(image.src,art.image);assert.ok(Number.parseFloat(image.style.width)<=width+.01);assert.ok(Number.parseFloat(image.style.height)<=height+.01);assert.ok(Number.parseFloat(surface.style.left)>=-.01);assert.ok(Number.parseFloat(surface.style.top)>=-.01);};
  check(144,81);await act(async()=>measure([{contentRect:{width:104,height:58.5}}]));check(104,58.5);
  await act(async()=>root.render(React.createElement(ArtworkMedia,{art,alt:'Banner'})));await load();assert.ok(Number.parseFloat(document.querySelector('.art-surface img').style.width)>104);await act(async()=>root.render(React.createElement(ArtworkMedia,{art,alt:'Original band',originalPreview:true,fitPreview:'contain'})));await load();assert.equal(document.querySelector('.art-surface img').src,art.image);assert.ok(Number.parseFloat(document.querySelector('.art-surface img').style.width)>104);assert.equal(JSON.stringify(art),original);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
