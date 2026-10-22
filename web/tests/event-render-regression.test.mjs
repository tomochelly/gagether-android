import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {default:Radar}=await import('../components/radar.tsx');
const {NativeIcon}=await import('../components/reward-display.tsx');
const {artworkForLocale,detailArtworkForLocale}=await import('../lib/artwork.ts');
const {eventOverviewItems}=await import('../lib/event-overview-items.ts');
const {rewardAssets,rewardAssetUrl}=await import('../lib/reward-assets.ts');
const now=Date.parse('2026-10-20T16:00:00Z');
const title={ko:'보상 이벤트',en:'Reward event',ja:'報酬イベント',zh:'奖励活动'};
const summary={ko:'조건을 달성하면 재화를 받습니다.',en:'Complete the objectives for rewards.',ja:'条件達成で報酬を獲得できます。',zh:'完成条件即可获取奖励。'};
const base={id:'reviewed-event',gameId:'wuwa',region:'global',kind:'event',server:'Asia · UTC+8',title,summary,startAt:'2026-10-15T10:00:00+08:00',endAt:'2026-10-22T04:00:00+08:00',sourceUrl:'https://wutheringwaves.kurogames.com/kr/main/news',sourceTitle:'Original notice',publishedAt:null,verifiedAt:'2026-10-20T12:00:00Z'};
const asset=(image,locale)=>({image,imageLocale:locale,imageVerified:true,imageSource:base.sourceUrl,width:1920,height:1080,verifiedAt:base.verifiedAt});

test('foreign images cannot bypass locale matching through legacy cropped previews',()=>{
 const art={...asset('/assets/japanese.png','ja'),previewBounds:{left:30,top:20,right:70,bottom:80},textFreePreview:true,originalLanguageFallback:true};
 for(const mode of ['preview','full']){
  assert.equal(artworkForLocale(art,'ko',mode,'ja').image,undefined);
  assert.equal(artworkForLocale({...art,previewArtwork:art},'ko',mode,'ja').image,undefined);
  assert.equal(artworkForLocale({...art,localizedArtwork:{ko:art}},'ko',mode,'ja').image,undefined);
 }
 assert.equal(artworkForLocale({...art,localizedArtwork:{ko:asset('/assets/ko.png','ko')}},'ko','full').image,'/assets/ko.png');
 const entry={...base,...asset('/assets/ko.png','ko'),detailImages:[asset('/assets/ko.png','ko'),asset('/assets/ja.png','ja'),asset('/assets/guide-ko.png','ko'),asset('/assets/guide-ko.png','ko')]};
 assert.deepEqual(detailArtworkForLocale(entry,'ko').map(a=>a.image),['/assets/guide-ko.png']);
 assert.equal(entry.detailImages.length,4,'stored originals remain untouched');
});

test('duplicate event cards collapse without merging different events, windows or services',()=>{
 const richer={...base,id:'reviewed-copy',editor:{revision:1},detailSections:[{title,body:summary}]};
 const another={...base,id:'different-event',title:{...title,ko:'또 다른 보상 이벤트'}};
 const otherWindow={...base,id:'other-window',endAt:'2026-10-24T04:00:00+08:00'};
 const otherService={...base,id:'other-service',region:'jp'};
 const foreign={...base,id:'untranslated',title:{...title,ko:title.ja},summary:{...summary,ko:summary.ja}};
 const missing={...base,id:'missing',title:{...title,ko:''}};
 const rows=eventOverviewItems([base,richer,another,otherWindow,otherService,foreign,missing],'ko',now);
 assert.deepEqual(new Set(rows.map(e=>e.id)),new Set([richer.id,another.id,otherWindow.id,otherService.id]));
 assert.equal(rows.filter(e=>e.sourceUrl===base.sourceUrl).length,4,'a shared version notice does not mean a shared event');
});

test('actual dashboard renders each event once, keeps notices, and uses the selected language',()=>{
 const notice={...base,id:'notice',kind:'update',title:{ko:'업데이트 안내',en:'Update notice',ja:'更新案内',zh:'更新公告'}};
 const copy={...base,id:'reviewed-copy'};
 const foreign={...base,id:'foreign-only',title:{ko:title.ja,en:'',ja:title.ja,zh:''},summary:{ko:summary.ja,en:'',ja:summary.ja,zh:''}};
 for(const locale of ['ko','en','ja','zh']){
  const markup=renderToStaticMarkup(React.createElement(Radar,{initialLocale:locale,initialLocaleManual:true,initialData:{entries:[base,copy,notice,...(locale==='ko'?[foreign]:[])],settings:{},sourceChecks:[],serverTime:new Date(now).toISOString()}}));
  const dom=new JSDOM(markup);const doc=dom.window.document;
  assert.equal(doc.querySelectorAll('.event-tile').length,1,locale);
  assert.equal(doc.querySelector('.event-title').textContent,title[locale]);
  assert.ok(!doc.querySelector('.main-content').textContent.includes(title[locale]),'event not repeated below its dedicated list');
  assert.ok(doc.querySelector('.main-content').textContent.includes(notice.title[locale]),'update feed retained');
  if(locale==='ko')assert.doesNotMatch(doc.querySelector('.event-overview').textContent,/[\p{Script=Hiragana}\p{Script=Katakana}]/u);
  dom.window.close();
 }
});

test('reward icons resolve reviewed originals locally and recover after changing a failed source',async()=>{
 const a=rewardAssets[0];const local=rewardAssetUrl(a.sourceImage);
 assert.match(local,/^\/api\/reward-icons\//);assert.ok(local.endsWith(a.sha256));
 assert.equal(rewardAssetUrl('/api/media/owner-image'),'/api/media/owner-image');
 const dom=new JSDOM('<div id="root"></div>');const saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true})};
 for(const k of ['window','document','HTMLElement','Node','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 let root;
 try{
  root=createRoot(document.getElementById('root'));
  const icon={image:'https://example.com/old.png',imageSource:base.sourceUrl,width:64,height:64,verifiedAt:base.verifiedAt};
  await act(async()=>root.render(React.createElement(NativeIcon,{icon,alt:'Reward'})));
  await act(async()=>document.querySelector('img').dispatchEvent(new Event('error')));
  assert.equal(document.querySelector('img'),null);
  await act(async()=>root.render(React.createElement(NativeIcon,{icon:{...icon,image:a.sourceImage},alt:'Reward'})));
  assert.equal(document.querySelector('img').getAttribute('src'),local);assert.equal(document.querySelector('img').hidden,false);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k]}}
});
