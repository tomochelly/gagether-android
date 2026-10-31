import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rule=JSON.parse(readFileSync('content/reviewed-source-excerpt.json','utf8'));
const {reviewedPublicSummary}=await import('../lib/reviewed-public-summary.ts');
const {displaySummary}=await import('../lib/content-display.ts');
const fixture=()=>({id:rule.id,gameId:rule.gameId,region:rule.region,sourceUrl:rule.sourceUrl,sourceKind:rule.sourceKind,sourceLocale:rule.sourceLocale,summary:{ko:rule.expected.ko,en:'English details',ja:'日本語の詳細',zh:'中文详情'}});
const body=()=>({locale:'ko',sourceUrl:rule.sourceUrl,bodyHash:rule.bodyHash,text:rule.nativeText});
test('exact auto excerpt uses the same complete sentence on index and full detail without changing the capture',()=>{
 for(const entry of [fixture(),{...fixture(),sourceBodies:{ko:body()}}]){
  const original=JSON.stringify(entry);
  assert.equal(displaySummary(entry,'ko'),rule.proposed.ko);
  assert.ok(displaySummary(entry,'ko').endsWith('확인해 주세요.'));
  for(const locale of ['en','ja','zh'])assert.equal(displaySummary(entry,locale),entry.summary[locale]);
  assert.equal(JSON.stringify(entry),original);
 }
});
test('changed identity, excerpt, native body or owner fields never match the captured excerpt recovery',()=>{
 const entry=fixture();
 for(const patch of [{id:'another'}, {gameId:'zzz'},{region:'kr'},{sourceLocale:'en'},{sourceKind:'community'},{sourceUrl:'https://example.com/'},{summary:{...entry.summary,ko:rule.expected.ko+'은'}}])assert.equal(reviewedPublicSummary({...entry,...patch},'ko'),undefined);
 for(const patch of [{bodyHash:'changed'},{text:rule.nativeText+'\nNew native condition'},{locale:'en'},{sourceUrl:'https://example.com/'}])assert.equal(reviewedPublicSummary({...entry,sourceBodies:{ko:{...body(),...patch}}},'ko'),undefined);
 assert.equal(reviewedPublicSummary({...entry,sourceBodies:{}},'ko'),undefined);
 for(const path of ['summary','summary.ko','summary.en','sourceBodies','sourceBodies.ko','sourceBodies.ko.text'])assert.equal(reviewedPublicSummary({...entry,editor:{fields:[path]}},'ko'),undefined);
 assert.equal(reviewedPublicSummary({...entry,editor:{fields:['image']}},'ko'),rule.proposed.ko);
});
