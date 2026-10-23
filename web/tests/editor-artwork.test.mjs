import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {replacementArtwork,previewEntries}=await import('../lib/editor-preview.ts');
const {applyEditorial,catalogGames,catalogUi}=await import('../lib/editorial.ts');
const {artworkForLocale}=await import('../lib/artwork.ts');
const {spotlightSlides}=await import('../lib/spotlight.ts');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {EntryArtwork}=await import('../components/radar.tsx');
const {default:ArtworkMedia}=await import('../components/artwork-media.tsx');
const {PhotoField,default:EditorPanel}=await import('../components/editor-panel.tsx');
const local=s=>({ko:s,en:s,ja:s,zh:s});
const stamp='2026-10-21T18:54:17.693Z',now=Date.parse(stamp);
const entry={id:'clementia',gameId:'arknights',region:'cn',kind:'pickup',server:'CN',title:local('Clementia'),summary:local('Summary'),sourceUrl:'https://ak.hypergryph.com/news/20261009.html',sourceTitle:'Notice',sourceKind:'official',startAt:'2026-10-09T08:00:00Z',endAt:'2026-11-01T08:00:00Z',publishedAt:null,verifiedAt:stamp,image:'/assets/banner.png',imageVerified:true,imageLocale:'zh',imageKind:'banner',pickupMembers:[{name:local('Clementia'),role:'featured',type:'new',image:'/assets/member.png',imageVerified:true,imageLocale:'neutral'},{name:local('Lower rarity'),role:'rate-up',type:'rerun',image:'/assets/lower.png',imageVerified:true,imageLocale:'neutral'}]};
const games=catalogGames({}),byId=Object.fromEntries(games.map(g=>[g.id,g]));
const context=(editMode=false)=>({games,byId,t:catalogUi('ko',{}),settings:{},canEdit:editMode,editMode,simpleMode:false,openEditor(){}});
const provide=(child,editing=false)=>React.createElement(CatalogContext.Provider,{value:context(editing)},child);
test('replacement keeps the chosen image language and clears stale crop/variant metadata',()=>{
 for(const locale of ['zh','ja','neutral']){
  const image=replacementArtwork('/api/media/new.png','https://gagether.wiki',locale);
  assert.equal(image.imageLocale,locale);assert.equal(image.imageSource,'https://gagether.wiki/api/media/new.png');
  assert.equal(image.previewArtwork,undefined);assert.equal(image.localizedArtwork,undefined);assert.equal(image.previewBounds,undefined);
 }
});
test('legacy uploads recover classification only from the exact visually reviewed image; editorial data stays untouched',()=>{
 const record={key:'entry:'+entry.id,payload:{image:'/api/media/owned.png',$unset:['imageLocale']},revision:3,updatedAt:stamp};
 const reviewed={image:record.payload.image,imageSource:'https://gagether.wiki'+record.payload.image,imageVerified:true,imageLocale:'neutral',imageKind:'character',width:2700,height:2700,verifiedAt:stamp};
 const snapshot=JSON.stringify(record);const repaired=applyEditorial([{...entry,detailImages:[reviewed]}],[record])[0];
 assert.equal(repaired.image,record.payload.image);assert.equal(repaired.imageLocale,'neutral');assert.equal(repaired.imageKind,'character');assert.equal(repaired.editor.revision,3);assert.equal(JSON.stringify(record),snapshot);assert.equal(repaired.verifiedAt,stamp);
 for(const asset of [{...reviewed,image:'/different.png'},{...reviewed,imageVerified:false},{...reviewed,imageLocale:undefined}])assert.equal(applyEditorial([{...entry,detailImages:[asset]}],[record])[0].imageLocale,undefined);
});
test('a local replacement immediately overrides the single featured image in spotlight, cards and details',()=>{
 const draft={...entry,...replacementArtwork('/api/media/new.png','https://gagether.wiki','neutral')};
 const [preview]=previewEntries([entry],{entry:draft});assert.equal(entry.editor,undefined);assert.equal(draft.editor,undefined);
 assert.equal(spotlightSlides([preview],now)[0].art.image,draft.image);
 for(const variant of ['card','detail']){
  const html=renderToStaticMarkup(provide(React.createElement(EntryArtwork,{entry:preview,locale:'ko',variant})));
  assert.ok(html.includes(draft.image));assert.ok(!html.includes('/assets/lower.png'));
 }
 const multi={...preview,pickupMembers:[entry.pickupMembers[0],{...entry.pickupMembers[1],role:'featured'}]};
 const html=renderToStaticMarkup(provide(React.createElement(EntryArtwork,{entry:multi,locale:'ko',variant:'detail'})));
 assert.ok(html.includes('/assets/member.png'));assert.ok(html.includes('/assets/lower.png'));
});
test('private photo inspection does not loosen public service-language filtering',()=>{
 const art={image:'/api/media/unclassified.png',imageVerified:true};
 assert.equal(artworkForLocale(art,'ko','full','zh').image,undefined);
 for(const editing of [false,true]){
  const html=renderToStaticMarkup(provide(React.createElement(ArtworkMedia,{art,alt:'Photo',locale:'ko',mode:'full',editorPreview:true}),editing));
  assert.equal(html.includes(art.image),editing);
 }
});
test('actual upload preview is immediate, success preserves selected service language, failure keeps a retryable local draft and preserves saved data, unmount aborts',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();
 const replace=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true})};
 for(const key of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','File','FormData'])replace(key,dom.window[key]);
 replace('Image',class{naturalWidth=1600;naturalHeight=900;set src(v){if(v)queueMicrotask(()=>this.onload?.());}});replace('IS_REACT_ACT_ENVIRONMENT',true);replace('ResizeObserver',class{observe(){}disconnect(){}});
 const realCreate=URL.createObjectURL,realRevoke=URL.revokeObjectURL;const revoked=[];URL.createObjectURL=()=> 'blob:immediate';URL.revokeObjectURL=url=>revoked.push(url);
 let finish,request,updates=[],pending=[];
 replace('fetch',async(_url,options)=>{request=options;return new Promise(resolve=>{finish=resolve;options.signal.addEventListener('abort',()=>resolve({ok:false,json:async()=>({error:'aborted'})}))})});
 let root=createRoot(document.getElementById('root'));
 function Harness({serviceLocale='zh',onBusyChange}){const [value,setValue]=React.useState({...entry,imageLocale:undefined});return provide(React.createElement(PhotoField,{value,locale:'ko',serviceLocale,onChange:patch=>{updates.push(patch);setValue(v=>({...v,...patch}))},onBusyChange}),true)}
 const upload=async()=>act(async()=>{const file=document.querySelector('input[type=file]');Object.defineProperty(file,'files',{value:[new File(['png'],'picture.png',{type:'image/png'})],configurable:true});file.dispatchEvent(new Event('change',{bubbles:true}))});
 try{
  for(const serviceLocale of ['zh','ja']){
   await act(async()=>root.render(React.createElement(Harness,{key:serviceLocale,serviceLocale,onBusyChange:(_id,busy)=>pending.push(busy)})));
   updates=[];pending=[];await upload();assert.equal(document.querySelector('.editor-photo-preview img').getAttribute('src'),'blob:immediate');assert.deepEqual(pending,[true]);assert.equal(updates.length,0);
   await act(async()=>finish({ok:true,json:async()=>({url:'/api/media/new.png'})}));assert.equal(updates[0].imageLocale,serviceLocale);assert.equal(document.querySelector('.editor-photo-preview img').getAttribute('src'),'/api/media/new.png');assert.deepEqual(pending,[true,false]);
  }
  updates=[];await upload();await act(async()=>finish({ok:false,json:async()=>({error:'Upload failed'})}));assert.equal(updates.length,0);assert.match(document.querySelector('[role=alert]').textContent,/Upload failed/);assert.equal(document.querySelector('.editor-photo-preview img').getAttribute('src'),'blob:immediate');assert.equal(pending.at(-1),true);
  await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('교체 취소')).click());assert.equal(document.querySelector('.editor-photo-preview img').getAttribute('src'),'/api/media/new.png');assert.equal(pending.at(-1),false);
  await upload();await act(async()=>root.unmount());assert.equal(request.signal.aborted,true);assert.equal(updates.length,0);assert.ok(revoked.length>=4);
 }finally{await act(async()=>root.unmount());URL.createObjectURL=realCreate;URL.revokeObjectURL=realRevoke;dom.window.close();for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
});
test('the real editor blocks saving while a file is uploading, then saves the completed image metadata',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();
 const replace=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true})};
 for(const key of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','File','FormData'])replace(key,dom.window[key]);replace('Image',class{naturalWidth=1600;naturalHeight=900;set src(v){if(v)queueMicrotask(()=>this.onload?.());}});replace('IS_REACT_ACT_ENVIRONMENT',true);replace('ResizeObserver',class{observe(){}disconnect(){}});
 const realCreate=URL.createObjectURL,realRevoke=URL.revokeObjectURL;URL.createObjectURL=()=> 'blob:pending';URL.revokeObjectURL=()=>{};
 const data={entries:[{...entry,imageLocale:undefined}],settings:{},settingsRevision:0,sourceChecks:[]};let finish,savedBody;
 replace('fetch',async(path,options)=>{
  if(path==='/api/editor/upload')return new Promise(resolve=>finish=resolve);
  if(options?.method==='POST')savedBody=JSON.parse(options.body);
  return {ok:true,json:async()=>data};
 });
 const root=createRoot(document.getElementById('root'));const noop=()=>{};
 try{
  await act(async()=>root.render(provide(React.createElement(EditorPanel,{initial:{tab:'entry',entryId:entry.id},locale:'ko',onClose:noop,onSaved:noop,onPreview:noop}),true)));
  const input=document.querySelector('input[type=file]');Object.defineProperty(input,'files',{value:[new File(['png'],'photo.png',{type:'image/png'})]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));let button=document.querySelector('.editor-footer button.editor-primary');assert.equal(button.disabled,true);
  await act(async()=>finish({ok:true,json:async()=>({url:'/api/media/complete.png'})}));button=document.querySelector('.editor-footer button.editor-primary');assert.equal(button.disabled,false);
  await act(async()=>button.click());assert.equal(savedBody.changes.image,'/api/media/complete.png');assert.equal(savedBody.changes.imageLocale,'zh');assert.equal(savedBody.target,'entry');
 }finally{await act(async()=>root.unmount());URL.createObjectURL=realCreate;URL.revokeObjectURL=realRevoke;dom.window.close();for(const[key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
});
