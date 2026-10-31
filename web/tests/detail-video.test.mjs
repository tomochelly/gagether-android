import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';


// Exercise the actual detail tree: its one-second clock used to append another
// PV on every update because PV and Calendar shared a sibling key.
test('detail PV and Calendar stay singular across ticks, scrolling and all four UI languages',async()=>{
 const title={ko:'테스트 픽업',en:'Test pickup',ja:'テスト',zh:'测试'};
 const entry={id:'test-pickup',gameId:'wuwa',kind:'pickup',region:'global',title,summary:title,sourceKind:'official',sourceUrl:'https://example.com/notice',sourceTitle:'Test',verifiedAt:'2026-10-17T00:00:00Z',startAt:'2026-10-01T00:00:00+09:00',endAt:'2026-11-01T00:00:00+09:00',videos:['abcdefghijk','lmnopqrstuv'].map((youtubeId,i)=>({youtubeId,kind:'character',format:'pv',title,locale:i?'en':'ko',channel:'Test channel',sourceUrl:'https://www.youtube.com/watch?v='+youtubeId,verifiedAt:'2026-10-17T00:00:00Z',official:true,metadataVerified:true,watched:false}))};
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/?entry='+entry.id,pretendToBeVisual:true});
 const saved=new Map();const replace=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});};
 for(const key of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','localStorage','sessionStorage'])replace(key,dom.window[key]);
 replace('IS_REACT_ACT_ENVIRONMENT',true);
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};
 Element.prototype.scrollTo=function(){this.scrollTop=0};HTMLDialogElement.prototype.showModal=function(){this.open=true};HTMLDialogElement.prototype.show=function(){this.open=true};HTMLDialogElement.prototype.close=function(){this.open=false};
 replace('ResizeObserver',class{observe(){} disconnect(){}});
 const timers=new Map();let timerId=0;replace('setInterval',(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId});replace('clearInterval',id=>timers.delete(id));
 replace('fetch',async url=>({ok:true,json:async()=>String(url).includes('config')?{clientId:null}:{canEdit:false,entries:[entry],sourceChecks:[]}}));
 const errors=[];const originalError=console.error;console.error=(...args)=>errors.push(args.join(' '));
 const {default:Radar}=await import('../components/radar.tsx');
 const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(Radar,{initialData:{entries:[entry],sourceChecks:[]},initialComplete:true})));
  const count=()=>document.querySelectorAll('.detail-dialog .entry-videos').length;
  assert.equal(count(),1);
  assert.ok([...timers.values()].some(t=>t.ms===1000));
  for(let i=0;i<100;i++){
   await act(async()=>{for(const {fn,ms} of timers.values())if(ms===1000)fn();document.querySelector('.dialog-scroll').dispatchEvent(new Event('scroll'));});
   assert.equal(count(),1,'PV count after tick '+(i+1));
  }
  await act(async()=>document.querySelectorAll('.entry-video-tabs button')[1].click());
  assert.equal(count(),1);
  await act(async()=>document.querySelector('.entry-videos .video-poster').click());
  assert.equal(document.querySelectorAll('.entry-videos iframe').length,1);
  assert.ok(document.querySelector('.entry-videos iframe').src.includes('lmnopqrstuv'));
  assert.ok(!errors.some(e=>e.includes('same key')),errors.join('\n'));
  for(const [index,label] of ['Google 캘린더에 추가','Add to Google Calendar','Google カレンダーに追加','添加到 Google 日历'].entries()){
   await act(async()=>document.querySelectorAll('.language-control button')[index].click());
   assert.equal(document.querySelectorAll('.google-calendar-action').length,1);
   const button=document.querySelector('.google-calendar-action>button');
   assert.equal(button.textContent,label);
   const calendar=document.querySelector('.google-calendar-action');
   assert.ok(calendar.compareDocumentPosition(document.querySelector('.entry-videos'))&Node.DOCUMENT_POSITION_FOLLOWING,'Calendar precedes long PV content in every language');
   await act(async()=>button.click());
   assert.equal(button.getAttribute('aria-expanded'),'true');
   assert.ok(document.querySelector('.google-calendar-panel a[href^="https://calendar.google.com/"]'));
   for(let i=0;i<3;i++)await act(async()=>{for(const {fn,ms} of timers.values())if(ms===1000)fn();});
   assert.equal(document.querySelectorAll('.google-calendar-action').length,1);
   assert.equal(document.querySelectorAll('.entry-videos').length,1);
  }
  await act(async()=>document.querySelector('.dialog-close').click());
  assert.equal(count(),0);assert.equal(document.querySelectorAll('.entry-videos iframe').length,0);
 }finally{
  await act(async()=>root.unmount());console.error=originalError;dom.window.close();
  for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
});
