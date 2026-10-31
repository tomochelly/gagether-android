import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import React,{act} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {JSDOM} from 'jsdom';
const {withRosterMaterials}=await import('../lib/roster-material-data.ts');
const {materialGroupsForService,materialLocale}=await import('../lib/roster-materials.ts');
const {characterRosterSchema,rosterCharacterSchema,rosterDirectory}=await import('../lib/character-roster.ts');
const {hydrateRosterDetails}=await import('../lib/roster-detail-catalog.ts');
const {announcedCharacterPreview}=await import('../lib/roster-availability.ts');
const {timelineGameGroups}=await import('../lib/schedule-timeline.ts');
const {entrySchema,safeExtras}=await import('../lib/content-schema.ts');
const {safeSource}=await import('../lib/types.ts');
const {games}=await import('../lib/games.ts');
const {default:RosterMaterials}=await import('../components/roster-materials.tsx');
const {CharacterFacts}=await import('../components/character-roster.tsx');
const {default:ScheduleTimeline}=await import('../components/schedule-timeline.tsx');
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8')),copy=s=>({ko:s,en:s,ja:s,zh:s});
const rosters=read('content/character-rosters/bootstrap.json'),requirements=read('content/roster-material-requirements.json');
test('all 11 material catalogs join the canonical identity, preserve original facts, and leave directories small',async()=>{
 const counts={},fixtures=[];for(const r of rosters){if(!requirements.games[r.gameId])continue;let count=0;for(const row of r.characters){const c=await hydrateRosterDetails(r,row),before=JSON.stringify(c),detail=await withRosterMaterials(r.gameId,c);assert.equal(JSON.stringify(c),before);rosterCharacterSchema.parse(detail);if(detail.materialGroups?.length){count++;if(!fixtures.some(x=>x.game===r.gameId))fixtures.push({game:r.gameId,character:detail});const compact=rosterDirectory({...r,characters:[detail]}).characters[0];assert.equal(compact.materialGroups,undefined);assert.equal(compact.detailsDeferred,true);assert.ok(detail.materialGroups.every(g=>g.items.every(i=>Object.values(i.name).some(Boolean)&&Number(i.quantity)>=0)));}if(c.availability?.status==='announced')assert.equal(detail.materialGroups,undefined);}counts[r.gameId]=count;}
 assert.equal(Object.keys(counts).length,11);assert.ok(Object.values(counts).every(n=>n>0));mkdirSync('work/reading-qa',{recursive:true});writeFileSync('work/reading-qa/characters.json',JSON.stringify(fixtures));writeFileSync('work/reading-material-counts.json',JSON.stringify(counts));
});
test('saved quantities and regional costs remain authoritative; no fabricated fallback icons',async()=>{
 const base={id:'1011',name:copy('Owner'),sourceUrl:'https://example.org/owner',sourceKind:'community',sections:[{id:'zzz-materials-core',title:copy('Core'),body:copy('Unknown native item × 37'),regions:['kr']}]};
 const c=await withRosterMaterials('zzz',base),saved=c.materialGroups.find(g=>g.originalSectionId);assert.equal(saved.items[0].quantity,37);assert.equal(saved.items[0].icon,undefined);assert.equal(saved.sourceUrl,base.sourceUrl);assert.equal(materialGroupsForService([saved],'global').length,0);assert.equal(materialGroupsForService([saved],'kr').length,1);assert.equal(materialLocale({ja:'日本語'},'ko'),'ja');assert.equal(await withRosterMaterials('zzz',{...base,availability:{status:'announced',sourceUrl:base.sourceUrl}}).then(c=>c.materialGroups),undefined);
});
test('native sprite coordinates, exact quantities, and source-stage selectors render in all locales',async()=>{
 const r=rosters.find(r=>r.gameId==='dna'),c=await withRosterMaterials('dna',r.characters.find(c=>requirements.games.dna[c.id]));
 const h=rosters.find(r=>r.gameId==='hsr'),staged=await withRosterMaterials('hsr',h.characters[0]);
 for(const locale of ['ko','en','ja','zh']){const doc=new JSDOM(renderToStaticMarkup(React.createElement(RosterMaterials,{character:c,locale,service:'global'}))).window.document;assert.ok(doc.querySelectorAll('li').length);assert.ok(doc.querySelector('.roster-material-sprite img')?.getAttribute('style').includes('translate('));assert.ok(doc.querySelector('li b').textContent.startsWith('× '));const stages=new JSDOM(renderToStaticMarkup(React.createElement(RosterMaterials,{character:staged,locale,service:'global'}))).window.document;assert.ok(stages.querySelectorAll('select').length);}
});
test('timeline groups keep catalog order and true time order without altering source',()=>{
 const mark=(id,gameId,at,dateOnly=false)=>({entry:{id,gameId},kind:'starts',at,dateOnly});const input=[mark('late','zzz','2026-11-01T10:00:00Z'),mark('day','zzz','2026-11-01',true),mark('first','hsr','2026-11-01T12:00:00+09:00'),mark('early','zzz','2026-11-01T13:00:00+09:00')],before=JSON.stringify(input),groups=timelineGameGroups(input,['hsr','zzz']);assert.deepEqual(groups.map(g=>g.gameId),['hsr','zzz']);assert.deepEqual(groups[1].marks.map(m=>m.entry.id),['early','late','day']);assert.equal(JSON.stringify(input),before);
});
test('timeline expands only the chosen game and opens the exact entry',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko',pretendToBeVisual:true}),previous=new Map();for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','StorageEvent','localStorage','sessionStorage']){previous.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:dom.window[k],configurable:true,writable:true});}previous.set('IS_REACT_ACT_ENVIRONMENT',Object.getOwnPropertyDescriptor(globalThis,'IS_REACT_ACT_ENVIRONMENT'));globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));let opened;const entries=['zzz','hsr'].flatMap(gameId=>[1,2,3].map(n=>({id:gameId+n,gameId,kind:'event',region:'global',title:copy(gameId+n),summary:copy(''),startDate:'2026-11-01',startAt:null,endAt:null})));
 try{await act(async()=>root.render(React.createElement(ScheduleTimeline,{entries,locale:'ko',now:Date.parse('2026-10-31T00:00:00Z'),onOpen:e=>opened=e.id})));const groups=[...document.querySelectorAll('.timeline-game-group')];assert.equal(groups.length,2);assert.deepEqual(groups.map(g=>g.querySelectorAll('.timeline-entry').length),[2,2]);await act(async()=>groups[0].querySelector('.timeline-more').click());assert.deepEqual(groups.map(g=>g.querySelectorAll('.timeline-entry').length),[3,2]);await act(async()=>groups[0].querySelectorAll('.timeline-entry')[2].click());assert.ok(entries.some(e=>e.id===opened));assert.equal(groups[0].querySelector('.timeline-entry time'),null);}finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of previous)if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}
});
test('Silver Palace has the exact official date, standard framework, and 15 native profiles without beta stats',()=>{
 const game=games.find(g=>g.id==='silver-palace');assert.equal(game.launch.fullPage,true);assert.equal(game.launch.dates.global,'2026-12-14');const entry=entrySchema.parse(read('content/silver-palace-launch.json')[0]);assert.equal(safeSource(entry.sourceUrl,game.id),true);assert.equal(safeExtras(entry),true);assert.equal(entry.startAt,null);assert.equal(entry.startDate,'2026-12-14');assert.deepEqual(entry.officialLocales,['ko']);
 const data=characterRosterSchema.parse(read('content/silver-palace-roster.json'));assert.equal(data.characters.length,15);for(const c of data.characters){const safe=announcedCharacterPreview(c);assert.equal(safe.stats,undefined);assert.equal(safe.materialGroups,undefined);assert.equal(safe.sections.length,1);for(const locale of ['ko','en','ja','zh']){assert.ok(c.name[locale]);const html=renderToStaticMarkup(React.createElement(CharacterFacts,{character:safe,locale,service:'global',gameId:game.id}));assert.ok(new JSDOM(html).window.document.body.textContent.includes(c.sections[0].body[locale].slice(0,15)));}}assert.ok(data.characters.some(c=>c.name.ko==='그라티아·기사'));assert.equal(games.find(g=>g.id==='azur-promilia').launch.fullPage,undefined);
});
