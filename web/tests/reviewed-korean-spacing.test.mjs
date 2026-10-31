import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import reviewed from '../content/reviewed-korean-spacing.json' with {type:'json'};
import recaps from '../content/reviewed-broadcast-analysis.json' with {type:'json'};
const {reviewedKoreanSpacing}=await import('../lib/reviewed-korean-spacing.ts');
const {cleanPublicInformationText}=await import('../lib/public-information-text.ts');
const {displayTitle,displaySummary}=await import('../lib/content-display.ts');
const {default:BroadcastSpecial}=await import('../components/broadcast-special.tsx');

test('reviewed Korean phrases improve spacing while retaining every non-whitespace character',()=>{
 assert.equal(reviewedKoreanSpacing('가상적성시험BETA:최대5부대/한부대8명,12/23까지'),'가상적성시험 BETA: 최대 5부대 / 한 부대 8명, 12/23까지');
 assert.equal(cleanPublicInformationText('스텔라배틀러·마왕의탑Beta·부스트러시'),'스텔라 배틀러 · 마왕의 탑 Beta · 부스트 러시');
 assert.equal(cleanPublicInformationText('신육성시나리오朋、史解き―午式駿大祭―10/26공개'),'신 육성 시나리오 朋、史解き―午式駿大祭― 10/26 공개');
 const strip=s=>s.replace(/\s/g,'');
 assert.equal(new Set(reviewed.replacements.map(r=>r.before)).size,reviewed.replacements.length);
 for(const row of reviewed.replacements){assert.equal(strip(row.after),strip(row.before));assert.equal(reviewedKoreanSpacing(row.after),row.after);}
});

test('official source originals and every non-Korean recap value remain literal',()=>{
 const text='INVALIDNUMBER·HIOLDFRIEND·EXENORESPONSE는각환석100과추가아이템을제공해요. 사용기한은11월2일16:59(JST/KST)예요.';
 assert.equal(cleanPublicInformationText(text,{sourceOriginal:true}),text);
 const shown=cleanPublicInformationText(text);for(const token of ['INVALIDNUMBER','HIOLDFRIEND','EXENORESPONSE','100','11','2','16:59','JST/KST'])assert.ok(shown.includes(token));
 assert.equal(reviewedKoreanSpacing('  이환1.5 새 공지\n\n11월11일 05:00(KST)\t'),'  이환1.5 새 공지\n\n11월 11일 05:00(KST)\t');
 const visit=value=>{if(!value||typeof value!=='object')return;for(const[k,v]of Object.entries(value)){if(['en','ja','zh'].includes(k)&&typeof v==='string')assert.equal(reviewedKoreanSpacing(v),v);else if(v&&typeof v==='object')visit(v);}};visit(recaps);
});

test('unambiguous Korean season/date/time and qualified counts work beyond the exact registry',()=>{
 const expected='시즌 3 종료는 11월 1일 04:59, 시즌 4는 11월 1일 05:00부터 12월 1일 04:59';
 for(const text of ['시즌3 종료는11월1일04:59, 시즌4는11월1일05:00부터12월1일04:59','시즌3 종료는11월1일04:59,시즌4는11월1일05:00부터12월1일04:59']){
  assert.equal(cleanPublicInformationText(text),expected);
  assert.equal(cleanPublicInformationText(text,{sourceOriginal:true}),text);
 }
 const examples=[
  ['2026년10월29일11:00(JST)부터11월6일10:59까지','2026년 10월 29일 11:00(JST)부터 11월 6일 10:59까지'],
  ['최대5부대, 총80회, 캐릭터4명 · 레벨30','최대 5부대, 총 80회, 캐릭터 4명 · 레벨 30'],
  ['보상은11월2일16:59(JST/KST)까지, 마감은04:59','보상은 11월 2일 16:59(JST/KST)까지, 마감은 04:59'],
  ['10월29일 11:00부터 11월6일 10:59(JST)까지 진행됩니다.','10월 29일 11:00부터 11월 6일 10:59(JST)까지 진행됩니다.'],
  ['2027년12월 발표 · 시즌12는예정','2027년 12월 발표 · 시즌 12는예정']
 ];
 for(const[before,after]of examples){assert.equal(reviewedKoreanSpacing(before),after);assert.equal(reviewedKoreanSpacing(after),after);assert.equal(before.replace(/\s/g,''),after.replace(/\s/g,''));}
});

test('game names, versions, percentages, ISO clocks, codes and protected authoring spans are untouched',()=>{
 const plain='붕괴3rd · 소녀전선2 · 3.7 · 0.8% · ATK150 · INVALIDNUMBER · ISO2026-11-01T04:59:00+09:00 · 레벨3.7 · 최대0.8%';
 assert.equal(reviewedKoreanSpacing(plain),plain);
 const protectedText=[
  'https://example.com/시즌3/11월1일04:59',
  'example.com/시즌3/11월1일04:59',
  '시즌3@11월1일.example.com',
  '[자료](./path(foo)/시즌3/11월1일04:59)',
  '[자료]: ./시즌3/11월1일04:59',
  '`시즌3 종료는11월1일04:59`',
  '``시즌3 ` 종료는11월1일04:59``',
  '```text\n시즌3 종료는11월1일04:59\n```',
  '~~~text\n시즌3 종료는11월1일04:59\n~~~'
 ].join('\n');
 assert.equal(reviewedKoreanSpacing(protectedText),protectedText);
 const mixed='시즌3 종료는11월1일04:59\n'+protectedText+'\n캐릭터4명';
 const shown=reviewedKoreanSpacing(mixed);assert.ok(shown.includes(protectedText));assert.ok(shown.startsWith('시즌 3 종료는 11월 1일 04:59'));assert.ok(shown.endsWith('캐릭터 4명'));assert.equal(shown.replace(/\s/g,''),mixed.replace(/\s/g,''));assert.equal(reviewedKoreanSpacing(shown),shown);
 for(const text of ['Season3 ends November1 at04:59','シーズン3は11月1日04:59終了','第3赛季于11月1日04:59结束'])assert.equal(reviewedKoreanSpacing(text),text);
});

test('persisted broadcast banner text uses reviewed spacing without changing codes or sibling locales',()=>{
 const row=recaps[1].review,blank={ko:'',en:'',ja:'',zh:''},entry={id:'spacing-preview',gameId:'nikke',kind:'update',region:'global',sourceLocale:'ko',sourceUrl:row.sourceUrl,sourceTitle:'original',title:{...row.title,ko:'이환1.5 영어 방송 정리'},summary:{...row.summary},broadcastRecap:{...row.feature,title:{...row.feature.title,ko:'이환1.5 영어 방송 정리'},highlights:[{...row.feature.highlights[0],ko:'마리안:퀸·홍련:신살특수모집'},{...row.feature.highlights[1],ko:'라푼젤:생츄어리배포·필그림선택모집'},{...row.feature.highlights[2],ko:'MARIA-n·VOLT TRIP·메인49/50장'}],codes:[{code:'INVALIDNUMBER',reward:{...blank,ko:'환석 ×100 · 육성 소재·염료 각5개 · 딱정벌레 코인 ×4,000',en:'A reward ×100',ja:'報酬×100',zh:'奖励×100'},expiresAt:null,sourceUrl:row.sourceUrl}]}};
 const before=structuredClone(entry);assert.equal(displayTitle(entry,'ko'),'이환 1.5 영어 방송 정리');
 for(const locale of ['ko','en','ja','zh']){
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(BroadcastSpecial,{entry,locale,now:Date.parse('2026-10-30T00:00:00Z'),onOpen(){}}))),d=dom.window.document;
  if(locale==='ko'){
   assert.equal(d.querySelector('.broadcast-special-copy h2').textContent,'이환 1.5 영어 방송 정리');
   assert.ok(d.querySelector('.broadcast-special-copy ul').textContent.includes('마리안: 퀸 · 홍련: 신살 특수 모집'));
   assert.ok(d.querySelector('.broadcast-special-copy ul').textContent.includes('메인 49/50장'));
   assert.equal(d.querySelector('.broadcast-code-list p').textContent,'환석 × 100 · 육성 소재·염료 각 5개 · 딱정벌레 코인 × 4,000');
  }else{
   assert.equal(d.querySelector('.broadcast-special-copy h2').textContent,entry.broadcastRecap.title[locale]);
   assert.equal(d.querySelectorAll('.broadcast-special-copy p')[1].textContent,entry.summary[locale]);
   for(const[i,h]of entry.broadcastRecap.highlights.entries())assert.equal(d.querySelectorAll('.broadcast-special-copy li')[i].textContent,'0'+(i+1)+h[locale]);
   assert.equal(d.querySelector('.broadcast-code-list p').textContent,entry.broadcastRecap.codes[0].reward[locale]);
  }
  assert.equal(d.querySelector('code').textContent,'INVALIDNUMBER');dom.window.close();
 }
 assert.deepEqual(entry,before);
 const ruleEntry={...entry,id:'recap-nte-en-UxT6b7h5Mcc',gameId:'nte',sourceUrl:'https://www.youtube.com/watch?v=UxT6b7h5Mcc',summary:{...blank,ko:'11월11일 업데이트, 엘림·Exe, 신규 도시 콘텐츠와 보상·리딤 코드를 정리했어요.'}};
 assert.equal(displaySummary(ruleEntry,'ko'),'11월 11일 업데이트: 엘림·Exe, 신규 도시 콘텐츠, 보상과 리딤 코드 3종.');
});
