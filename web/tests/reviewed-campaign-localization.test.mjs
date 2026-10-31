import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const {reviewedPickupLocalization:localize}=await import('../lib/reviewed-pickup-localization.ts');
const {displaySummary}=await import('../lib/content-display.ts');
const rows=JSON.parse(fs.readFileSync(new URL('./fixtures/reviewed-campaign-localization.json',import.meta.url)));
const locales=['en','ja','zh'];

test('exact live campaign rows localize copied foreign text while preserving Korean, clocks, server and originals',()=>{
 for(const row of rows){const before=structuredClone(row),next=localize(row);assert.notStrictEqual(next,row,row.id);
  assert.equal(next.title.ko,row.title.ko);assert.equal(next.summary.ko,row.summary.ko);
  for(const key of ['id','gameId','region','server','kind','poolType','contentRole','selectionCount','startAt','endAt','startDate','endDate','sourceUrl','verifiedAt','image','imageSource','imageFraming','localizedArtwork','sourceBodies'])assert.strictEqual(next[key],row[key],row.id+' '+key);
  for(const locale of locales)assert.doesNotMatch(displaySummary(next,locale),/[가-힣]/,row.id+' '+locale);
  assert.deepEqual(row,before);assert.strictEqual(localize(next),next);
 }
});
test('selection candidates and distributed characters keep their actual mechanics and content kinds',()=>{
 const pool=rows.find(e=>e.id.endsWith('-pilgrim')),next=localize(pool);assert.equal(next.title.en,'Pilgrim Selective Recruitment');assert.equal(next.title.ja,'ピルグリム選択募集');assert.equal(next.title.zh,'朝聖者選擇招募');
 assert.strictEqual(next.pickupMembers,pool.pickupMembers);assert.ok(next.pickupMembers.every(m=>m.role==='candidate'));assert.equal(next.selectionCount,pool.selectionCount);
 assert.match(next.summary.en,/4%/);assert.match(next.summary.en,/1%/);assert.match(next.summary.en,/change your target anytime/);
 const gift=rows.find(e=>e.id.endsWith('-231')),translated=localize(gift);assert.equal(translated.kind,'event');assert.equal(translated.pickupMembers,gift.pickupMembers);assert.match(translated.summary.en,/distribution/);assert.match(translated.summary.ja,/一般募集/);
 const wronglyRetyped={...gift,kind:'pickup'};assert.strictEqual(localize(wronglyRetyped),wronglyRetyped);
});
test('wrong service/source, later collection and owner per-locale clears override supplemental copy',()=>{
 for(const row of rows){for(const patch of [{region:'cn'},{sourceUrl:'https://example.test/different'},{id:row.id+'-new'},{kind:'notice'}]){const changed={...row,...patch};assert.strictEqual(localize(changed),changed);}
  const owner={...row,editor:{revision:12,fields:['title','summary','timingNote','pickupMembers','detailSections']}};assert.strictEqual(localize(owner),owner);
  const newer={...row,summary:{...row.summary,en:'Later official content',zh:''}};const next=localize(newer);assert.equal(next.summary.en,newer.summary.en);assert.equal(next.summary.zh,'');
 }
});
test('Japanese recruitment translations retain the original native names and exact maintenance-bound dates',()=>{
 for(const row of rows.filter(e=>e.gameId==='bluearchive'&&e.kind==='pickup')){const next=localize(row);assert.strictEqual(next.title,row.title);assert.strictEqual(next.pickupMembers,row.pickupMembers);assert.match(next.summary.ja,/10月28日メンテナンス後～11月11日10:59（JST）/);assert.match(next.summary.en,/Hifumi \(Racing\).*Azusa \(Racing\)/);assert.equal(next.sourceUrl,'https://bluearchive.jp/news/newsJump/704');}
});
test('Japanese racing event separates participation, distribution and reward exchange from its battle deadline',()=>{
 const row=rows.find(e=>e.id==='review-bluearchive-jp-engines-20261028'),next=localize(row);
 assert.equal(next.kind,'event');assert.strictEqual(next.title,row.title);assert.strictEqual(next.image,row.image);assert.equal(next.endAt,row.endAt);
 assert.match(next.summary.en,/Area 2-3/);assert.match(next.summary.en,/★1 Rana/);assert.match(next.summary.en,/Reward exchange closes November 18 at 10:59/);assert.match(next.summary.ja,/★1「ラナ」/);assert.match(next.summary.zh,/★1「拉娜」/);
 assert.equal(next.sourceUrl,'https://bluearchive.jp/news/newsJump/706');assert.equal(next.summary.ko,row.summary.ko);
 assert.equal(next.detailSections[0].body.en,next.summary.en);assert.equal(next.detailSections[0].body.ja,next.summary.ja);assert.equal(next.detailSections[0].body.zh,next.summary.zh);assert.equal(next.detailSections[0].body.ko,row.detailSections[0].body.ko);assert.strictEqual(next.sourceBodies,row.sourceBodies);
});
test('event section copy preserves later native/owner text, explicit clears, titles and sibling sections',()=>{
 const row=rows.find(e=>e.id==='review-bluearchive-jp-engines-20261028'),section=row.detailSections[0];
 const edited={...row,editor:{revision:4,fields:['detailSections.0.body.en']}};assert.equal(localize(edited).detailSections[0].body.en,section.body.en);
 const native={...row,detailSections:[{...section,body:{...section.body,en:'Newer English content',zh:''}},section]};const next=localize(native);assert.equal(next.detailSections[0].body.en,'Newer English content');assert.equal(next.detailSections[0].body.zh,'');assert.strictEqual(next.detailSections[1],section);
 const retitled={...row,detailSections:[{...section,title:{...section.title,ja:'Later title'}}]};assert.strictEqual(localize(retitled).detailSections,retitled.detailSections);
 assert.deepEqual(row.detailSections[0].body,section.body);
});
