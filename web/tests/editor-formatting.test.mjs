import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React,{act,useState} from 'react';import {JSDOM} from 'jsdom';
import {renderToStaticMarkup} from 'react-dom/server';
const {default:TextEditor}=await import('../components/text-appearance-editor.tsx');
const {localizedTextStyle}=await import('../lib/content-schema.ts');
test('shared UI label formatting uses the selected language without changing plain text identities',async()=>{
 const {default:UiText}=await import('../components/ui-text.tsx'),{CatalogContext}=await import('../components/catalog-context.tsx');
 const styles={ko:{headline:{bodySize:32,bodyFormat:{bold:true,italic:true}}},ja:{headline:{bodySize:20}}};
 const render=locale=>renderToStaticMarkup(React.createElement(CatalogContext.Provider,{value:{locale,settings:{uiTextStyle:styles}}},React.createElement(UiText,{name:'headline'},'<plain text>')));
 const ko=render('ko'),ja=render('ja');assert.match(ko,/font-size:32px/);assert.match(ko,/font-weight:700/);assert.match(ko,/font-style:italic/);assert.match(ja,/font-size:20px/);assert.doesNotMatch(ja,/font-weight:700/);assert.match(ko,/&lt;plain text&gt;/);
});
test('main owner panel includes typography in its actual saved patch',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/owner',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});set('Image',class{set src(_){} });
 const local=s=>({ko:s,en:s,ja:s,zh:s}),item={id:'panel-typography',kind:'event',gameId:'nikke',region:'global',title:local('Title'),summary:local('Body'),server:'Global',sourceUrl:'https://nikke-kr.com/',sourceTitle:'Official',startAt:null,endAt:null,publishedAt:null,verifiedAt:'2026-10-25T00:00:00Z',editor:{revision:1,fields:[],updatedAt:'2026-10-25T00:00:00Z'}};let sent;
 set('fetch',async(_url,init)=>{if(init?.method==='POST'){sent=JSON.parse(init.body);return Response.json({entries:[{...item,...sent.changes,editor:{...item.editor,revision:2}}],settings:{},settingsRevision:0})}return Response.json({entries:[item],settings:{},settingsRevision:0})});
 const {default:Panel}=await import('../components/editor-panel.tsx'),{createRoot}=await import('react-dom/client');let root;
 try{await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Panel,{initial:{tab:'entry',entryId:item.id},locale:'ko',onSaved:()=>{},onClose:()=>{},onPreview:()=>{}}));await new Promise(setImmediate)});await act(async()=>document.querySelector('.text-appearance-editor button[aria-label="굵게"]').click());await act(async()=>document.querySelector('.editor-footer .editor-primary').click());assert.equal(sent.revision,1);assert.equal(sent.changes.textStyle.ko.bodyFormat.bold,true);assert.equal(sent.changes.summary,undefined);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
test('actual common toolbar edits text and typography live, isolates languages and restores undo/redo across the expanded editor',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/owner',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);HTMLDialogElement.prototype.showModal=function(){this.open=true};HTMLDialogElement.prototype.close=function(){this.open=false};
 let style,title,body,cancelled=0;function Fixture(){const [s,ss]=useState({ko:{bodySize:18},ja:{bodySize:20}}),[a,sa]=useState('Title'),[b,sb]=useState('Line 1\n\nLine 2');style=s;title=a;body=b;return React.createElement('div',{'data-owner-inline-key':'scope-id',onCancel:()=>cancelled++},React.createElement(TextEditor,{locale:'ko',lang:'ko',value:s,onChange:ss,title:a,body:b,onTitleChange:sa,onBodyChange:sb}));}
 const {createRoot}=await import('react-dom/client');let root;const click=label=>act(async()=>{const button=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===label);assert.ok(button,label+': '+[...document.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')).join(','));button.click()});
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Fixture))});
  for(const label of ['굵게','기울임','밑줄','가운데 정렬','글자 크기 +'])await click(label);
  let p=document.querySelector('.text-format-preview p');assert.equal(p.style.fontWeight,'700');assert.equal(p.style.fontStyle,'italic');assert.equal(p.style.textDecoration,'underline');assert.equal(p.style.textAlign,'center');assert.equal(p.style.fontSize,'19px');assert.equal(p.textContent,'Line 1\n\nLine 2');assert.deepEqual(style.ja,{bodySize:20});
  await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='넓은 편집 화면').click());assert.ok(document.querySelector('.text-editor-dialog[open]'));assert.equal(document.querySelector('.text-editor-dialog').dataset.ownerInlineKey,'scope-id');
  const input=document.querySelector('.text-editor-dialog textarea');await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(input,'<img src=x onerror=alert(1)>\n\nNew paragraph');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))});
  assert.equal(body,'<img src=x onerror=alert(1)>\n\nNew paragraph');assert.equal(document.querySelector('.text-format-preview img'),null);assert.match(document.querySelector('.text-format-preview').textContent,/<img src=x/);
  await click('실행 취소');assert.equal(body,'Line 1\n\nLine 2');await click('다시 실행');assert.match(body,/New paragraph/);
  const sizeInput=document.querySelector('input[aria-label="글자 크기"]'),setNumber=async value=>act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(sizeInput,value);sizeInput.dispatchEvent(new Event('input',{bubbles:true}));sizeInput.dispatchEvent(new Event('change',{bubbles:true}))});
  await setNumber('');await setNumber('2');assert.equal(sizeInput.value,'2');assert.equal(style.ko.bodySize,undefined);await setNumber('24');assert.equal(style.ko.bodySize,24);assert.equal(document.querySelector('.text-format-preview p').style.fontSize,'24px');
  await act(async()=>document.querySelector('.text-editor-dialog').dispatchEvent(new Event('cancel',{bubbles:true,cancelable:true})));assert.equal(cancelled,0);assert.equal(document.querySelector('.text-editor-dialog'),null);assert.match(body,/New paragraph/);assert.equal(style.ko.bodyFormat.bold,true);
  assert.equal(localizedTextStyle.safeParse(style).success,true);assert.equal(localizedTextStyle.safeParse({ko:{bodyFormat:{color:'url(javascript:evil)'}}}).success,false);assert.equal(localizedTextStyle.safeParse({ko:{titleSize:120,bodySize:96}}).success,true);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
