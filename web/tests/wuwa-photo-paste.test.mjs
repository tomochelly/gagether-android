import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import equipment from '../content/wuwa-equipment-catalog.json' with {type:'json'};
const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
dom.window.scrollTo=()=>{};
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
const urls=[],revoked=[];
URL.createObjectURL=f=>{urls.push(f);return 'blob:local-photo-'+urls.length;};
URL.revokeObjectURL=u=>revoked.push(u);
const {createRoot}=await import('react-dom/client');
const {default:Photo}=await import('../components/wuwa-photo-import.tsx');
test('dialog accepts screenshot clipboard image as the same local preview, leaves text paste alone and releases prior photos',async()=>{
 const root=createRoot(document.getElementById('root')),setup={echoes:Array.from({length:5},()=>({echoId:'',setId:'',rarity:5,level:25,main:{key:'atkPercent',value:0},subs:[]})),stats:{}};
 const before=JSON.stringify(setup);let applied=0;
 await act(async()=>root.render(React.createElement(Photo,{catalog:equipment,locale:'ko',setup,initialSlot:0,onApply:()=>applied++,onClose:()=>{}})));
 const dialog=document.querySelector('dialog'),paste=(target,items,files=[])=>{const event=new window.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{items,files}});target.dispatchEvent(event);return event;};
 try{
  assert.ok(dialog.open);assert.match(dialog.textContent,/Ctrl\+V/);
  const image=new window.File(['original screenshot'],'capture.png',{type:'image/png'});
  let event;await act(async()=>{event=paste(dialog,[{kind:'string',type:'text/plain'},{kind:'file',type:'image/png',getAsFile:()=>image}]);});
  assert.ok(event.defaultPrevented);assert.equal(urls[0],image);assert.equal(document.querySelector('.ws-photo-preview img').getAttribute('src'),'blob:local-photo-1');assert.equal(applied,0);assert.equal(JSON.stringify(setup),before);
  await act(async()=>{event=paste(document.querySelector('textarea'),[{kind:'string',type:'text/plain'}]);});assert.equal(event.defaultPrevented,false);
  const next=new window.File(['next original'],'capture2.png',{type:'image/png'});
  await act(async()=>{event=paste(dialog,[],[next]);});assert.ok(event.defaultPrevented);assert.equal(urls[1],next);assert.ok(revoked.includes('blob:local-photo-1'));assert.equal(applied,0);
  const invalid=new window.File(['gif'],'capture.gif',{type:'image/gif'});
  await act(async()=>paste(dialog,[{kind:'file',type:'image/gif',getAsFile:()=>invalid}]));assert.match(document.querySelector('[role=alert]').textContent,/20MB/);assert.equal(urls.length,2);
  const textarea=document.querySelector('textarea');
  await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(textarea,'크리티컬 피해 440%\n공격력 150\n강공격 피해 보너스 8.6%\nHP 7.9%\n크리티컬 6.3%\n크리티컬 피해 16.2%\n공명 효율 10.8%');textarea.dispatchEvent(new window.Event('input',{bubbles:true}));});
  const echoSelect=document.querySelectorAll('.ws-photo-review select')[1];assert.ok(echoSelect,'manual OCR text opens review');
  await act(async()=>{echoSelect.value=equipment.echoes.find(e=>e.cost===4).id;echoSelect.dispatchEvent(new window.Event('change',{bubbles:true}));});
  const review=document.querySelector('.ws-photo-review');assert.equal(review.querySelectorAll('select')[3].value,'0');assert.equal(review.querySelectorAll('.ws-photo-values input:checked').length,5);assert.match(review.textContent,/소수점 복원/);assert.equal(applied,0);assert.equal(JSON.stringify(setup),before);
 }finally{await act(async()=>root.unmount());assert.ok(revoked.includes('blob:local-photo-2'));dom.window.close();}
});
