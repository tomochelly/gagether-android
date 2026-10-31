import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
const {normalizeGameOrder,moveGame,readGameOrder,GAME_ORDER_KEY}=await import('../lib/game-order.ts');
const {catalogEntry}=await import('../lib/catalog-index.ts');
const {retainEntityDetails}=await import('../lib/presentation.ts');
const {safeExtras}=await import('../lib/content-schema.ts');

test('custom order survives additions, invalid IDs and duplicates without changing the catalog',()=>{
 const ids=['wuwa','zzz','trickcal','hi3','reverse1999','stellasora'];
 assert.deepEqual(normalizeGameOrder(['zzz','gone','zzz','wuwa'],ids),['zzz','wuwa','trickcal','hi3','reverse1999','stellasora']);
 assert.deepEqual(moveGame(ids,'hi3',0),['hi3','wuwa','zzz','trickcal','reverse1999','stellasora']);
 assert.deepEqual(ids,['wuwa','zzz','trickcal','hi3','reverse1999','stellasora']);
 for(const raw of ['{broken',JSON.stringify({version:2,ids:['zzz']})])assert.equal(readGameOrder(raw,ids).writable,false);
});
test('reviewed details survive unchanged collectors and are deferred from list payloads',()=>{
 const art={image:'https://example.com/exact.png',imageSource:'https://example.com/news',imageVerified:true,width:1500,height:2000,verifiedAt:'2026-10-20T00:00:00Z'};
 const old={id:'notice',sourceUrl:'https://example.com/news',sourceTitle:'Notice',verifiedAt:art.verifiedAt,detailImages:[art],detailSections:[{title:{ko:'내용'},body:{ko:'검수 내용'}}]};
 const minimal={id:old.id,sourceUrl:old.sourceUrl,sourceTitle:old.sourceTitle,verifiedAt:old.verifiedAt};
 assert.deepEqual(retainEntityDetails(minimal,old).detailImages,[art]);
 assert.equal(retainEntityDetails({...minimal,sourceTitle:'Changed notice'},old).detailSections,old.detailSections);
 assert.equal(catalogEntry(old).detailImages,undefined);assert.equal(catalogEntry(old).detailSections,undefined);assert.deepEqual(old.detailImages,[art]);
 assert.equal(safeExtras(old),true);assert.equal(safeExtras({...old,detailImages:[{...art,imageVerified:false}]}),false);
});
test('image expansion and personal ordering work in the actual components across all locales',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true});
 const saved=new Map();const replace=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});};
 for(const key of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','localStorage'])replace(key,dom.window[key]);
 replace('IS_REACT_ACT_ENVIRONMENT',true);
 HTMLDialogElement.prototype.showModal=function(){this.open=true};HTMLDialogElement.prototype.close=function(){this.open=false};
 const {default:ImageLightbox}=await import('../components/image-lightbox.tsx');
 const {default:GameOrderControl,useGameOrder}=await import('../components/game-order-control.tsx');
 const name=x=>({ko:x,en:x,ja:x,zh:x}),games=['wuwa','zzz','trickcal'].map(id=>({id,name:name(id),logo:'/assets/icon.svg'}));
 function Harness({locale}){const order=useGameOrder(games);return React.createElement(React.Fragment,null,React.createElement('output',null,order.order.join(',')),React.createElement(GameOrderControl,{games:order.games,locale,order:order.order,onChange:order.update,onReset:order.reset,error:order.error,locked:order.locked}),React.createElement(ImageLightbox,{src:'https://example.com/original.png',alt:'Original',locale},React.createElement('img',{src:'https://example.com/original.png',alt:'Original'})));}
 let root=createRoot(document.getElementById('root'));
 try{
  for(const locale of ['ko','en','ja','zh']){
   await act(async()=>root.render(React.createElement(Harness,{locale})));
   await act(async()=>document.querySelector('.art-zoom-trigger').click());
   const modal=document.querySelector('.image-lightbox');assert.equal(modal.open,true);assert.ok(modal.querySelector('a').href.endsWith('/original.png'));
   const image=modal.querySelector('.image-lightbox-stage img');Object.defineProperty(image,'naturalWidth',{value:2000});Object.defineProperty(image,'naturalHeight',{value:3000});
   await act(async()=>image.dispatchEvent(new Event('load')));
   await act(async()=>modal.querySelectorAll('.image-lightbox-toolbar button')[3].click());
   assert.equal(Number.parseFloat(image.style.width),2000);assert.equal(image.src,'https://example.com/original.png');
   await act(async()=>modal.dispatchEvent(new Event('cancel',{cancelable:true})));
   assert.equal(document.querySelector('.image-lightbox'),null);assert.equal(document.documentElement.style.overflow,'');
  }
  await act(async()=>document.querySelector('.game-order-trigger').click());
  await act(async()=>document.querySelectorAll('.game-order-dialog li')[2].querySelectorAll('button')[0].click());
  assert.equal(document.querySelector('output').textContent,'wuwa,trickcal,zzz');
  assert.deepEqual(JSON.parse(localStorage.getItem(GAME_ORDER_KEY)).ids,['wuwa','trickcal','zzz']);
  await act(async()=>root.unmount());root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(Harness,{locale:'ko'})));
  assert.equal(document.querySelector('output').textContent,'wuwa,trickcal,zzz');
  await act(async()=>document.querySelector('.game-order-trigger').click());
  await act(async()=>document.querySelector('.game-order-dialog footer button').click());
  assert.equal(document.querySelector('output').textContent,'wuwa,zzz,trickcal');
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [key,d] of saved){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];}}
});


test('new Korean notice feeds reject ordinary community posts and do not invent a publication timezone',async()=>{
 const {parseNaverOfficial,parseHi3Official}=await import('../lib/expanded-notices.ts');
 const feed={feedId:8343598,loungeId:'Trickcal',title:'Official pickup notice',createdDate:'20261020170032'};
 const rows=parseNaverOfficial({code:200,content:{feeds:[{feed,user:{userRoleCode:'game_manager'}},{feed:{...feed,feedId:2},user:{userRoleCode:'common_user'}},{feed:{...feed,loungeId:'Other'},user:{userRoleCode:'game_manager'}}]}},'trickcal','Trickcal','kr');
 assert.equal(rows.length,1);assert.equal(rows[0].publishedAt,'2026-10-20');assert.match(rows[0].url,/Trickcal\/board\/detail\/8343598$/);
 assert.throws(()=>parseNaverOfficial({code:200,content:{}},'trickcal','Trickcal','kr'));
 const post={post_id:'47144334',subject:'Official',uid:'147839994',game_id:1,official_type:3,lang:'ko-kr',created_at:1792486800};
 assert.equal(parseHi3Official({retcode:0,data:{list:[{post,user:{uid:'147839994',certification:{type:1}}},{post,user:{uid:'someone-else',certification:{type:1}}}]}}).length,1);
});


test('all registered games keep verified canonical services and only the verified mainland catalogs',async()=>{
 const {games}=await import('../lib/games.ts');const {effectiveRegion}=await import('../lib/presentation.ts');const {safeSource}=await import('../lib/types.ts');
 assert.equal(games.filter(g=>!g.launch).length,18);assert.equal(games.filter(g=>g.launch).length,3);assert.equal(new Set(games.map(g=>g.id)).size,games.length);
 for(const id of ['trickcal','hi3','reverse1999','stellasora']){const g=games.find(g=>g.id===id);assert.ok(g);assert.equal(g.regions.includes('cn'),id==='reverse1999');for(const locale of ['ko','en','ja','zh'])assert.ok(g.name[locale]);}
 assert.equal(effectiveRegion(games.find(g=>g.id==='reverse1999'),'cn'),'cn');for(const g of games.filter(g=>!g.launch))assert.equal(g.regions.includes('cn'),['arknights','gfl2','reverse1999'].includes(g.id));
 assert.equal(effectiveRegion(games.find(g=>g.id==='trickcal'),'jp'),'global');assert.equal(effectiveRegion(games.find(g=>g.id==='hi3'),'jp'),'kr');
 for(const id of ['reverse1999','stellasora'])for(const region of ['kr','jp','global'])assert.equal(effectiveRegion(games.find(g=>g.id===id),region),'global');
 assert.ok(safeSource('https://steamcommunity.com/games/1672740/announcements/detail/6532949940091888','hi3'));
 assert.ok(!safeSource('https://steamcommunity.com/games/1672740/announcements/detail/6532949940091888','stellasora'));
});


test('broader community links remain references without becoming official sources',async()=>{
 const {safeReference}=await import('../lib/types.ts');
 const url='https://uma.guide/guides/release-schedule-october26';
 assert.equal(safeReference(url,'umamusume','community'),true);
 assert.equal(safeReference(url,'umamusume','official'),false);
 assert.equal(safeReference(url,'bluearchive','community'),true);
 assert.equal(safeReference(url.replace('october26','november26'),'umamusume','community'),true);
 assert.equal(safeReference('https://x.com/umamusume_eng/status/2110132265825296734','umamusume','official'),true);
 assert.equal(safeReference('https://x.com/other/status/2110132265825296734','umamusume','official'),false);
});

test('Umamusume Wikiru remains a read-only community reference for that game',async()=>{
 const {safeReference}=await import('../lib/types.ts');
 const url='https://umamusume.wikiru.jp/?'+encodeURIComponent('［Boho Flare］ゴールドシチー');
 assert.equal(safeReference(url,'umamusume','community'),true);
 assert.equal(safeReference(url,'umamusume','official'),false);
 assert.equal(safeReference(url,'arknights','community'),true);
 assert.equal(safeReference('https://umamusume.wikiru.jp/?cmd=edit&page=Gold','umamusume','community'),false);
 assert.equal(safeReference('https://127.0.0.1/private','umamusume','community'),false);
});
