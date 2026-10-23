import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {cleanDisplayText,detailText,displaySection}=await import('../lib/content-display.ts');
const {default:DetailCopy}=await import('../components/detail-copy.tsx');
const {default:EntityDetails}=await import('../components/entity-details.tsx');
const {traitIcon}=await import('../lib/trait-icons.ts');
const {games}=await import('../lib/games.ts');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {ui}=await import('../lib/i18n.ts');
const {entrySchema}=await import('../lib/content-schema.ts');
const loc=s=>({ko:s,en:s,ja:s,zh:s});
const sample='블레이드 초코 크림 커피와 은랑 큐브 레모네이드는 각 3,900원(KRW). 앱 이벤트에서 정보 제공에 동의하고 참가한 뒤 메가오더로 주문합니다. 제조 완료 시 스탬프가 적립되며, 1개는 신용 포인트 20,000, 3개는 성옥 15 보상입니다. 5개는 쿠션 세트 1,000명·2만원 상품권 1,000명 추첨이며 당첨 보장이 아닙니다. 게임 보상 코드는 주문 결제 60분 뒤 확인할 수 있습니다.';
test('product/price, threshold rewards and code delay become separate concise lines without losing lottery conditions',()=>{
 const copy=detailText(sample);assert.match(copy,/블레이드 초코 크림 커피 \/ 은랑 큐브 레모네이드\n각 3,900원/);assert.match(copy,/1개 : 신용 포인트 20,000\n3개 : 성옥 15\n5개 :/);for(const fact of ['동의','메가오더','1,000명','2만원','추첨','당첨 보장이 아닙니다','60분'])assert.ok(copy.includes(fact),fact);assert.equal(copy.includes('(KRW)'),false);
});
test('owner screenshot derivation and localization/review notes disappear while actual dates and source data stay intact',()=>{
 const chatter='현재 회차 「내세로의 도하」: 운영자가 제공한 2026-10-22 새벽 게임 화면의 「11일 2시간」과 한국 서비스 오전 5시 초기화를 대조하여 2026-11-02 05:00:00(KST) 종료로 확인했습니다. 현재 회차에만 적용하며 다음 회차는 추산하지 않습니다';assert.equal(cleanDisplayText(chatter),'');
 const mixed='참가 조건: 계정 레벨 30. 보상 수령: 11월 2일 05:00까지. 일일 제한은 미확인으로 남겼습니다.';assert.equal(cleanDisplayText(mixed),'참가 조건: 계정 레벨 30.\n보상 수령: 11월 2일 05:00까지.');assert.equal(displaySection('중국어 이름 표기','중국어 이름 근거'),false);assert.equal(displaySection('참가 조건','계정 레벨 30'),true);
});
test('all four native languages hide collector narration and retain practical eligibility, price, quantity and platform facts',()=>{
 for(const [locale,text,kept] of [['ko','참가 조건: 레벨 30. 본문을 확인했습니다.',['레벨 30']],['en','Requires Level 30. We verified the source. Price: JPY 1,500 on Android.',['Level 30','JPY 1,500','Android']],['ja','参加条件：レベル30。 内容を確認しました。 報酬：150個。',['レベル30','150個']],['zh','参加条件：等级30。 已核对官方资料。 奖励：150个。',['等级30','150个']]]){const out=cleanDisplayText(text);for(const value of kept)assert.ok(out.includes(value),locale+value);assert.doesNotMatch(out,/확인했습니다|We verified|確認しました|已核对/);}
 assert.equal(cleanDisplayText('Not available after November 2. Paid items cannot be refunded.'),'Not available after November 2.\nPaid items cannot be refunded.');
 assert.equal(cleanDisplayText('유료 패키지 · 0.6% · Lv.90 · S0 · 일일 3회'),'유료 패키지 · 0.6% · Lv.90 · S0 · 일일 3회');
});
test('detail rendering escapes raw markup and uses the exact current game currency icon without inventing quantity',()=>{
 const html=renderToStaticMarkup(React.createElement(DetailCopy,{text:'보상: 성옥 15개\n<script>alert(1)</script>',locale:'ko',gameId:'hsr'}));assert.match(html,/inline-currency/);assert.match(html,/15개/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/detail-copy-line/);
});
test('reviewed trait icons can be reused by exact game/trait/value across services; other games and unknown values cannot borrow them',()=>{
 const trait={id:'element',label:loc('속성'),value:{ko:'인멸',en:'Havoc',ja:'消滅',zh:'湮灭'}};assert.match(traitIcon('wuwa',trait).image,/wuwa-element-6/);assert.equal(traitIcon('bluearchive',trait),undefined);assert.equal(traitIcon('wuwa',{...trait,value:loc('unmapped')}),undefined);
});
test('every game/service uses the same icon-led detail component in all languages, with numerical basis folded separately',()=>{
 const profile={id:'fixture',name:loc('Fixture'),category:loc('Character'),basis:loc('Lv.90 · S0 · no equipment'),traits:[{id:'element',label:loc('Element'),value:loc('Fixture')}],stats:[{label:loc('HP'),value:'12,345'}],statSourceKind:'official',groups:[],sources:[],verifiedAt:'2026-10-23T00:00:00Z'};
 for(const game of games)for(const region of game.regions)for(const locale of ['ko','en','ja','zh']){const html=renderToStaticMarkup(React.createElement(CatalogContext.Provider,{value:{t:ui[locale]}},React.createElement(EntityDetails,{profiles:[profile],gameId:game.id,locale})));assert.match(html,/stat-icon/);assert.match(html,/12,345/);assert.match(html,/<details class="stat-assumptions">/);assert.doesNotMatch(html,/<table|검수|확인했습니다/);}
 const native=traitIcon('wuwa',{id:'element',value:{ko:'인멸',en:'Havoc',ja:'消滅',zh:'湮灭'}});const html=renderToStaticMarkup(React.createElement(EntityDetails,{profiles:[{...profile,traits:[{id:'element',label:loc('속성'),value:loc('인멸'),icon:native}]}],locale:'ko',gameId:'wuwa'}));assert.match(html,/trait-icon/);assert.match(html,/wuwa-element-6/);
});
