import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const {games,byId}=await import('../lib/games.ts');
const {supportedLocales}=await import('../lib/catalog-paths.ts');
const {characterService,characterCanonicalPath}=await import('../lib/character-canonical.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {defaultRegionForLocale}=await import('../lib/visitor-locale.ts');
const {contentSitemapHandler,contentSitemapPaths}=await import('../lib/content-sitemap.ts');

const state={entries:[],directories:new Map(),leaks:[],calls:[],active:0,maxActive:0,async enter(){this.active++;this.maxActive=Math.max(this.maxActive,this.active);await Promise.resolve();this.active--;},persistent:true,rosterStatus:200,wrongGame:false,leakFailure:false};
globalThis.__contentSitemapFixture=state;
registerHooks({
 resolve(specifier,context,next){
  const targets={'@/lib/store':'entries','@/lib/roster-public-read':'characters','@/app/api/wuwa/library/route':'wuwa','@/lib/leaks-store':'leaks'};
  return targets[specifier]?{url:'test:content-sitemap-'+targets[specifier],shortCircuit:true}:next(specifier,context);
 },
 load(url,context,next){
  const sources={
   'test:content-sitemap-entries':'export async function readData(options){const s=globalThis.__contentSitemapFixture;s.calls.push(["entries",options]);await s.enter();return {persistent:s.persistent,entries:s.entries};}',
   'test:content-sitemap-characters':'export async function readPublicCharacterRoster(request){const s=globalThis.__contentSitemapFixture,q=new URL(request.url).searchParams,game=q.get("game");s.calls.push(["characters",game,[...q.keys()]]);await s.enter();return Response.json({data:{gameId:s.wrongGame?"hsr":game,characters:s.directories.get(game)||[]}},{status:s.rosterStatus});}',
   'test:content-sitemap-wuwa':'export async function GET(request){const s=globalThis.__contentSitemapFixture;s.calls.push(["wuwa",new URL(request.url).search]);await s.enter();return Response.json({data:{characters:s.directories.get("wuwa")||[]}},{status:s.rosterStatus});}',
   'test:content-sitemap-leaks':'export async function readLeaks(game){const s=globalThis.__contentSitemapFixture;s.calls.push(["leaks",game]);await s.enter();if(s.leakFailure)throw Error("read failed");return s.leaks;}'
  };
  return sources[url]?{format:'module',source:sources[url],shortCircuit:true}:next(url,context);
 }
});
const {GET}=await import('../app/sitemap-items.xml/route.ts');
const endpoint='https://gagether.wiki/sitemap-items.xml';
const request=(game='arknights',locale='en')=>new Request(endpoint+'?'+new URLSearchParams({game,locale}));
function reset(){state.entries=[];state.directories.clear();for(const game of games)state.directories.set(game.id,[{id:"base"}]);state.leaks=[];state.calls=[];state.active=0;state.maxActive=0;state.persistent=true;state.rosterStatus=200;state.wrongGame=false;state.leakFailure=false;}
async function xml(response){assert.equal(response.status,200);assert.match(response.headers.get('Content-Type'),/^application\/xml/);const raw=await response.text(),dom=new JSDOM(raw,{contentType:'text/xml'});assert.equal(dom.window.document.querySelector('parsererror'),null);const locations=[...dom.window.document.querySelectorAll('loc')].map(node=>node.textContent);dom.window.close();return {raw,locations};}

test('root sitemap is a bounded valid XML index without any catalog or roster reads',async()=>{
 reset();const {raw,locations}=await xml(await GET(new Request(endpoint)));
 assert.match(raw,/<sitemapindex /);assert.match(raw,/&amp;locale=/);assert.equal(locations.length,games.length*supportedLocales.length);assert.equal(new Set(locations).size,locations.length);assert.deepEqual(state.calls,[]);assert.doesNotMatch(raw,/lastmod|\/owner|\/account/);
 for(const location of locations){const u=new URL(location);assert.equal(u.pathname,'/sitemap-items.xml');assert.ok(games.some(g=>g.id===u.searchParams.get('game')));assert.ok(supportedLocales.includes(u.searchParams.get('locale')));}
 for(const query of ['?game=arknights','?game=unknown&locale=en','?game=arknights&locale=fr','?game=arknights&locale=en&page=1','?game=arknights&locale=en&locale=ja','?game=arknights&locale=en&part=characters'])assert.equal((await GET(new Request(endpoint+query))).status,404);
 assert.deepEqual(state.calls,[]);
});

test('a large multi-game catalog reads per-game sources sequentially and emits its canonical identities',async()=>{
 reset();for(const game of games)state.directories.set(game.id,Array.from({length:3000},(_,i)=>({id:game.id+'-'+i,regions:['cn']})));
 const {locations}=await xml(await GET(request()));assert.equal(locations.length,3000);assert.deepEqual(state.calls,[['entries',{index:true,gameId:'arknights'}],['characters','arknights',['game']],['leaks','arknights']]);assert.equal(state.maxActive,1);assert.ok(locations.every(path=>/^https:\/\/gagether\.wiki\/en\/games\/arknights\/characters\/arknights-\d+\?region=cn$/.test(path)));
 state.calls=[];state.directories.set('arknights',[{id:`op<&'\">`,regions:['cn']},{id:`op<&'\">`,regions:['cn']}]);const escaped=await xml(await GET(request()));assert.equal(escaped.locations.length,1);assert.equal(new URL(escaped.locations[0]).pathname.split('/').at(-1),encodeURIComponent(`op<&'\">`));assert.match(escaped.raw,/&apos;/);
});

test('all stored WuWa identities have four real character detail addresses through its directory reader',async()=>{
 reset();const reference=JSON.parse(readFileSync('content/wuwa-reference.json','utf8'));state.directories.set('wuwa',reference.characters.map(({id})=>({id})));
 for(const locale of supportedLocales){const {locations}=await xml(await GET(request('wuwa',locale)));assert.equal(locations.length,reference.characters.length+1);assert.ok(locations.some(p=>p.endsWith('/announced-lily')));assert.ok(locations.every(path=>path.startsWith('https://gagether.wiki/'+locale+'/games/wuwa/characters/')&&!path.includes('?')));}
 assert.deepEqual(state.calls,Array.from({length:4},()=>[['entries',{index:true,gameId:'wuwa'}],['wuwa','?view=directory'],['leaks','wuwa']]).flat());assert.ok(reference.characters.length>=60);
});

test('game leaves preserve archives, localized public content and actual market restrictions',async()=>{
 reset();const copy=s=>({ko:s,en:s,ja:s,zh:s}),entry={id:'old-archive',gameId:'wuwa',region:'global',kind:'update',title:copy('Stored update'),summary:copy(''),startAt:null,endAt:null,publishedAt:'2020-01-01T00:00:00Z',sourceUrl:'https://wutheringwaves.kurogames.com/',verifiedAt:'2020-01-01T00:00:00Z'};
 state.entries=[entry,{...entry,id:'hidden',hidden:true},{...entry,id:'broadcast',broadcast:{}},{...entry,id:'missing-english',title:{...entry.title,en:''}},{...entry,id:'local-kr',marketRegion:'kr'},{...entry,id:'audience-jp',audienceRegions:['jp']},{...entry,id:'wrong-game',gameId:'hsr'}];
 const {locations}=await xml(await GET(request('wuwa','en','entries')));assert.deepEqual(locations.filter(path=>path.includes('/items/')),['https://gagether.wiki/en/games/wuwa/items/old-archive']);assert.deepEqual(state.calls,[['entries',{index:true,gameId:'wuwa'}],['wuwa','?view=directory'],['leaks','wuwa']]);
 state.calls=[];const korean=await xml(await GET(request('wuwa','ko','entries')));assert.deepEqual(korean.locations.filter(path=>path.includes('/items/')).map(s=>s.split('/').at(-1)),['old-archive','missing-english','local-kr']);assert.equal(state.calls.length,3);
 state.leaks=[{id:'one',gameId:'wuwa'},{id:'other',gameId:'hsr'}];state.calls=[];const leaks=await xml(await GET(request('wuwa','en','leaks')));assert.deepEqual(leaks.locations.filter(path=>path.includes('/leaks/')),['https://gagether.wiki/en/games/wuwa/leaks/one']);assert.equal(state.calls.length,3);
});

test('read failures remain retryable errors while games without leaks remain nonempty; XML limits fail closed',async()=>{
 reset();state.persistent=false;let response=await GET(request('wuwa','en','entries'));assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.doesNotMatch(await response.text(),/<urlset/);
 reset();state.rosterStatus=503;assert.equal((await GET(request())).status,503);state.rosterStatus=200;state.wrongGame=true;assert.equal((await GET(request())).status,503);
 reset();state.leakFailure=true;assert.equal((await GET(request('wuwa','en','leaks'))).status,503);reset();assert.deepEqual((await xml(await GET(request('wuwa','en')))).locations,['https://gagether.wiki/en/games/wuwa/characters/base','https://gagether.wiki/en/games/wuwa/characters/announced-lily']);state.directories.set('wuwa',[]);assert.equal((await GET(request('wuwa','en'))).status,503);
 const tooMany=Array.from({length:50001},(_,i)=>({id:String(i)}));assert.throws(()=>contentSitemapPaths({gameId:'hsr',locale:'en',part:'characters'},tooMany),/URL limit/);
 const huge=contentSitemapHandler({entries:async()=>[],characters:async()=>Array.from({length:29000},(_,i)=>({id:'界'.repeat(190)+i})),leaks:async()=>[]});assert.equal((await huge(request('hsr'))).status,503);
});

test('shared service helper preserves existing page selection for every locale/requested service and adds truthful fallback canonicals',()=>{
 for(const game of games)for(const locale of supportedLocales)for(const regions of [undefined,['cn'],['jp','kr'],['global']])for(const requested of [undefined,'global','kr','jp','cn','invalid']){
  const character={id:'identity',regions};let expected=effectiveRegion(game,game.regions.includes(requested)?requested:defaultRegionForLocale(locale));
  if(['umamusume','arknights'].includes(game.id)&&regions?.length&&!regions.includes(expected))expected=['jp','kr','global','cn'].find(r=>regions.includes(r));
  assert.equal(characterService(game,character,locale,requested),expected,game.id+' '+locale+' '+requested);
  if(game.regions.includes(expected)&&effectiveRegion(game,expected)===expected){const path=characterCanonicalPath(locale,game,character,expected),resolved=effectiveRegion(game,new URL(path,endpoint).searchParams.get('region')||defaultRegionForLocale(locale));assert.equal(resolved,expected,game.id+' canonical '+locale+' '+requested);}
 }
 assert.equal(characterCanonicalPath('en',byId.arknights,{id:'cn-only',regions:['cn']}),'/en/games/arknights/characters/cn-only?region=cn');assert.equal(characterCanonicalPath('en',byId.umamusume,{id:'jp-only',regions:['jp']}),'/en/games/umamusume/characters/jp-only?region=jp');
});
