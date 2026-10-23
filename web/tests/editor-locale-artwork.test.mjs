import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {replaceArtworkSlot,patchArtworkSlot,editingArtwork}=await import('../lib/editor-artwork.ts');
const {artworkForLocale}=await import('../lib/artwork.ts');
const {entrySchema}=await import('../lib/content-schema.ts');
const {PhotoField}=await import('../components/photo-field.tsx');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {games}=await import('../lib/games.ts');
const stamp=new Date().toISOString(),local=s=>({ko:s,en:s,ja:s,zh:s});
const asset=(locale)=>({image:'/assets/'+locale+'.png',imageSource:'https://gagether.wiki/assets/'+locale+'.png',imageLocale:locale,imageVerified:true,width:1920,height:1080,verifiedAt:stamp,imageFraming:{banner:{x:30,y:40,zoom:.75,fit:'cover'}}});
const fixture={image:'/assets/root-ko.png',imageLocale:'ko',imageVerified:true,imageSource:'https://gagether.wiki/assets/root-ko.png',previewBounds:{left:10,top:0,right:60,bottom:100},previewArtwork:asset('ko'),imageFraming:{banner:{x:98,y:10,zoom:2,fit:'cover'}},localizedArtwork:Object.fromEntries(['en','ja','zh'].map(l=>[l,asset(l)]))};
test('all games: replacing/framing/clearing each locale preserves every other exact image and framing after serialization',()=>{
 for(const game of games){let art=structuredClone(fixture);for(let repeat=0;repeat<3;repeat++)for(const locale of ['ko','ja','en','zh']){
  const before=structuredClone(art),patch=replaceArtworkSlot(art,locale,`/api/media/${game.id}-${locale}-${repeat}.png`,'https://gagether.wiki',{width:1920,height:1080});art=JSON.parse(JSON.stringify({...art,...patch}));
  for(const l of ['ko','en','ja','zh'])if(l!==locale){assert.deepEqual(JSON.parse(JSON.stringify(art.localizedArtwork[l]??null)),JSON.parse(JSON.stringify(before.localizedArtwork[l]??null)));assert.equal(artworkForLocale(art,l,'full',l).image,artworkForLocale(before,l,'full',l).image);}
  const next={banner:{x:20+repeat,y:55,zoom:.6,fit:'contain'}};art={...art,...patchArtworkSlot(art,locale,{imageFraming:next})};const selected=artworkForLocale(art,locale,'preview',locale);assert.deepEqual(selected.imageFraming,next);assert.equal(selected.previewBounds,undefined);assert.equal(selected.previewArtwork,undefined);
  assert.equal(editingArtwork(art,locale).image,selected.image);assert.equal(art.image,fixture.image);
 }
 const cleared={...art,...replaceArtworkSlot(art,'ja','','https://gagether.wiki',{width:1,height:1})};assert.ok(!artworkForLocale(cleared,'ja','preview','ja').image);assert.equal(artworkForLocale(cleared,'ko','full','ko').image,art.localizedArtwork.ko.image);
 const entry={id:'locale-'+game.id,gameId:game.id,kind:'event',region:game.regions[0],server:game.publisher,title:local('Test'),summary:local('Text'),sourceUrl:game.official,sourceTitle:'Test',publishedAt:null,startAt:null,endAt:null,verifiedAt:stamp,...cleared};assert.equal(entrySchema.safeParse(entry).success,true);
 }
});
test('variant without framing or a matching preview cannot inherit another original crop; independent service wins over visitor language',()=>{
 const art={...fixture,localizedArtwork:{ja:{...asset('ja'),imageFraming:undefined}}};const ja=artworkForLocale(art,'ko','preview','ja');assert.equal(ja.image,asset('ja').image);assert.equal(ja.imageFraming,undefined);assert.equal(ja.previewBounds,undefined);assert.equal(ja.previewArtwork,undefined);
});
function setup(){const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),old=new Map();const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','File','FormData'])set(k,dom.window[k]);set('Image',class{naturalWidth=1920;naturalHeight=1080;set src(v){if(v)queueMicrotask(()=>this.onload?.())}});set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});return {set,restore(){dom.window.close();for(const[k,d]of old)d?Object.defineProperty(globalThis,k,d):delete globalThis[k]}};}
test('mounted language selector is read-only; upload, drag framing, language switches and reload retain exact selected slots',async()=>{
 const x=setup(),root=createRoot(document.getElementById('root'));let value=structuredClone(fixture),updates=0,n=0;const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;URL.createObjectURL=()=> 'blob:upload';URL.revokeObjectURL=()=>{};
 x.set('fetch',async()=>({ok:true,json:async()=>({url:'/api/media/upload-'+(++n)+'.png'})}));
 const context={games,byId:Object.fromEntries(games.map(g=>[g.id,g])),t:{},settings:{},canEdit:true,editMode:true,simpleMode:false,openEditor(){}};
 function Harness(){const [v,set]=React.useState(value);return React.createElement(CatalogContext.Provider,{value:context},React.createElement(PhotoField,{value:v,locale:'ko',onChange:p=>{value={...value,...p};updates++;set(value)},frameBox:{kind:'banner',width:1100,height:380}}));}
 const select=async(locale)=>act(async()=>{const el=document.querySelector('.editor-photo select');el.value=locale;el.dispatchEvent(new Event('change',{bubbles:true}))});
 try{
  await act(async()=>root.render(React.createElement(Harness)));
  for(let repeat=0;repeat<2;repeat++)for(const locale of ['ja','en','zh','ko']){
   const previous=JSON.stringify(value),count=updates;await select(locale);assert.equal(JSON.stringify(value),previous);assert.equal(updates,count);assert.equal(document.querySelector('.editor-photo-preview img')?.getAttribute('src'),editingArtwork(value,locale).image);
   await act(async()=>{const f=document.querySelector('input[type=file]');Object.defineProperty(f,'files',{value:[new File(['png'],'image.png',{type:'image/png'})],configurable:true});f.dispatchEvent(new Event('change',{bubbles:true}))});
   assert.equal(value.localizedArtwork[locale].image,'/api/media/upload-'+n+'.png');assert.equal(document.querySelector('.editor-photo-preview img').getAttribute('src'),value.localizedArtwork[locale].image);
   await act(async()=>{document.querySelector('.photo-frame-canvas').dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))});assert.ok(value.localizedArtwork[locale].imageFraming.banner);assert.deepEqual(value.imageFraming,fixture.imageFraming);
  }
  const persisted=JSON.stringify(value);await act(async()=>root.render(React.createElement(Harness,{key:'reload'})));assert.equal(JSON.stringify(value),persisted);await select('ja');assert.equal(document.querySelector('.editor-photo-preview img').getAttribute('src'),value.localizedArtwork.ja.image);
 }finally{await act(async()=>root.unmount());URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;x.restore();}
});
test('concurrent replacement fields cannot lose a sibling update; a held draft is released only by completion or cancel',async()=>{
 const x=setup(),root=createRoot(document.getElementById('root'));let requests=0,finish;const create=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=()=> 'blob:one';URL.revokeObjectURL=()=>{};x.set('fetch',async()=>{requests++;return new Promise(resolve=>finish=resolve)});const ctx={games,byId:Object.fromEntries(games.map(g=>[g.id,g])),t:{},settings:{},canEdit:true,editMode:true};function H(){return React.createElement(CatalogContext.Provider,{value:ctx},[0,1].map(i=>React.createElement(PhotoField,{key:i,value:{},locale:'ko',onChange(){}})))}
 async function upload(index){await act(async()=>{const input=document.querySelectorAll('input[type=file]')[index];Object.defineProperty(input,'files',{value:[new File(['a'],'a.png',{type:'image/png'})],configurable:true});input.dispatchEvent(new Event('change',{bubbles:true}))})}
 try{await act(async()=>root.render(React.createElement(H)));await upload(0);await upload(1);assert.equal(requests,1);assert.match(document.querySelectorAll('.editor-photo')[1].textContent,/다른 사진/);await act(async()=>finish({ok:false,json:async()=>({error:'Failure'})}));await upload(1);assert.equal(requests,1);await act(async()=>[...document.querySelectorAll('.editor-photo')[0].querySelectorAll('button')].find(b=>b.textContent==='교체 취소').click());await upload(1);assert.equal(requests,2);await act(async()=>finish({ok:true,json:async()=>({url:'/api/media/recovered.png'})}));}finally{await act(async()=>root.unmount());URL.createObjectURL=create;URL.revokeObjectURL=revoke;x.restore();}
});
