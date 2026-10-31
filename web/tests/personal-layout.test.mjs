import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {renderToString} from 'react-dom/server';import {JSDOM} from 'jsdom';
const layout=await import('../lib/personal-layout.ts'),canvas=await import('../lib/personal-canvas.ts'),{emptyProfile,parseProfile,mergeProfile}=await import('../lib/account-profile.ts'),{default:Sections}=await import('../components/personal-sections.tsx');
const calendar=fields=>({order:[],sections:{calendar:fields}});
test('legacy preferences remain readable while free canvas frames are bounded and strictly validated',()=>{
 const old={overview:calendar({hidden:true,width:6,height:470}),'game:wuwa':calendar({width:12,height:null})};assert.deepEqual(layout.readPersonalLayouts(layout.encodePersonalLayouts(old)),old);
 const free={overview:{...calendar({frame:{x:117,y:233,width:637},height:449,layer:7}),canvas:{width:1000}}};assert.deepEqual(parseProfile({...emptyProfile(),layouts:free}).layouts,free);
 for(const bad of [{owner:calendar({})},{overview:calendar({width:2})},{overview:calendar({height:2401})},{overview:calendar({hidden:'yes'})},{overview:calendar({frame:{x:-1,y:0,width:500}})},{overview:calendar({frame:{x:0,y:Infinity,width:500}})},{overview:{...calendar({frame:{x:100,y:50,width:1000}}),canvas:{width:1000}}},{overview:calendar({frame:{x:0,y:0,width:500,css:'unsafe'}})},{overview:calendar({layer:10001})}])assert.throws(()=>layout.parsePersonalLayouts(bad));
 assert.throws(()=>layout.readPersonalLayouts('invalid'));assert.throws(()=>layout.readPersonalLayouts('{"version":2,"layouts":{}}'));
});
test('capture keeps actual legacy geometry and pixel resize has no row, column or size quantization',()=>{
 const old={order:['events','calendar'],sections:{events:{hidden:true},calendar:{width:6,height:470}}},measurements={calendar:{x:23,y:431,width:477,height:470}},migrated=canvas.captureCanvas(old,measurements,1041);
 assert.deepEqual(migrated.sections.calendar.frame,{x:23,y:431,width:477});assert.equal(migrated.sections.calendar.height,470);assert.equal(migrated.sections.events.hidden,true);assert.deepEqual(migrated.order,old.order);
 assert.deepEqual(canvas.moveCanvas({x:23,y:431,width:477},117,233,1041),{x:140,y:664,width:477});assert.deepEqual(canvas.resizeCanvas({x:23,y:431,width:477},470,137,49,1041),{frame:{x:23,y:431,width:614},height:519});
 assert.deepEqual(canvas.moveCanvas({x:23,y:431,width:477},9999,-9999,1041),{x:564,y:0,width:477});assert.equal(canvas.resizeCanvas({x:23,y:431,width:477},470,-9999,9999,1041).height,2400);
});
test('concurrent canvas positions and independent section controls merge through the private account profile',()=>{
 const p=layouts=>parseProfile({...emptyProfile(),layouts}),base=p({overview:{...calendar({frame:{x:0,y:0,width:500},height:400}),canvas:{width:1000}}}),local=p({overview:{...calendar({frame:{x:117,y:233,width:500},height:400}),canvas:{width:1000}},'game:wuwa':calendar({hidden:true})}),remote=p({overview:{...calendar({frame:{x:0,y:0,width:500},height:600}),canvas:{width:1000}},'game:hsr':calendar({width:4})});
 const combined=mergeProfile(base,local,remote);assert.deepEqual(combined.layouts.overview.sections.calendar,{frame:{x:117,y:233,width:500},height:600});assert.deepEqual(combined.layouts['game:wuwa'],local.layouts['game:wuwa']);assert.deepEqual(combined.layouts['game:hsr'],remote.layouts['game:hsr']);assert.deepEqual(mergeProfile(base,base,p({overview:layout.emptyLayout()})),p({overview:layout.emptyLayout()}));
});
function environment(){const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko',pretendToBeVisual:true}),old=new Map();const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});};for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','KeyboardEvent','StorageEvent','localStorage','navigator'])set(k,dom.window[k]);set('requestAnimationFrame',dom.window.requestAnimationFrame.bind(dom.window));set('cancelAnimationFrame',dom.window.cancelAnimationFrame.bind(dom.window));set('IS_REACT_ACT_ENVIRONMENT',true);
 const values={calendar:{x:0,y:0,width:500,height:400},events:{x:0,y:424,width:1000,height:300},content:{x:0,y:748,width:650,height:300}};
 dom.window.HTMLElement.prototype.getBoundingClientRect=function(){const id=this.dataset.pageSection||this.closest('[data-page-section]')?.dataset.pageSection,m=values[id]||{x:0,y:0,width:1000,height:0},x=Number.parseFloat(this.style.left)||m.x,y=Number.parseFloat(this.style.top)||m.y,w=Number.parseFloat(this.style.width)||m.width,h=Number.parseFloat(this.style.height)||m.height;return {left:x,top:y,x,y,width:w,height:h,right:x+w,bottom:y+h};};
 return {dom,close(){dom.window.close();for(const[k,v]of old)v?Object.defineProperty(globalThis,k,v):delete globalThis[k];}};
}
const fixtures=[{id:'calendar',content:React.createElement('button',null,'Real calendar')},{id:'events',content:React.createElement('p',null,'Real events')},{id:'content',content:React.createElement('p',null,'Real content')}];
test('compact schedule groups only default flow and preserves saved personal order and canvas',async()=>{
 const env=environment(),{createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root')),sections=['version','resets','events','deadlines','content'].map(id=>({id,content:React.createElement('p',null,id)}));
 try{await act(async()=>root.render(React.createElement(Sections,{scope:'game:wuwa',locale:'ko',sections,compactSchedule:true})));assert.deepEqual([...document.querySelectorAll('.schedule-overview-grid>[data-page-section]')].map(n=>n.dataset.pageSection),['resets','events','deadlines']);assert.equal(document.querySelector('.personal-layout-grid').children[0].dataset.pageSection,'version');
 const custom={order:['content','version','resets','events','deadlines'],sections:{events:{width:6}}};localStorage.setItem(layout.PERSONAL_LAYOUT_KEY,layout.encodePersonalLayouts({'game:wuwa':custom}));await act(async()=>window.dispatchEvent(new StorageEvent('storage',{key:layout.PERSONAL_LAYOUT_KEY})));assert.equal(document.querySelector('.schedule-overview-grid'),null);assert.equal(document.querySelector('.personal-layout-grid').children[0].dataset.pageSection,'content');assert.equal(JSON.parse(localStorage.getItem(layout.PERSONAL_LAYOUT_KEY)).layouts['game:wuwa'].sections.events.width,6);
 }finally{await act(async()=>root.unmount());env.close();}
});
async function click(label){await act(async()=>{const button=document.querySelector('[aria-label="'+label+'"]');assert.ok(button,label);button.click();});}
async function pointer(label,type,x,y){await act(async()=>{const event=new Event(type,{bubbles:true});for(const[k,v]of Object.entries({button:0,clientX:x,clientY:y,pointerId:1}))Object.defineProperty(event,k,{value:v});document.querySelector('[aria-label="'+label+'"]').dispatchEvent(event);});}
test('actual hydrated board moves by arbitrary XY, resizes pixels, persists only on release and restores its own game',async()=>{
 const e=environment();let root,changes=0;const {hydrateRoot,createRoot}=await import('react-dom/client'),props={scope:'overview',locale:'ko',sections:fixtures},errors=[],changed=()=>changes++;window.addEventListener('gagether:personal-changed',changed);document.getElementById('root').innerHTML=renderToString(React.createElement(Sections,props));
 try{await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Sections,props),{onRecoverableError:e=>errors.push(e.message)});});await act(async()=>document.querySelector('.personal-layout-trigger').click());assert.ok(document.querySelector('.is-canvas'));assert.ok(document.querySelector('.personal-section-body').hasAttribute('inert'));
  const before=changes,handle='끌어서 이동 · 달력';await pointer(handle,'pointerdown',150,150);await pointer(handle,'pointermove',267,383);let tile=document.querySelector('[data-page-section="calendar"]');assert.equal(tile.style.left,'117px');assert.equal(tile.style.top,'233px');assert.equal(changes,before);await pointer(handle,'pointerup',267,383);assert.equal(changes,before+1);
  const resize='크기 조절 · 달력';await pointer(resize,'pointerdown',600,550);await pointer(resize,'pointermove',737,599);assert.equal(tile.style.width,'637px');assert.equal(tile.querySelector('.personal-section-body').style.height,'449px');assert.equal(changes,before+1);await pointer(resize,'pointerup',737,599);assert.equal(changes,before+2);
  const saved=layout.readPersonalLayouts(localStorage.getItem(layout.PERSONAL_LAYOUT_KEY)).overview;assert.deepEqual(saved.sections.calendar.frame,{x:117,y:233,width:637});assert.equal(saved.sections.calendar.height,449);
  await pointer(handle,'pointerdown',150,350);await pointer(handle,'pointermove',220,390);await pointer(handle,'pointercancel',220,390);assert.equal(tile.style.left,'117px');assert.equal(changes,before+2);
  await click('되돌리기');assert.equal(tile.style.width,'500px');await click('다시 실행');assert.equal(tile.style.width,'637px');
  await act(async()=>document.querySelector('.personal-layout-trigger').click());assert.equal(document.querySelector('.personal-section-body').hasAttribute('inert'),false);await act(async()=>root.unmount());await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Sections,props));});tile=document.querySelector('[data-page-section="calendar"]');assert.equal(tile.style.left,'117px');assert.equal(tile.style.top,'233px');assert.equal(tile.style.width,'637px');
  await act(async()=>root.render(React.createElement(Sections,{...props,key:'game:wuwa',scope:'game:wuwa'})));assert.equal(document.querySelector('.is-canvas'),null);assert.ok(document.body.textContent.includes('Real events'));assert.deepEqual(errors,[]);
 }finally{window.removeEventListener('gagether:personal-changed',changed);if(root)await act(async()=>root.unmount());e.close();}
});
test('selection supports precision keyboard movement, front/back, hiding every section and reset recovery',async()=>{
 const e=environment();let root;const {createRoot}=await import('react-dom/client');try{await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Sections,{scope:'overview',locale:'ko',sections:fixtures}));});await act(async()=>document.querySelector('.personal-layout-trigger').click());
  const handle=document.querySelector('[aria-label="끌어서 이동 · 달력"]');await act(async()=>handle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true,bubbles:true})));assert.equal(document.querySelector('[data-page-section="calendar"]').style.left,'1px');await click('맨 앞으로');const front=layout.readPersonalLayouts(localStorage.getItem(layout.PERSONAL_LAYOUT_KEY)).overview.sections.calendar.layer;assert.ok(front>0);await click('맨 뒤로');assert.equal(layout.readPersonalLayouts(localStorage.getItem(layout.PERSONAL_LAYOUT_KEY)).overview.sections.calendar.layer,0);assert.equal(document.querySelector('[data-page-section="calendar"]').style.zIndex,'0');
  for(const id of ['달력','이벤트','콘텐츠 목록']){const label=[...document.querySelectorAll('.personal-layout-palette label')].find(n=>n.textContent===id);await act(async()=>label.querySelector('input').click());}assert.equal(document.querySelectorAll('[data-page-section]').length,0);assert.ok(document.querySelector('.personal-layout-empty'));assert.equal(document.querySelector('.personal-layout-trigger').disabled,false);
  await act(async()=>[...document.querySelectorAll('.personal-layout-actions button')].find(b=>b.textContent==='기본 배치 복원').click());assert.equal(document.querySelectorAll('[data-page-section]').length,3);assert.equal(document.querySelector('[data-page-section="calendar"]').style.left,'0px');
 }finally{if(root)await act(async()=>root.unmount());e.close();}
});
test('malformed local layouts are preserved and free-position controls remain locked',async()=>{
 const e=environment();let root;const {createRoot}=await import('react-dom/client');localStorage.setItem(layout.PERSONAL_LAYOUT_KEY,'keep corrupt original');try{await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Sections,{scope:'overview',locale:'en',sections:fixtures}));});await act(async()=>document.querySelector('.personal-layout-trigger').click());assert.ok(document.querySelector('[role=alert]'));assert.ok(document.querySelector('[aria-label="Drag to move · Calendar"]').disabled);assert.equal(localStorage.getItem(layout.PERSONAL_LAYOUT_KEY),'keep corrupt original');}finally{if(root)await act(async()=>root.unmount());e.close();}
});

test('late-loaded sections append below existing frames and each other without shifting a placed widget',()=>{
 const base={order:[],canvas:{width:1000},sections:{calendar:{frame:{x:117,y:233,width:637}}}},heights={calendar:500,version:340,pv:400},order=['calendar','version','pv'];
 const first=canvas.canvasFrameFor(base,'version',1,heights,order),second=canvas.canvasFrameFor(base,'pv',2,heights,order);assert.equal(first.y,757);assert.equal(second.y,1121);assert.ok(second.y>=first.y+340);assert.deepEqual(base.sections.calendar.frame,{x:117,y:233,width:637});
 const converted=canvas.captureCanvas(layout.emptyLayout(),{calendar:{x:0,y:0,width:1000,height:0}},1000);assert.equal(converted.sections.calendar,undefined);
});

test('plain captured flow adapts to screen width and natural heights without changing saved XY; custom canvases stay exact',()=>{
 const base={order:[],canvas:{width:1500},sections:{calendar:{frame:{x:0,y:0,width:1500}},pickup:{frame:{x:0,y:600,width:1500}},content:{frame:{x:0,y:1400,width:984}},deadlines:{frame:{x:1008,y:1400,width:492}}}},before=JSON.stringify(base);
 assert.deepEqual(canvas.capturedFlowOrder(base,['deadlines','pickup','calendar','content']),['calendar','pickup','content','deadlines']);assert.equal(JSON.stringify(base),before);
 assert.equal(canvas.capturedFlowOrder({...base,sections:{...base.sections,pickup:{frame:{x:100,y:600,width:1200}}}},['calendar','pickup']),undefined);
 assert.equal(canvas.capturedFlowOrder({...base,sections:{...base.sections,pickup:{...base.sections.pickup,layer:1}}},['calendar','pickup']),undefined);
});


test('a mobile default capture stays responsive when a new section appears, without overwriting saved geometry',async()=>{
 const e=environment();let root;const {createRoot}=await import('react-dom/client');
 const captured={order:[],canvas:{width:339},sections:{calendar:{frame:{x:0,y:0,width:339}},content:{frame:{x:0,y:500,width:339}}}},original=layout.encodePersonalLayouts({'game:umamusume':captured});
 try{
  localStorage.setItem(layout.PERSONAL_LAYOUT_KEY,original);
  const sections=['version','calendar','upcoming','content','social'].map(id=>({id,content:React.createElement('p',null,id)}));
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Sections,{scope:'game:umamusume',locale:'ko',sections}));});
  assert.equal(document.querySelector('.is-canvas'),null);assert.ok(document.querySelector('.is-responsive-capture'));
  assert.deepEqual([...document.querySelectorAll('[data-page-section]')].map(el=>el.dataset.pageSection),['version','calendar','upcoming','content','social']);
  assert.equal(localStorage.getItem(layout.PERSONAL_LAYOUT_KEY),original);
  for(const patch of [{frame:{x:25,y:0,width:280}},{frame:{x:0,y:0,width:339},layer:2}])assert.equal(canvas.capturedFlowOrder({...captured,sections:{...captured.sections,calendar:patch}},['version','calendar','content']),undefined);
 }finally{if(root)await act(async()=>root.unmount());e.close();}
});
