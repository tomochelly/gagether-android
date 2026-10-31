import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {displaySummary,cleanDisplayText}=await import('../lib/content-display.ts');
const {cleanPublicInformationText}=await import('../lib/public-information-text.ts');
const rules=JSON.parse(readFileSync('content/reviewed-public-summaries.json','utf8'));

test('reviewed summaries retain actual game facts in each language without rewriting stored originals',()=>{
 for(const rule of rules){
  const entry={id:rule.id,gameId:rule.gameId,sourceUrl:rule.sourceUrl,summary:{...rule.expected},sourceLocale:'ko'};
  const original=JSON.stringify(entry);
  for(const locale of ['ko','en','ja','zh'])assert.equal(displaySummary(entry,locale),rule.proposed[locale],rule.id+':'+locale);
  assert.equal(JSON.stringify(entry),original);
 }
 const hi3=rules.find(r=>r.id==='quick-hi3-kr-47008383');
 assert.match(displaySummary({...hi3,summary:hi3.expected},'ja'),/虚数.*ドライブコア.*炎ダメージ/);
});

test('newer owner text, sibling locale edits and unrelated sources cannot be replaced by old review rules',()=>{
 const rule=rules[0],entry={...rule,summary:{...rule.expected,ko:'새로운 게임 정보 300개'},editor:{fields:['summary']}};
 assert.equal(displaySummary(entry,'ko'),'새로운 게임 정보 300개');
 assert.equal(displaySummary(entry,'en'),rule.proposed.en);
 const other={...entry,id:'unrelated-id',summary:{ko:'원문 300개',en:'300 items',ja:'300個',zh:'300个'}};
 assert.equal(displaySummary(other,'zh'),'300个');
 assert.notEqual(displaySummary({...entry,sourceUrl:'https://example.com/new'},'en'),rule.proposed.en);
});

test('Japanese and Chinese sentences preserve adjacent game conditions when no whitespace follows punctuation',()=>{
 assert.equal(cleanDisplayText('内容を確認しました。報酬：150個。参加条件：レベル30。'),'報酬：150個。\n参加条件：レベル30。');
 assert.equal(cleanDisplayText('已核对官方资料。奖励：150个。参加条件：等级30。'),'奖励：150个。\n参加条件：等级30。');
 assert.equal(cleanPublicInformationText('한국 공지 원문: 보상 300개 · 11월 12일'),'보상 300개 · 11월 12일');
 const source='한국 공지 원문: 보상 300개 · 11월 12일';
 assert.equal(cleanPublicInformationText(source,{sourceOriginal:true}),source);
});
