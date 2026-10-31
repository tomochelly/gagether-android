import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import registry from '../content/community-research-sources.json' with {type:'json'};
const m=await import('../lib/community-research-sources.ts'),{games}=await import('../lib/games.ts'),{officialXAccounts}=await import('../lib/official-x-accounts.ts');
test('18 actual games have independently verified collection targets; unavailable and past audits are explicit',()=>{
 const coverage=m.communitySourceCoverage();assert.deepEqual(coverage,{games:18,sources:73,feeds:20,listings:16,access:{body:57,'search-index':3,blocked:10,'not-checked':3}});
 for(const g of games.filter(g=>!g.launch)){const sources=m.communityResearchSources(g.id,{includeLeaks:true});assert.ok(sources.some(s=>s.collection?.enabled));assert.ok(sources.every(s=>s.gameId===g.id&&s.sourceKind==='community'&&!s.mayPublishSchedule));for(const s of sources.filter(s=>s.collection?.enabled)){assert.equal(s.sourceAccess,'body');assert.equal(s.collection.lastVerified.httpStatus,200);assert.match(s.collection.lastVerified.sha256,/^[a-f0-9]{64}$/);assert.ok((s.collection.lastVerified.itemCount||s.collection.lastVerified.articleCount)>0);}}
 const upcoming=games.filter(g=>g.launch);assert.equal(upcoming.length,3);assert.equal(coverage.games,games.filter(g=>!g.launch).length);
 for(const g of upcoming){assert.deepEqual(m.communityResearchSources(g.id,{includeLeaks:true}),[]);assert.deepEqual(m.communityResearchTargets(g.id,{includeLeaks:true}),[]);assert.deepEqual(m.collectibleCommunitySources(g.id),[]);}
 assert.deepEqual(m.communityResearchSources('not-a-game'),[]);assert.equal(m.collectibleCommunityFeeds().filter(s=>s.collection.meaning==='wiki-edit').length,18);
 assert.ok(m.communityResearchSource('reference-genshin').checkedAt.startsWith('2026-10-23'));assert.equal(m.communityResearchSource('dc-wuwa').sourceAccess,'search-index');
});

test('coverage validation permits source-free announced games but still requires every released game',()=>{
 const base={games:registry.games.map(({gameId})=>({gameId})),sources:registry.sources.map(({id,gameId})=>({id,gameId}))},before=structuredClone(base),announced=games.find(g=>g.launch);
 assert.ok(announced);assert.doesNotThrow(()=>m.validateCommunityResearchCoverage(base));
 const optional={...base,games:[...base.games,{gameId:announced.id}]};assert.doesNotThrow(()=>m.validateCommunityResearchCoverage(optional));
 assert.deepEqual(optional.sources.filter(s=>s.gameId===announced.id),[],'no fabricated source is needed for an optional announced-game row');
 const released=games.find(g=>!g.launch).id;
 for(const candidate of [
  {...base,games:base.games.filter(g=>g.gameId!==released)},
  {...base,sources:base.sources.filter(s=>s.gameId!==released)}
 ])assert.throws(()=>m.validateCommunityResearchCoverage(candidate),/Community source identity coverage mismatch/);
 const nowReleased=games.map(g=>g.id===announced.id?{...g,launch:undefined}:g);
 assert.throws(()=>m.validateCommunityResearchCoverage(base,nowReleased),/released game missing/,'a newly released game cannot keep the announced-game exemption');
 assert.deepEqual(base,before,'validation does not modify the source registry');
});

test('coverage validation rejects duplicate identities, unknown games and sources outside registered games',()=>{
 const base={games:registry.games.map(({gameId})=>({gameId})),sources:registry.sources.map(({id,gameId})=>({id,gameId}))};
 assert.throws(()=>m.validateCommunityResearchCoverage({...base,sources:[...base.sources,{...base.sources[0]}]}),/duplicate source id/);
 assert.throws(()=>m.validateCommunityResearchCoverage({...base,games:[...base.games,{...base.games[0]}]}),/duplicate registry game id/);
 assert.throws(()=>m.validateCommunityResearchCoverage({...base,games:[...base.games,{gameId:'not-a-real-game'}]}),/unknown game/);
 assert.throws(()=>m.validateCommunityResearchCoverage({...base,sources:[{...base.sources[0],gameId:'not-a-real-game'},...base.sources.slice(1)]}),/unknown game/);
 const announced=games.find(g=>g.launch);assert.throws(()=>m.validateCommunityResearchCoverage({...base,sources:[{...base.sources[0],gameId:announced.id},...base.sources.slice(1)]}),/source game is not registered/);
});
test('unofficial X and leak forums cannot turn into official feeds or default research targets',()=>{
 const official=new Set(Object.values(officialXAccounts).flat().map(v=>v.toLowerCase()));const all=m.communityResearchSources(undefined,{includeLeaks:true});for(const s of all.filter(s=>s.platform==='x')){assert.ok(!official.has(new URL(s.url).pathname.slice(1).toLowerCase()));assert.equal(s.collection,undefined);}
 assert.equal(m.communityResearchTargets('hsr').some(s=>s.routing==='leak-gate'),false);assert.ok(m.communityResearchTargets('hsr',{includeLeaks:true}).some(s=>s.id==='reddit-honkaistarrail_leaks'));
 assert.equal(m.collectibleCommunityFeeds('hsr').some(s=>s.routing==='leak-gate'),false);assert.ok(m.collectibleCommunityFeeds('hsr',{includeLeaks:true}).some(s=>s.routing==='leak-gate'));
 const modified=m.communityResearchSources('wuwa',{includeLeaks:true});modified[0].url='https://evil.example/';assert.notEqual(m.communityResearchSources('wuwa',{includeLeaks:true})[0].url,'https://evil.example/');
});
test('article URLs bind exact game/channel/host and reject public/private fetch expansion or edit actions',()=>{
 const s='arca-genshin';assert.equal(m.communityArticleURL(s,'/b/genshin/123456?p=1#comments'),'https://arca.live/b/genshin/123456');
 for(const url of ['https://evil.example/b/genshin/123','http://arca.live/b/genshin/123','https://arca.live/b/hkstarrail/123','https://user:secret@arca.live/b/genshin/123','https://arca.live/b/genshin/../hkstarrail/123','https://arca.live/b/genshin/%2f123']){
  assert.equal(m.communityArticleURL(s,url),undefined,url);
 }
 assert.equal(m.communityArticleURL('jp-wiki-genshin','https://wikiwiki.jp/star-rail/Character'),undefined);assert.equal(m.communityArticleURL('jp-wiki-genshin','https://wikiwiki.jp/genshinwiki/?cmd=delete'),undefined);assert.equal(m.communityArticleURL('unknown','https://arca.live/b/genshin/123'),undefined);
 const valid=m.communityResearchSource('jp-wiki-genshin');assert.equal(m.communityResearchSourceSchema.safeParse({...valid,collection:{...valid.collection,url:'https://127.0.0.1/private'}}).success,false);assert.equal(m.communityResearchSourceSchema.safeParse({...valid,sourceAccess:'blocked'}).success,false);
 for(const source of [
  {...valid,url:'http://wikiwiki.jp/genshinwiki/'},
  {...valid,mayPublishSchedule:true},
  {...valid,collection:{...valid.collection,allowedOrigin:'https://evil.example'}},
  {...valid,collection:{...valid.collection,allowedPathPrefix:'/star-rail/'}}
 ])assert.equal(m.communityResearchSourceSchema.safeParse(source).success,false);
});
