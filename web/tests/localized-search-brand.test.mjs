import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {games}=await import('../lib/games.ts');
const {catalogMetadata,websiteStructuredDataForLocale,localeMetadataDefaults}=await import('../lib/seo.ts');
const {sectionDiscoveryMetadata,entryDiscoveryMetadata,entryStructuredData}=await import('../lib/discovery.ts');
const {directoryMetadata}=await import('../lib/content-directory.ts');
const {wuwaCombatMetadata}=await import('../lib/wuwa-combat-seo.ts');
const {reviewedPickupLocalization}=await import('../lib/reviewed-pickup-localization.ts');
const {displaySummary}=await import('../lib/content-display.ts');
const {catalogLocaleHeaders}=await import('../lib/catalog-paths.ts');
const rules=JSON.parse(readFileSync('content/reviewed-pickup-localization.json','utf8')).changes;
test('every foreign game discovery surface uses Latin brand names and localized metadata defaults',async()=>{
 for(const locale of ['en','ja','zh']){
  for(const suffix of ['search','download','games/nikke/convene'])assert.equal(catalogLocaleHeaders(new Request(`https://gagether.wiki/${locale}/${suffix}`,{headers:{'x-gagether-route-locale':'ko',cookie:'patchwork.locale=ko'}})).get('x-gagether-route-locale'),locale);
  const defaults=localeMetadataDefaults(locale);assert.doesNotMatch(JSON.stringify(defaults),/[가-힣]/);assert.doesNotMatch(JSON.stringify(websiteStructuredDataForLocale(locale)),/[가-힣]/);
  for(const game of games){for(const meta of [catalogMetadata(locale,{id:game.id,name:game.name[locale]}),sectionDiscoveryMetadata(game.id,locale,'characters'),sectionDiscoveryMetadata(game.id,locale,'leaks'),directoryMetadata(locale,game)]){assert.doesNotMatch(meta.title,/[가-힣]/,game.id+' '+locale);assert.doesNotMatch(meta.openGraph?.siteName||'',/[가-힣]/);}}
  for(const mode of [undefined,'tower-of-adversity','whimpering-wastes','endstate-matrix'])assert.doesNotMatch(wuwaCombatMetadata(locale,mode).title,/[가-힣]/);
 }
 assert.match(catalogMetadata('ko',undefined,true).title,/가게더/);assert.match(sectionDiscoveryMetadata('hsr','ko','characters').title,/가게더/);
});
test('item metadata and publisher retain the page language without altering the raw source',()=>{
 const e={id:'locale-brand',gameId:'nte',region:'global',kind:'event',title:{ko:'행사',en:'Event',ja:'イベント',zh:'活动'},summary:{ko:'보상',en:'Rewards',ja:'報酬',zh:'奖励'},sourceUrl:'https://nte.perfectworld.com/',sourceTitle:'Official announcement'},before=JSON.stringify(e);
 for(const locale of ['en','ja','zh']){const meta=entryDiscoveryMetadata(e,locale);assert.doesNotMatch(meta.title,/[가-힣]/);assert.equal(meta.openGraph.siteName,'GAGETHER');assert.equal(entryStructuredData(e,locale).publisher.name,'GAGETHER');}assert.equal(JSON.stringify(e),before);
});
test('exact untranslated future pickup copy is localized without changing clocks, blank slots, raw originals or later owner edits',()=>{
 const selected=rules.filter(r=>/review-nte-global-15-|review-umamusume-jp-2026(?:1026|1102)|review-genshin-global-72-/.test(r.entryId));assert.equal(selected.length,15);
 for(const r of selected){const e={id:r.entryId,gameId:r.gameId,region:r.region,kind:r.kind,sourceUrl:r.sourceUrl,...structuredClone(r.expected),startAt:null,startDate:'2026-11-11',endAt:null,endDate:'2026-12-02'},raw=JSON.stringify(e),out=reviewedPickupLocalization(e);assert.equal(JSON.stringify(e),raw);assert.equal(out.startDate,e.startDate);assert.equal(out.endDate,e.endDate);assert.equal(out.summary.ko,e.summary.ko);
  for(const l of ['en','ja','zh'])assert.doesNotMatch(displaySummary(out,l),/[가-힣]/);
  if(e.title)for(const l of ['ko','zh'])if(!e.title[l])assert.equal(out.title[l],'');
  const edit={...e,summary:{...e.summary,en:'Owner text'},editor:{fields:['summary.en']}};assert.equal(reviewedPickupLocalization(edit).summary.en,'Owner text');
  const unset={...e,summary:{...e.summary,en:''},editor:{fields:['summary']}};assert.equal(reviewedPickupLocalization(unset).summary.en,'');
  assert.equal(reviewedPickupLocalization({...e,sourceUrl:'https://example.com/new-announcement'}).summary.en,e.summary.en);
 }
});
