import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const {applyMaintainedArtwork}=await import('../lib/maintained-artwork.ts');const {allowsRewards,separateEntityRewards}=await import('../lib/content-roles.ts');const {parseNteProfile,nteProfileSources,discoverNteSources,applyNteProfile}=await import('../lib/nte-profiles.ts');const {RewardDetails}=await import('../components/reward-display.tsx');const {pullRewards}=await import('../lib/event-presentation.ts');const {games}=await import('../lib/games.ts');const {validateEditedEntry}=await import('../lib/editor-schema.ts');
const stamp='2026-10-23T16:00:00Z',local=s=>({ko:s,en:s,ja:s,zh:s});const fixture=(g,kind='pickup')=>({id:'role-'+g.id,gameId:g.id,region:g.regions[0],kind,title:local('Subject'),summary:local('Facts'),server:g.publisher,sourceUrl:g.official,sourceTitle:'Source',verifiedAt:stamp,publishedAt:null,startAt:null,endAt:null});
const html=n=>readFileSync(new URL('./fixtures/nte/'+n+'.html',import.meta.url),'utf8');
test('all games and locales isolate entity stats from event rewards; event/package/update values survive',()=>{
 for(const game of games)for(const kind of ['pickup','weapon','event','package','update']){const e={...fixture(game,kind),rewards:[{name:local('Ticket'),quantity:'10',category:'gacha-ticket',sourceKind:'official',sourceUrl:game.official}],rewardNote:local('Event')};for(const locale of ['ko','en','ja','zh']){const markup=renderToStaticMarkup(React.createElement(RewardDetails,{entry:e,locale}));assert.equal(markup.includes('reward-details'),!['pickup','weapon'].includes(kind));}
  if(['pickup','weapon'].includes(kind)){assert.deepEqual(pullRewards(e),[]);assert.equal(separateEntityRewards(e).rewards,undefined);assert.equal(e.rewards.length,1);}else assert.equal(separateEntityRewards(e),e);
 }
});
test('registered originals repair only exact outfit/service omissions and remain idempotent without changing reviewed or owner images',()=>{
 const name={ko:'그윈',en:'Guin',ja:'グウィン',zh:'瑰恩'},e={...fixture(games.find(g=>g.id==='trickcal')),region:'global',title:name,pickupMembers:[{name,type:'new'}]};const next=applyMaintainedArtwork(e);assert.ok(next.image);assert.ok(next.pickupMembers[0].image);assert.equal(applyMaintainedArtwork(next),next);assert.equal(next.startAt,e.startAt);
 const wrong={...e,region:'kr'};assert.equal(applyMaintainedArtwork(wrong),wrong);const outfit={...e,title:local('Other'),pickupMembers:[{name:local('Other outfit'),type:'new'}]};assert.equal(applyMaintainedArtwork(outfit),outfit);
 const owned={...e,image:'/assets/owner.png',imageVerified:true,imageLocale:'neutral',pickupMembers:[{...e.pickupMembers[0],image:'/assets/member-owner.png',imageVerified:true,imageLocale:'neutral'}]};assert.equal(applyMaintainedArtwork(owned),owned);
});
test('current NTE source facts parse into localized character and weapon stats, exact material icons and no reward fields',()=>{
 for(let i=0;i<2;i++){const source=nteProfileSources[i],p=parseNteProfile(html(i?'moon':'akane'),source,stamp),e={...fixture(games.find(g=>g.id==='nte'),i?'weapon':'pickup'),region:'global',title:source.name,entityDetails:[p]};assert.equal(validateEditedEntry(e).ok,true);assert.equal(p.rewards,undefined);assert.equal(p.stats.length,i?4:6);assert.equal(p.materials[0].items.length,i?6:4);assert.ok(p.materials[0].items.every(x=>x.icon));if(i){assert.equal(p.stats[1].value,'570');assert.equal(p.stats[3].value,'48%');assert.match(p.groups[0].rows[0].value,/R1 16%/);}else{assert.equal(p.stats[3].value,'14,678');assert.equal(p.groups.length,5);}
  const saved=applyNteProfile(e,{...p,verifiedAt:'2026-10-23T17:00:00Z'},p);assert.equal(saved,e);assert.equal(applyNteProfile(e,{...p,stats:[]}),e,'unknown existing profile is protected');
 }
 assert.throws(()=>parseNteProfile('<html>JS shell</html>',nteProfileSources[0],stamp),/missing|identity/);
 assert.throws(()=>parseNteProfile(html('akane').replace('14678','null'),nteProfileSources[0],stamp),/Invalid/);
});
test('NTE index discovery accepts exact names/same-game fixed paths, never guesses translated names or different outfits',()=>{
 const base=fixture(games.find(g=>g.id==='nte'));const blackbird={...base,title:local('Blackbird')};const found=discoverNteSources([blackbird,{...base,id:'other',title:local('Blackbird Summer')}],html('characters'),'pickup');assert.ok(found.sources.some(s=>s.url==='https://www.kaiden.gg/nte/characters/blackbird/'));assert.equal(found.unmatched.length,1);
 const arc=discoverNteSources([{...base,kind:'weapon',title:local('Crime and Punishment')}],html('arcs'),'weapon');assert.ok(arc.sources.some(s=>s.url==='https://www.kaiden.gg/nte/arcs/crime-and-punishment/'));assert.throws(()=>discoverNteSources([base],'<html>blocked</html>','pickup'),/missing/);
});
