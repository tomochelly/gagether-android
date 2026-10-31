import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {feedEntry}=await import('../lib/feed-entry.ts');
const at='2026-10-20T20:00:00Z',later='2026-10-20T21:00:00Z';
const notice={id:4814,sourceLocale:'en',titles:{en:'MAIN THEME EPISODE 17: CRITICAL PHASE TRANSITION'},urls:{en:'https://www.arknights.global/news/4814'},date:'2026-10-09'};
const reviewed={...feedEntry('arknights','global',notice,at),title:{ko:'제17장 안내',en:'Episode 17 overview',ja:'第17章のご案内',zh:'第17章介绍'},officialLocales:[],translatedLocales:['ko','en','ja','zh'],summary:{ko:'검수한 본문',en:'Reviewed body',ja:'確認済みの本文',zh:'已核实正文'},detailSections:[{body:{en:'Reviewed eligibility and rewards'}}],detailImages:[{image:'/assets/original.webp',width:3840,height:2160}],startDate:'2026-10-22'};
test('unchanged originals preserve shortened titles, translations, details, images and verification time across repeated collection',()=>{
 const once=feedEntry('arknights','global',notice,later,reviewed);
 assert.deepEqual(once,reviewed);assert.deepEqual(feedEntry('arknights','global',notice,later,once),reviewed);
 assert.equal(once.sourceTitle,notice.titles.en);assert.deepEqual(once.officialLocales,[]);
});
test('a changed original invalidates old translations and reviewed content',()=>{
 const changed=feedEntry('arknights','global',{...notice,titles:{en:'UPDATED OFFICIAL NOTICE'}},later,reviewed);
 assert.deepEqual(changed.translatedLocales,[]);assert.deepEqual(changed.officialLocales,['en']);
 assert.equal(changed.sourceTitle,'UPDATED OFFICIAL NOTICE');assert.equal(changed.verifiedAt,later);
 assert.deepEqual(changed.detailSections,reviewed.detailSections);assert.equal(changed.startAt,null);
});
test('a reviewed Korean original outside the locale window stays primary until the visible original changes',()=>{
 const old={...reviewed,sourceLocale:'ko',sourceTitle:'한국 공식 원문',sourceUrl:'https://example.test/ko/4814',title:{...reviewed.title,ko:'한국 공식 원문',en:notice.titles.en},officialLocales:['ko','en'],translatedLocales:['ja','zh'],localizationSources:{ko:'https://example.test/ko/4814',en:notice.urls.en}};
 assert.deepEqual(feedEntry('arknights','global',notice,later,old),old);
 const changed=feedEntry('arknights','global',{...notice,titles:{en:'CHANGED'}},later,old);
 assert.equal(changed.sourceLocale,'en');assert.ok(!changed.officialLocales.includes('ko'));
});
test('new official locales fill pending text while keeping reviewed details',()=>{
 const old={...reviewed,title:{...reviewed.title,ja:'現地表記を確認中'},translatedLocales:['ko','en','zh']};
 const updated=feedEntry('arknights','global',{...notice,titles:{...notice.titles,ja:'公式の第17章'},urls:{...notice.urls,ja:'https://example.test/ja/4814'}},later,old);
 assert.equal(updated.title.ja,'公式の第17章');assert.deepEqual(updated.officialLocales,['ja']);
 assert.equal(updated.verifiedAt,later);assert.deepEqual(updated.detailSections,old.detailSections);
});
