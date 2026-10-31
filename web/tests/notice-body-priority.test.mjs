import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {selectBodyCandidates}=await import('../lib/body-collection-candidate.ts');
const {default:SourceArticle}=await import('../components/source-article.tsx');
const now=Date.parse('2026-10-24T12:00:00Z'),loc=s=>({ko:s,en:s,ja:s,zh:s});
const entry={id:'current-notice',gameId:'wuwa',region:'global',kind:'update',title:loc('Update'),summary:loc(''),sourceLocale:'ko',sourceTitle:'Update',sourceUrl:'https://wutheringwaves.kurogames.com/kr/main/news/detail/5572',publishedAt:'2026-10-24',verifiedAt:'2026-10-22T00:00:00Z',startAt:null,endAt:null};
const row=(id,date,title='Update')=>({...entry,id,publishedAt:date,sourceUrl:entry.sourceUrl+'/'+id,sourceTitle:title});

test('unread current notices beat old pickups and successful pending rereads, without starving actual services',()=>{
 const fresh=row('new-update','2026-10-24'),older=row('old-pickup','2026-10-20','픽업'),read=row('read-pickup','2026-10-23','픽업'),jp={...row('jp','2026-10-24'),gameId:'arknights',region:'jp'};
 const queue=new Map([[read.sourceUrl,{...read,sourceAccess:'body',status:'pending',checkedAt:'2026-10-23T00:00:00Z'}]]);
 assert.equal(selectBodyCandidates([read,older,fresh],queue,now,1)[0].id,fresh.id);
 assert.equal(new Set(selectBodyCandidates([read,older,fresh,jp],queue,now,2).map(e=>e.gameId+'|'+e.region)).size,2);
 queue.set(fresh.sourceUrl,{...fresh,sourceAccess:'body',status:'pending',checkedAt:'2026-10-24T10:00:00Z'});
 assert.equal(selectBodyCandidates([fresh,older],queue,now,1)[0].id,older.id);
 // Pickup priority still breaks ties between equally new unread notices.
 assert.equal(selectBodyCandidates([fresh,{...older,publishedAt:fresh.publishedAt}],new Map(),now,1)[0].id,older.id);
});

test('index-only metadata is immediately eligible; actual empty/failed body attempts cool down independently',()=>{
 const queue=new Map([[entry.sourceUrl,{...entry,sourceAccess:'metadata',status:'pending',checkedAt:'2026-10-24T11:59:59Z'}]]);
 assert.equal(selectBodyCandidates([entry],queue,now,1).length,1);
 queue.get(entry.sourceUrl).bodyCheckedAt='2026-10-24T11:30:00Z';
 assert.equal(selectBodyCandidates([entry],queue,now,1).length,0);
 queue.get(entry.sourceUrl).bodyCheckedAt='2026-10-24T10:59:00Z';
 assert.equal(selectBodyCandidates([entry],queue,now,1).length,1);
 queue.get(entry.sourceUrl).sourceAccess='blocked';queue.get(entry.sourceUrl).bodyCheckedAt='2026-10-24T11:30:00Z';
 assert.equal(selectBodyCandidates([entry],queue,now,1).length,0);
});

test('primary native updates are open even with curated sections and preserve complete issue/condition text safely',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const native={ko:'일부 환경에서 동작이 확인되지 않는 문제를 수정했습니다.\n보상 수령 조건: 연각 레벨 8.',en:'Known issue: conditions are not confirmed.\nClaim: Union Level 8.',ja:'一部の環境で未確認の問題。\n受取条件：ユニオンレベル8。',zh:'部分环境未确认的问题。\n领取条件：联觉等级8。'}[locale];
  const e={...entry,sourceLocale:locale,sourceBodies:{[locale]:{title:'Update',locale,sourceUrl:entry.sourceUrl,text:native+'\n<script>unsafe()</script>',images:[],bodyHash:'a'.repeat(64),importedAt:entry.verifiedAt,sourceKind:'official'}},detailSections:[{id:'short',title:loc('Overview'),body:loc('Short curated overview.')} ]};
  const markup=renderToStaticMarkup(React.createElement(SourceArticle,{entry:e,locale}));
  assert.match(markup,/<details class="source-article" open="">/);assert.ok(markup.includes(native.split('\n')[0]));assert.ok(markup.includes(native.split('\n')[1]));assert.doesNotMatch(markup,/<script>/);assert.match(markup,/&lt;script&gt;/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(SourceArticle,{entry:{...e,kind:'pickup'},locale})),/<details[^>]* open=/);
 }
});
