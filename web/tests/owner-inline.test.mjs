import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const {entryDiff,mergeInlineDraft,saveInlineEntry}=await import('../lib/inline-edit.ts');
const {entrySchema,safeExtras}=await import('../lib/content-schema.ts');
const {catalogEntry}=await import('../lib/catalog-index.ts');
const {OwnerInlineProvider,EntryEdit}=await import('../components/owner-inline.tsx');
const {default:Form}=await import('../components/owner-inline-form.tsx');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const {default:ContentBlocks}=await import('../components/content-blocks.tsx');
const loc=v=>({ko:v,en:v,ja:v,zh:v}),stamp='2026-10-23T01:00:00Z';
const item={id:'test-inline',gameId:'bluearchive',kind:'event',region:'jp',server:'JP',title:loc('Original title'),summary:loc('Original body'),sourceTitle:'Notice',sourceUrl:'https://bluearchive.jp/news/newsJump/701',publishedAt:null,verifiedAt:stamp,startAt:null,endAt:null,editor:{revision:4,updatedAt:stamp,fields:['summary']}};
const games=catalogGames({}),context={games,byId:Object.fromEntries(games.map(g=>[g.id,g])),t:catalogUi('ko',{}),settings:{},canEdit:true,editMode:true,simpleMode:false,openEditor(){}};
const provide=child=>React.createElement(CatalogContext.Provider,{value:context},child);
const noop=()=>{};
test('inline patch excludes transport/verification fields and three-way merge retains concurrent data',()=>{
 const draft={...item,title:loc('My title'),editor:{...item.editor,revision:1},verifiedAt:'2099',detailsDeferred:true};
 assert.deepEqual(Object.keys(entryDiff(item,draft).changes),['title']);
 let current={...item,summary:loc('Other body'),editor:{...item.editor,revision:5}},merged=mergeInlineDraft(item,draft,current);
 assert.deepEqual(merged.conflicts,[]);assert.equal(merged.draft.summary.ko,'Other body');assert.equal(merged.draft.title.ko,'My title');assert.equal(merged.base.editor.revision,5);
 current={...current,title:loc('Other title')};merged=mergeInlineDraft(item,draft,current);assert.deepEqual(merged.conflicts,['title']);
});
test('long text and exact image blocks survive schema and stay out of lightweight index; unsafe and duplicate blocks fail',()=>{
 const blocks=[{id:'text-1',type:'text',title:loc('More detail'),body:loc('Long detail\n'.repeat(1000))},{id:'image-1',type:'image',asset:{image:'/assets/versions/ba-jp-20261007-occult.png',imageSource:item.sourceUrl,imageVerified:true,imageLocale:'ja',width:1920,height:1080,verifiedAt:stamp}}];
 const e={...item,contentBlocks:blocks};assert.equal(entrySchema.safeParse(e).success,true);assert.equal(safeExtras(e),true);assert.equal(catalogEntry(e).contentBlocks,undefined);
 assert.equal(entrySchema.safeParse({...e,contentBlocks:[blocks[0],blocks[0]]}).success,false);
 assert.equal(safeExtras({...e,contentBlocks:[{...blocks[1],asset:{...blocks[1].asset,image:''}}]}),false);
 const html=renderToStaticMarkup(provide(React.createElement(ContentBlocks,{entry:{...item,contentBlocks:[{id:'x',type:'text',body:loc('<script>alert(1)</script>\nNext line')}]},locale:'ko'})));
 assert.equal(html.includes('<script>'),false);assert.match(html,/&lt;script&gt;/);assert.match(html,/Next line/);
});
test('anonymous visitors receive no inline controls, forms or draft IDs',()=>{
 for(const enabled of [false,true]){const html=renderToStaticMarkup(React.createElement(OwnerInlineProvider,{enabled,onSaved:noop,onPreview:noop,onActive:noop},React.createElement(EntryEdit,{entry:item,locale:'ko'})));assert.equal(html.includes('data-owner-entry'),enabled);assert.equal(html.includes('owner-inline-form'),false);}
});
test('save uses exact revision/scoped readback and reports an unconfirmed save instead of silently succeeding',async()=>{
 const previous=globalThis.fetch;let request;
 try{globalThis.fetch=async(url,init)=>{request={url,...JSON.parse(init.body)};return {ok:true,json:async()=>({entry:{...item,title:loc('Changed'),editor:{...item.editor,revision:5}}})};};
 const saved=await saveInlineEntry(item,{...item,title:loc('Changed')});assert.equal(saved.editor.revision,5);assert.equal(request.revision,4);assert.equal(request.url,'/api/editor?view=entry');assert.deepEqual(Object.keys(request.changes),['title']);
 globalThis.fetch=async()=>({ok:true,json:async()=>({entry:item})});await assert.rejects(()=>saveInlineEntry(item,{...item,title:loc('Changed')}),/could not be verified/);
 globalThis.fetch=async()=>({ok:false,status:409,json:async()=>({error:'Changed elsewhere'})});await assert.rejects(()=>saveInlineEntry(item,{...item,title:loc('Changed')}),e=>e.status===409);
 }finally{globalThis.fetch=previous;}
});
test('mounted inline editor: input retained on failure, double submit blocked, retry/readback uses revision',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','File','FormData','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});set('Image',class{naturalWidth=1920;naturalHeight=1080;set src(v){if(v)queueMicrotask(()=>this.onload?.());}});
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));let stored=structuredClone(item),posts=0,finish,saved=[],guard;
 set('fetch',async(url,init)=>{if(init?.method==='POST'){posts++;return new Promise(resolve=>finish=()=>{stored={...stored,...JSON.parse(init.body).changes,editor:{...stored.editor,revision:stored.editor.revision+1}};resolve({ok:true,json:async()=>({entry:stored})});});}return {ok:true,json:async()=>({entry:stored})};});
 const props={entry:item,locale:'ko',scope:'content',create:false,onSaved:e=>saved.push(e),onPreview:noop,onClose:noop,register:f=>{guard=f;return()=>{};}};
 try{
  await act(async()=>root.render(provide(React.createElement(Form,props))));
  // Native event dispatch drives React's actual textarea handler.
  const input=document.querySelector('textarea');
  await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(input,'Typed detail\nSecond line');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  assert.equal(input.value,'Typed detail\nSecond line');
  let button=document.querySelector('.owner-inline-actions .editor-primary');
  assert.equal(button.disabled,false,'typing must update React draft');
  let fail;globalThis.fetch=async()=>{posts++;return new Promise(resolve=>fail=()=>resolve({ok:false,status:503,json:async()=>({error:'Temporary save failure'})}));};
  await act(async()=>{button.click();button.click();});assert.equal(posts,1);assert.equal(button.disabled,true);assert.equal(guard(),false);
  await act(async()=>fail());assert.match(document.querySelector('[role=alert]').textContent,/Temporary save failure/);assert.equal(input.value,'Typed detail\nSecond line');assert.ok(sessionStorage.getItem('gagether.owner.inline.'+item.id));
  globalThis.fetch=async(_url,init)=>{posts++;stored={...stored,...JSON.parse(init.body).changes,editor:{...stored.editor,revision:5}};return {ok:true,json:async()=>({entry:stored})};};
  await act(async()=>document.querySelector('.editor-primary').click());assert.equal(saved.length,1);assert.equal(saved[0].summary.ko,'Typed detail\nSecond line');assert.equal(document.querySelector('.editor-primary').disabled,true);assert.equal(sessionStorage.getItem('gagether.owner.inline.'+item.id),null);assert.equal(guard(),true);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d] of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
