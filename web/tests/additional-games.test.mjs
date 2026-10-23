import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
const {games}=await import('../lib/games.ts'),{mobileFeed}=await import('../lib/mobile.ts'),{legacyMobileGameIds,supportsExpandedCatalog}=await import('../lib/mobile-compatibility.ts'),{safeSource}=await import('../lib/types.ts'),{collectionCoverage}=await import('../lib/collection-review.ts'),{normalizeGameOrder}=await import('../lib/game-order.ts');
const {parseSteamEvents,steamGames,steamBodyHtml,parseDnaNotices,additionalOfficialSources}=await import('../lib/additional-game-notices.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {sourceDocument}=await import('../lib/collection-review.ts');
const text=s=>({ko:s,en:s,ja:s,zh:s});
test('catalog expands to eighteen without changing old ordering, private preferences or the three CN catalogs',()=>{
 assert.equal(games.length,18);for(const id of ['limbus','dna','holodreams']){const g=games.find(g=>g.id===id);assert.ok(g);assert.equal(g.serviceMode,'shared-global');assert.deepEqual(g.regions,['global']);for(const l of ['ko','en','ja','zh'])assert.ok(g.name[l]);}
 assert.deepEqual(games.filter(g=>g.regions.includes('cn')).map(g=>g.id).sort(),['arknights','gfl2','reverse1999']);
 const before=['zzz','wuwa'],after=normalizeGameOrder(before,games.map(g=>g.id));assert.deepEqual(after.slice(0,2),before);assert.deepEqual(after.slice(-3),['limbus','dna','holodreams']);assert.deepEqual(before,['zzz','wuwa']);
 assert.equal(collectionCoverage([]).find(r=>r.gameId==='dna').status,'not-applicable');
});
test('distributed native apps retain a fifteen-game feed while the update receives all eighteen',()=>{
 for(const ua of ['GAGETHER-Android/1.0.2','Mozilla Android GAGETHER/1.0.2','GAGETHER/0.2.2'])assert.equal(supportsExpandedCatalog(ua),false);
 for(const ua of [null,'Mozilla/5.0','GAGETHER/1.0.3','GAGETHER-Android/1.1.0','GAGETHER/2.0.0'])assert.equal(supportsExpandedCatalog(ua),true);
 const entries=games.map(g=>({id:'compat-'+g.id,gameId:g.id,region:effectiveRegion(g,'kr'),kind:g.id==='dna'?'event':'pickup',title:text(g.id),summary:text(''),server:'Global',startAt:'2026-10-20T00:00:00Z',endAt:'2026-11-01T00:00:00Z',sourceUrl:g.official,sourceTitle:'Source',verifiedAt:'2026-10-23T00:00:00Z',publishedAt:null}));
 const modern=mobileFeed(entries,{},'ko'),old=mobileFeed(entries,{},'ko',legacyMobileGameIds);assert.equal(modern.games.length,18);assert.equal(old.games.length,15);assert.equal(old.entries.length,15);assert.ok(old.entries.every(e=>legacyMobileGameIds.includes(e.gameId)));
});
test('Steam native bodies require the exact app, publisher and language; metadata windows never become gameplay dates',()=>{
 for(const gameId of ['limbus','dna','holodreams'])for(const locale of gameId==='limbus'?['ko','en','ja']:['ko','en','ja','zh']){
  const c=steamGames[gameId],language={ko:4,en:0,ja:10,zh:gameId==='dna'?7:6}[locale],body={clanid:String(c.clan),language,headline:'Native title',body:'[p]Current official facts[/p][img]{STEAM_CLAN_IMAGE}/'+c.clan+'/exact.png[/img]',posttime:1792462438},event={gid:'692023294602250673',appid:c.app,clan_steamid:c.clanSteam,published:1,hidden:false,announcement_body:body,rtime32_start_time:1,rtime32_end_time:9999999999};
  const [n]=parseSteamEvents({success:1,events:[event]},gameId,locale);assert.ok(safeSource(n.url,gameId));assert.equal(n.publishedAt,'2026-10-20T02:13:58.000Z');assert.equal(n.startAt,undefined);assert.equal(n.endAt,undefined);assert.ok(n.bodyHtml.includes('/images/'+c.clan+'/exact.png'));assert.ok(!n.bodyHtml.includes('/images/'+c.clan+'/'+c.clan));
  assert.deepEqual(parseSteamEvents({success:1,events:[{...event,announcement_body:{...body,language:99}},{...event,appid:1},{...event,hidden:true}]},gameId,locale),[]);
 }
 assert.equal(additionalOfficialSources.length,15);assert.ok(!steamBodyHtml('<script>alert(1)</script>[img]javascript:alert(1)[/img]').includes('<script>'));
});
test('DNA native website uses the game identity and real publication order, not pinned placement',()=>{
 const row={id:'9441',website_id:76,category_id:867,title:'여명 속으로',online_at:1792462438,body:'<p>Native official body and conditions.</p>'};
 const rows=parseDnaNotices({code:0,data:{data:[{...row,id:'1',online_at:1},row,{...row,id:'2',website_id:3}]}},'ko');assert.equal(rows.length,2);assert.equal(rows[0].id,'9441');assert.ok(safeSource(rows[0].url,'dna'));assert.equal(sourceDocument(rows[0].bodyHtml,rows[0].url).access,'body');
 assert.throws(()=>parseDnaNotices({code:503},'ko'));
});

test('bot catalog accepts the production-to-expanded transition and rejects incomplete, duplicate or unknown games',async()=>{
 const {catalogGamesSupported}=await import('../discord/src/catalog.ts');
 assert.equal(catalogGamesSupported(games.slice(0,15)),true);
 assert.equal(catalogGamesSupported(games),true);
 assert.equal(catalogGamesSupported(games.slice(0,17)),false);
 assert.equal(catalogGamesSupported([...games.slice(0,17),games[0]]),false);
 assert.equal(catalogGamesSupported([...games.slice(0,17),{id:'untrusted'}]),false);
 assert.equal(catalogGamesSupported(null),false);
});
