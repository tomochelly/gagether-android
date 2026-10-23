import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const {frameGeometry,imageFrame}=await import('../lib/image-framing.ts');
const {entrySchema}=await import('../lib/content-schema.ts');
const {settingsSchema}=await import('../lib/editor-schema.ts');
const {sectionOrder,moveSection}=await import('../lib/site-layout.ts');
const {retainEntityDetails}=await import('../lib/presentation.ts');
const {replacementArtwork}=await import('../lib/editor-preview.ts');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {default:PhotoPositionEditor}=await import('../components/photo-position-editor.tsx');
const {default:RewardEditor}=await import('../components/reward-editor.tsx');
const {RewardDetails}=await import('../components/reward-display.tsx');
const {default:PageSections}=await import('../components/page-sections.tsx');
const {rewardCatalog}=await import('../lib/reward-catalog.ts');
const {selectReward,gameRewardChoices}=await import('../lib/reward-edit.ts');
const {games}=await import('../lib/games.ts');
const {catalogUi}=await import('../lib/editorial.ts');
const stamp='2026-10-23T03:00:00Z',loc=s=>({ko:s,en:s,ja:s,zh:s});
const item={id:'studio-fixture',gameId:'genshin',region:'global',kind:'event',server:'Global',title:loc('Event'),summary:loc('Details'),sourceUrl:'https://genshin.hoyoverse.com/ko/news',sourceTitle:'Official notice',verifiedAt:stamp,publishedAt:null,startAt:null,endAt:null,image:'/assets/studio-test.png',imageVerified:true,imageLocale:'neutral'};
const frame={x:75,y:32,zoom:.4,fit:'contain'};
const context={games,byId:Object.fromEntries(games.map(g=>[g.id,g])),t:catalogUi('ko',{}),settings:{},canEdit:true,editMode:true,simpleMode:false,openEditor(){}};
const provide=(child,owner=true)=>React.createElement(CatalogContext.Provider,{value:{...context,canEdit:owner,editMode:owner}},child);
async function domSetup(){const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),old=new Map();const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','KeyboardEvent','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);const observers=new Set();set('ResizeObserver',class{constructor(cb){this.cb=cb;observers.add(this)}observe(){}disconnect(){observers.delete(this)}});set('Image',class{naturalWidth=1920;naturalHeight=1080;set src(v){if(v)queueMicrotask(()=>this.onload?.());}});const {createRoot}=await import('react-dom/client');return {dom,set,observers,root:createRoot(document.getElementById('root')),restore(){dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}};}
function typeValue(node,value){const proto=node.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:node.tagName==='SELECT'?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));}
test('owner placement permits free space and zoom out across viewports including explicit enlargement and legacy defaults',()=>{
 for(const game of games)for(const box of [{width:390,height:380},{width:1100,height:380},{width:3840,height:470}])for(const ratio of [1,2,3])for(const zoom of [.05,.4,1,6]){
  const rect=frameGeometry({width:1920,height:1080},box,{...frame,zoom},ratio);assert.ok(Math.abs(rect.width-1920*Math.min(box.width/1920,box.height/1080)*zoom)<.001,game.id);assert.equal(rect.limited,rect.width*ratio>1920+.0001);assert.ok(Math.abs(rect.left+rect.width/2-box.width*.75)<.001);
 }
 const a=frameGeometry({width:1920,height:1080},{width:1000,height:500},{...frame,x:-20,y:140});assert.ok(a.left<0);assert.ok(a.top+a.height/2>500);
 assert.equal(imageFrame({},'card'),undefined);assert.deepEqual(imageFrame({imageFraming:{banner:frame}},'mobile'),frame);assert.equal(imageFrame({imageFraming:{banner:frame}},'card'),undefined);
 const e={...item,imageFraming:{banner:frame},pickupMembers:[{name:loc('Subject'),type:'new',image:item.image,imageVerified:true,imageFraming:{card:frame}}]};assert.equal(entrySchema.safeParse(e).success,true);
 const kept=retainEntityDetails({...item,pickupMembers:[{name:loc('Subject'),type:'new'}]},e);assert.deepEqual(kept.imageFraming,e.imageFraming);assert.deepEqual(kept.pickupMembers[0].imageFraming,e.pickupMembers[0].imageFraming);
 assert.equal(replacementArtwork('/assets/replacement.png','https://gagether.wiki','ko').imageFraming,undefined);
 for(const bad of [{...frame,x:201},{...frame,zoom:0},{...frame,y:Infinity},{...frame,fit:'script'}])assert.equal(entrySchema.safeParse({...item,imageFraming:{card:bad}}).success,false);
 assert.equal(settingsSchema.safeParse({layout:{game:['calendar','calendar']}}).success,false);assert.equal(settingsSchema.safeParse({layout:{game:['unknown']}}).success,false);assert.equal(settingsSchema.safeParse({layout:{game:['events','calendar']}}).success,true);
 assert.deepEqual(sectionOrder(['events','events','unknown']).slice(0,2),['events','resets']);assert.deepEqual(moveSection(['calendar','events','content'],'content','calendar'),['content','calendar','events']);
});
test('mounted image editor uses the real destination frame, drag/keyboard/zoom, isolated card framing and immutable source',async()=>{
 const x=await domSetup();let value={...item,imageFraming:{banner:{...frame,x:50,y:50}}};
 function Harness(){const [art,setArt]=React.useState(value);return provide(React.createElement(PhotoPositionEditor,{art,locale:'ko',initialBox:{kind:'banner',width:1100,height:380},onChange:p=>{value={...value,...p};setArt(value)}}));}
 try{await act(async()=>x.root.render(React.createElement(Harness)));const canvas=document.querySelector('.photo-frame-canvas');canvas.getBoundingClientRect=()=>({width:550,height:190});const img=canvas.querySelector('img');Object.defineProperties(img,{naturalWidth:{value:1920},naturalHeight:{value:1080}});
  await act(async()=>{for(const o of x.observers)o.cb([{contentRect:{width:550,height:190}}]);img.dispatchEvent(new Event('load'));});assert.ok(Math.abs(parseFloat(img.style.width)-frameGeometry({width:1920,height:1080},{width:1100,height:380},value.imageFraming.banner).width*.5)<.01);
  function pointer(type,clientX,clientY){const e=new MouseEvent(type,{bubbles:true,button:0,clientX,clientY});Object.defineProperty(e,'pointerId',{value:7});canvas.dispatchEvent(e);}
  await act(async()=>pointer('pointerdown',100,50));await act(async()=>pointer('pointermove',210,88));await act(async()=>pointer('pointerup',210,88));assert.equal(value.imageFraming.banner.x,70);assert.equal(value.imageFraming.banner.y,70);
  await act(async()=>canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',shiftKey:true,bubbles:true})));assert.equal(value.imageFraming.banner.x,60);
  const zoom=value.imageFraming.banner.zoom;await act(async()=>document.querySelector('[aria-label="확대 · 축소 −"]').click());assert.ok(value.imageFraming.banner.zoom<zoom);
  const before=structuredClone(value.imageFraming.banner);await act(async()=>[...document.querySelectorAll('.editor-art-tabs button')].find(b=>b.textContent.startsWith('카드')).click());await act(async()=>document.querySelector('.photo-zoom-control button:last-child').click());assert.ok(value.imageFraming.card);assert.deepEqual(value.imageFraming.banner,before);assert.equal(value.image,item.image);assert.equal(canvas.querySelector('img').getAttribute('src'),item.image);assert.match(canvas.textContent,/520 × 267/);assert.ok(canvas.querySelector('.photo-frame-guides'));
 }finally{await act(async()=>x.root.unmount());x.restore();}
});
test('all fifteen game reward pickers supply exact catalog items, quantity and eligibility display in four locales without promoting name provenance',async()=>{
 for(const game of games){const choices=gameRewardChoices(game.id);assert.ok(choices.length,game.id);for(const d of choices){assert.equal(d.gameId,game.id);const r=selectReward(d,{name:loc(''),sourceUrl:item.sourceUrl,sourceKind:'official',quantity:'300'});assert.equal(r.sourceUrl,item.sourceUrl);assert.equal(r.quantity,'300');assert.equal(r.icon?.image,d.icon?.image);assert.deepEqual(r.officialLocales,d.officialLocales||[]);}}
 const x=await domSetup();let value={...item};function Harness(){const [entry,setEntry]=React.useState(value);return provide(React.createElement(RewardEditor,{entry,locale:'ko',lang:'ko',onChange:p=>{value={...value,...p};setEntry(value)}}));}
 try{await act(async()=>x.root.render(React.createElement(Harness)));await act(async()=>document.querySelector('.reward-catalog-picker button').click());assert.equal(value.rewards[0].rewardId,'genshin-primogem');await act(async()=>typeValue(document.querySelector('input[inputmode="numeric"]'),'1600'));await act(async()=>typeValue(document.querySelector('.reward-edit-row textarea'),'누적 로그인 7일 · 교환 마감 공지 참고'));await act(async()=>typeValue([...document.querySelectorAll('.reward-edit-row select')].find(n=>[...n.options].some(o=>o.value==='conditional')),'conditional'));assert.equal(value.rewards[0].quantity,'1600');assert.equal(value.rewards[0].acquisition,'conditional');assert.match(value.rewards[0].note.ko,/로그인 7일/);
  for(const locale of ['ko','en','ja','zh']){const html=renderToStaticMarkup(React.createElement(RewardDetails,{entry:value,locale}));assert.match(html,/1600/);assert.ok(html.includes(value.rewards[0].name[locale]));assert.ok(html.includes('/api/reward-icons/'));}assert.equal(entrySchema.safeParse(value).success,true);
 }finally{await act(async()=>x.root.unmount());x.restore();}
});
test('layout is invisible to public editors, reorders the actual DOM, retains input on conflict, merges current settings and restores a historical order',async()=>{
 const sections=['calendar','events','content'].map(id=>({id,content:React.createElement('section',{id},id)}));let stored={settings:{brand:{name:'GAGETHER'},announcements:[{id:'keep'}],layout:{game:['calendar','events','content'],overview:['news','calendar']}},settingsRevision:2};
 const html=renderToStaticMarkup(provide(React.createElement(PageSections,{view:'game',locale:'ko',settings:stored.settings,sections,onSaved(){}}),false));assert.equal(html.includes('owner-layout-panel'),false);assert.ok(html.indexOf('id="calendar"')<html.indexOf('id="events"'));
 const x=await domSetup();let fail=true,posts=[],saved;const history={seq:8,at:stamp,old_payload:JSON.stringify({layout:{game:['content','calendar','events']}})};
 x.set('fetch',async(url,init)=>{if(String(url).includes('/history'))return {ok:true,json:async()=>({history:[history]})};if(init?.method==='POST'){posts.push(JSON.parse(init.body));if(fail)return {ok:false,status:409,json:async()=>({error:'Conflict'})};stored={settings:JSON.parse(init.body).changes,settingsRevision:stored.settingsRevision+1};return {ok:true,json:async()=>stored};}return {ok:true,json:async()=>stored};});
 try{await act(async()=>x.root.render(provide(React.createElement(PageSections,{view:'game',locale:'ko',settings:stored.settings,sections,onSaved:s=>saved=s}))));await act(async()=>document.querySelector('.owner-layout-panel>button').click());await act(async()=>document.querySelector('[aria-label="위로 · 이벤트"]').click());assert.deepEqual([...document.querySelectorAll('[data-page-section]')].map(n=>n.dataset.pageSection),['events','calendar','content']);
  await act(async()=>[...document.querySelectorAll('.owner-layout-panel button')].find(b=>b.textContent==='구성 저장').click());assert.match(document.querySelector('[role=alert]').textContent,/다른 곳/);assert.equal(saved,undefined);assert.ok(sessionStorage.getItem('gagether.owner.layout.game'));assert.equal(posts[0].revision,2);
  stored={...stored,settings:{...stored.settings,brand:{name:'Updated elsewhere'}},settingsRevision:3};await act(async()=>[...document.querySelectorAll('.owner-layout-panel button')].find(b=>b.textContent==='최신 설정과 비교').click());fail=false;await act(async()=>[...document.querySelectorAll('.owner-layout-panel button')].find(b=>b.textContent==='구성 저장').click());assert.equal(posts[1].revision,3);assert.equal(saved.brand.name,'Updated elsewhere');assert.equal(saved.announcements[0].id,'keep');assert.deepEqual(saved.layout.overview,['news','calendar']);assert.equal(saved.layout.game[0],'events');assert.equal(sessionStorage.getItem('gagether.owner.layout.game'),null);
  await act(async()=>[...document.querySelectorAll('.owner-layout-panel button')].find(b=>b.textContent==='구성 변경 이력').click());await act(async()=>document.querySelector('.owner-layout-history button').click());assert.equal(document.querySelector('[data-page-section]').dataset.pageSection,'content');await act(async()=>[...document.querySelectorAll('.owner-layout-panel button')].find(b=>b.textContent==='구성 저장').click());assert.equal(saved.layout.game[0],'content');
 }finally{await act(async()=>x.root.unmount());x.restore();}
});
test('grid and public frame use identical saved transforms including explicit enlargement on mobile, banners and high DPI',async()=>{
 const {default:ArtworkMedia}=await import('../components/artwork-media.tsx');const x=await domSetup();
 try{for(const banner of [true,'version'])for(const width of [390,1100])for(const ratio of [1,3]){
  Object.defineProperty(window,'devicePixelRatio',{value:ratio,configurable:true});const box={kind:width===390?'mobile':'banner',width,height:380,banner},art={...item,imageFraming:{default:{x:67,y:41,zoom:3,fit:'cover'}}};
  await act(async()=>x.root.render(provide(React.createElement('div',null,React.createElement('div',{className:'grid'},React.createElement(ArtworkMedia,{art,locale:'ko',alt:'Grid',frameBox:box,banner,editorPreview:true})),React.createElement('div',{className:'public'},React.createElement(ArtworkMedia,{art,locale:'ko',alt:'Public',banner}))))));
  const imgs=[...document.querySelectorAll('img')];for(const img of imgs)Object.defineProperties(img,{naturalWidth:{value:1920,configurable:true},naturalHeight:{value:1080,configurable:true}});
  await act(async()=>{let i=0;for(const o of x.observers)o.cb([{contentRect:{width:width*(i++%2===0?.5:1),height:380*(i%2===1?.5:1)}}]);for(const img of imgs)img.dispatchEvent(new Event('load'));window.dispatchEvent(new Event('resize'));});
  const grid=document.querySelector('.grid img'),pub=document.querySelector('.public img');assert.ok(parseFloat(pub.style.width)>1920,'manual zoom must exceed source width');assert.equal(parseFloat(pub.style.width),parseFloat(grid.style.width)*2);assert.equal(grid.src,pub.src);assert.ok(!grid.src.includes('resized'));
  for(const axis of ['left','top','width','height'])assert.ok(Math.abs(parseFloat(pub.parentElement.style[axis])-parseFloat(grid.parentElement.style[axis])*2)<.01,axis);
 }}finally{await act(async()=>x.root.unmount());x.restore();}
});
