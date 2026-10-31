import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import records from '../content/wuwa-upcoming-3-8.json' with {type:'json'};
const {entrySchema,safeExtras,safePickupArchive}=await import('../lib/content-schema.ts');
const {seedEntries}=await import('../lib/seed.ts');
const {timedSchedule}=await import('../lib/pickup-history.ts');
const {pickupStartLabel,estimateSourceLabel,estimateScopeLabel}=await import('../lib/pickup-estimates.ts');
const {upcomingPickups}=await import('../lib/upcoming-pickups.ts');
const {entryDiscoveryMetadata,entryStructuredData,entryPath}=await import('../lib/discovery.ts');
const {default:Radar}=await import('../components/radar.tsx');
const {default:DocumentReader}=await import('../components/document-reader.tsx');
const {emptyCatalog}=await import('../lib/initial-shell.ts');
const lily=records.find(e=>e.id==='wuwa-3-8-lily'),version=records.find(e=>e.id==='wuwa-version-3-8');

test('owner-authorized November12 plan is a separate version estimate and never an official banner clock or invented duration',()=>{
 for(const e of records){assert.ok(entrySchema.safeParse(e).success,JSON.stringify(entrySchema.safeParse(e).error?.issues));assert.equal(safeExtras(e),true);assert.equal(safePickupArchive(e),true);assert.equal(seedEntries.filter(x=>x.id===e.id).length,1);assert.equal(e.startAt,null);assert.equal(e.endAt,null);assert.equal(e.publishedAt,null);assert.equal(e.endDate,undefined);assert.equal(e.region,'global');assert.equal(e.imageVerified,undefined);}
 assert.equal(lily.pickupArchive.status,'forecast');assert.equal(lily.pickupArchive.estimate.method,'owner');assert.equal(lily.pickupArchive.estimate.scope,'version');assert.equal(lily.pickupArchive.estimate.startDate,'2026-11-12');assert.equal(timedSchedule(lily),false);assert.equal(lily.pickupArchive.startDate,undefined);assert.equal(lily.rarity,undefined);assert.equal(lily.entityDetails,undefined);assert.equal(lily.signatureWeapons,undefined);
 assert.deepEqual(lily.videos.map(v=>v.locale),['ko','en','ja','zh']);for(const v of lily.videos){assert.equal(v.official,true);assert.equal(v.watched,false);assert.equal(v.kind,'character');}
 const timed=structuredClone(lily);timed.startAt='2026-11-12T10:00:00+09:00';assert.equal(safePickupArchive(timed),false);
 const falseOfficial=structuredClone(lily);falseOfficial.sourceKind='official';assert.equal(safePickupArchive(falseOfficial),false);
 const unknown=structuredClone(lily);unknown.pickupArchive.estimate.method='made-up';assert.equal(entrySchema.safeParse(unknown).success,false);
 const bad=structuredClone(lily);bad.pickupArchive.estimate.sourceUrls=['http://attacker.invalid/source'];assert.equal(safePickupArchive(bad),false);
 const nonOwner=structuredClone(lily);nonOwner.pickupArchive.estimate.method='community';assert.equal(safePickupArchive(nonOwner),false,'video-backed owner plans must not silently become sourced community estimates');
});

test('four native-language search pages and upcoming surfaces contain the same actual date, version and Lily identity',()=>{
 const names={ko:'릴리',en:'Lily',ja:'リリー',zh:'莉莉'},date=Date.parse('2026-10-26T00:00:00Z');
 for(const locale of ['ko','en','ja','zh']){
  const upcoming=upcomingPickups(records,locale,date);assert.equal(upcoming.length,1);assert.equal(upcoming[0].name[locale],names[locale]);assert.equal(upcoming[0].art,undefined);assert.match(pickupStartLabel(lily,locale),/2026\.11\.12/);assert.doesNotMatch(estimateSourceLabel(lily,locale),/community|커뮤니티|コミュニティ|社区/i);assert.ok(estimateScopeLabel(lily,locale).includes({ko:'버전',en:'version',ja:'バージョン',zh:'版本'}[locale]));
  for(const e of records){const meta=entryDiscoveryMetadata(e,locale);assert.ok(meta.title.includes(names[locale])||meta.title.includes('3.8'));assert.equal(meta.alternates.canonical,'https://gagether.wiki'+entryPath(locale,e));assert.equal(Object.keys(meta.alternates.languages).length,4);assert.equal(meta.keywords,undefined);assert.equal(entryStructuredData(e,locale).datePublished,undefined);const dom=new JSDOM(renderToString(React.createElement(DocumentReader,{entry:e,locale})));assert.ok(dom.window.document.body.textContent.includes({ko:'11월 12일',en:'November 12',ja:'11月12日',zh:'11月12日'}[locale]),e.id+' '+locale);assert.ok(dom.window.document.querySelector('h1').textContent.includes(e.title[locale]));dom.window.close();}
  const dom=new JSDOM(renderToString(React.createElement(Radar,{initialLocale:locale,initialLocaleManual:true,initialView:'game',initialGameId:'wuwa',initialRegion:'global',initialData:{...emptyCatalog(),persistent:true,serverTime:'2026-10-26T00:00:00Z',entries:records},initialComplete:false,initialDeferred:true}))),d=dom.window.document;
  assert.ok(d.querySelector('.upcoming-card').textContent.includes(names[locale]));assert.match(d.querySelector('.upcoming-card').textContent,/2026\.11\.12/);assert.ok(d.querySelector(`.game-version-links a[href="${entryPath(locale,version)}"]`));assert.ok(d.querySelector(`a[href="/${locale}/games/wuwa/combat"]`));dom.window.close();
 }
});
