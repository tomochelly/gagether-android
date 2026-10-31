import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {renderToString} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const reads=[];globalThis.__directoryRead=async options=>{reads.push(options);return globalThis.__directoryData;};
registerHooks({
 resolve(specifier,context,next){if(specifier==='@/lib/store')return {url:'test:directory-store',shortCircuit:true};if(specifier==='next/navigation')return {url:'test:directory-navigation',shortCircuit:true};return next(specifier,context);},
 load(url,context,next){if(url==='test:directory-store')return {format:'module',source:'export const readData=options=>globalThis.__directoryRead(options)',shortCircuit:true};if(url==='test:directory-navigation')return {format:'module',source:'export function notFound(){const e=Error("NOT_FOUND");e.status=404;throw e}',shortCircuit:true};return next(url,context);}
});
const {directoryEntries,directoryPath,directoryMetadata,directoryPage,directoryCopy}=await import('../lib/content-directory.ts');
const {catalogMetadata}=await import('../lib/seo.ts');
const {catalogLocation,catalogLocaleHeaders}=await import('../lib/catalog-paths.ts');
const {isInitialShellRequest}=await import('../lib/initial-shell.ts');
const {default:Hub}=await import('../app/[locale]/browse/page.tsx');
const {default:Directory,generateMetadata}=await import('../app/[locale]/games/[gameId]/browse/page.tsx');
const {default:sitemap}=await import('../app/sitemap.ts');
const {games,byId}=await import('../lib/games.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {defaultRegionForLocale}=await import('../lib/visitor-locale.ts');
const locales=['ko','en','ja','zh'];
const text={ko:'과거 이벤트 보상',en:'Past event rewards',ja:'過去のイベント報酬',zh:'往期活动奖励'};
const entry=(id,extra={})=>({id,gameId:'hsr',region:'global',kind:'event',title:text,summary:text,startAt:null,endAt:null,publishedAt:null,verifiedAt:'2026-10-26T00:00:00Z',sourceUrl:'https://hsr.hoyoverse.com/',...extra});
const props=(locale='ko',gameId='hsr',query={})=>({params:Promise.resolve({locale,gameId}),searchParams:Promise.resolve(query)});

test('static all-content hub exposes every game, category and language with native links and no storage reads',async()=>{
 const before=reads.length;
 for(const locale of locales){
  const dom=new JSDOM(renderToString(await Hub({params:Promise.resolve({locale})}))),d=dom.window.document;
  assert.equal(d.querySelector('h1').textContent,directoryCopy[locale].title);assert.equal(d.querySelectorAll('.content-directory-grid article').length,games.length);
  for(const game of games){assert.ok(d.querySelector(`a[href="/${locale}/games/${game.id}/browse"]`));assert.ok(d.querySelector(`a[href="/${locale}/games/${game.id}/characters"]`));for(const kind of ['pickup','event','package','update'])assert.ok(d.querySelector(`a[href="/${locale}/games/${game.id}/browse?kind=${kind}"]`));}
  assert.equal(d.querySelectorAll('.document-languages a[href]').length,4);assert.equal(d.querySelectorAll('[hidden], [aria-hidden="true"]').length,0);dom.window.close();
 }
 assert.equal(reads.length,before);
});

test('directory keeps real past and date-only records while enforcing visibility, service and market rules without mutation',()=>{
 const original=[entry('old',{endAt:'2020-01-01T00:00:00Z'}),entry('date-only',{startDate:'2026-10-25'}),entry('no-clock'),entry('hidden',{hidden:true}),entry('video',{broadcast:{locale:'ko'}}),entry('other',{gameId:'zzz'}),entry('foreign',{marketRegion:'jp'}),entry('cash',{kind:'package',price:{currency:'JPY',amount:100},marketRegion:'jp'}),entry('offline',{collaboration:{scope:'offline'}}),entry('blank',{title:{ko:'',en:'English'}})];
 const before=structuredClone(original),selected=directoryEntries(original,byId.hsr,'ko','global','all',1);
 assert.deepEqual(selected.rows.map(e=>e.id),['date-only','old','no-clock']);assert.deepEqual(original,before);assert.equal(selected.rows[0].startAt,null);assert.equal(selected.rows[0].publishedAt,null);
 assert.equal(directoryEntries(original,byId.hsr,'ko','global','pickup',1).total,0);
});

test('server directory paginates scoped saved entries and links every detail without loading full images or bodies',async()=>{
 globalThis.__directoryData={persistent:true,entries:Array.from({length:125},(_,i)=>entry(String(i).padStart(3,'0')))};
 const before=reads.length,page=await Directory(props('en','hsr',{kind:'event',page:'2'})),dom=new JSDOM(renderToString(page)),d=dom.window.document;
 assert.deepEqual(reads.slice(before),[{index:true,gameId:'hsr'}]);assert.equal(d.querySelectorAll('.content-directory-list li').length,60);
 assert.equal(d.querySelector('.content-directory-list h2 a').getAttribute('href'),'/en/games/hsr/items/060');assert.ok(d.querySelector('a[rel="prev"][href="/en/games/hsr/browse?kind=event"]'));assert.ok(d.querySelector('a[rel="next"][href="/en/games/hsr/browse?kind=event&page=3"]'));
 assert.equal(d.querySelectorAll('img,iframe,video').length,0);assert.ok(d.querySelector('a[aria-current="page"][href="/en/games/hsr/browse?kind=event"]'));dom.window.close();
 const meta=await generateMetadata(props('en','hsr',{kind:'event',page:'2'}));assert.equal(meta.alternates.canonical,'https://gagether.wiki/en/games/hsr/browse?kind=event&page=2');assert.match(meta.title,/Honkai.*Events.*Page 2/);assert.equal(meta.keywords,undefined);
 for(const value of ['0','-1','01','10000','1.2',['2']])assert.equal(directoryPage(value),null);assert.equal(directoryPage(undefined),1);
 for(const query of [{page:'4'},{kind:'made-up'},{page:'0'}])await assert.rejects(Directory(props('en','hsr',query)),e=>e.status===404);
 globalThis.__directoryData={persistent:true,entries:[]};assert.equal((await generateMetadata(props('en','hsr',{kind:'package'}))).robots.index,false,'empty filters are usable without promoting empty search results');
 globalThis.__directoryData={persistent:false,entries:[]};await assert.rejects(Directory(props()),/Saved directory unavailable/);
});

test('canonical and language navigation preserve actual services and never advertise an absent translated page',async()=>{
 for(const game of games)for(const service of new Set(game.regions.map(r=>effectiveRegion(game,r))))for(const locale of locales){
  const metadata=directoryMetadata(locale,game,{region:service});for(const other of locales){const url=new URL(metadata.alternates.languages[other]);assert.equal(effectiveRegion(game,url.searchParams.get('region')||defaultRegionForLocale(other)),service);assert.equal(sitemap().some(p=>p.url===url.href),!game.launch);}
 }
 globalThis.__directoryData={persistent:true,entries:Array.from({length:65},(_,i)=>entry('page-'+i,{title:i<5?text:{ko:'한국어 자료'}}))};
 const meta=await generateMetadata(props('ko','hsr',{page:'2'}));assert.deepEqual(Object.keys(meta.alternates.languages),['ko']);
 const dom=new JSDOM(renderToString(await Directory(props('ko','hsr',{page:'2'}))));assert.equal(dom.window.document.querySelector('a[hreflang="en"]').getAttribute('href'),'/en/games/hsr/browse');dom.window.close();
 assert.equal(directoryPath('ko','wuwa',{region:'cn'}),'/ko/games/wuwa/browse');
});

test('root always identifies the Korean brand and pickup calendar; explicit directory routes retain their locale without slowing the fast shell',()=>{
 const titles=locales.map(l=>catalogMetadata(l,undefined,true).title);assert.equal(new Set(titles).size,1);assert.match(titles[0],/가게더 GAGETHER.*픽업 캘린더/);
 for(const locale of locales)for(const path of [`/${locale}/browse`,`/${locale}/games/hsr/browse`]){assert.equal(catalogLocation(path).locale,locale);assert.equal(catalogLocaleHeaders(new Request('https://gagether.wiki'+path,{headers:{'x-gagether-route-locale':'ja'}})).get('x-gagether-route-locale'),locale);assert.equal(isInitialShellRequest(new Request('https://gagether.wiki'+path)),false);}
 assert.equal(isInitialShellRequest(new Request('https://gagether.wiki/')),true);
});


test('the public directory omits standalone weapons while retaining support banners and original detail records',()=>{
 const character=entry('character',{kind:'pickup'}),weapon=entry('weapon',{kind:'weapon',poolType:'weapon'}),support=entry('support',{kind:'weapon',poolType:'support'}),rows=[character,weapon,support],before=JSON.stringify(rows);
 assert.deepEqual(directoryEntries(rows,byId.hsr,'ko','global','all',1).rows.map(e=>e.id).sort(),['character','support']);
 assert.deepEqual(directoryEntries(rows,byId.hsr,'ko','global','pickup',1).rows.map(e=>e.id).sort(),['character','support']);
 assert.equal(JSON.stringify(rows),before);
});
