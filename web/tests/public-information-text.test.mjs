import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {cleanPublicInformationText:clean,isPublicInformationFiller:isFiller}=await import('../lib/public-information-text.ts');

test('known four-language generated owner notes and short provenance labels leave only useful cycle facts',()=>{
 const notes=['운영자가 직접 입력한 초기화 일정','Reset schedule entered by the owner','運営者が入力したリセット日程','管理者输入的重置日程'];
 for(const note of notes){assert.equal(clean(note),'');assert.equal(clean('보상: 300개\n\n'+note+'\n\n조건: 레벨 30'),'보상: 300개\n\n조건: 레벨 30');}
 for(const [line,expected]of[
  ['운영자 설정 · 28일 반복','28일 반복'],['Every 28 days · Owner-defined','Every 28 days'],
  ['コミュニティ参考・28日ごと','28日ごと'],['每28天重复 | 管理者设定','每28天重复'],
  ['커뮤니티 참고 · 28일 반복 · 오전 5시','28일 반복 · 오전 5시']
 ])assert.equal(clean(line),expected);
 assert.ok(isFiller('운영자가 설정한 일정입니다.'));
 assert.equal(clean('운영자가 설정한 일정입니다. 11월 12일 05:00에 시작합니다.'),'11월 12일 05:00에 시작합니다.');
});

test('facts, source limitations, operator announcements and authored layout are not generic process noise',()=>{
 const facts=[
  '운영자가 설정한 보상은 300개입니다.',
  '게임 운영자가 점검 시간을 05:00로 변경했습니다.',
  '운영자가 설정한 일정: 2026-11-12 05:00',
  '커뮤니티 참고 자료를 읽고 참여 조건을 확인하세요.',
  '확률은 미공개이며, 1인당 10회까지 참여할 수 있습니다.',
  'The operator has not confirmed the reward quantity. Limit: 10 draws.',
  '運営者が設定した報酬は300個です。',
  '管理者设置的奖励为300个。',
  '  보상 300개\n\n\n조건: 레벨 30  \n',
  '条件\r\n\r\n報酬：300個\r\n'
 ];
 for(const fact of facts)assert.equal(clean(fact),fact);
 assert.equal(clean(undefined),'');
});

test('original source bodies are exempt even when they contain an exact editorial label',()=>{
 for(const body of ['운영자 설정','Reset schedule entered by the owner','運営者が入力したリセット日程','管理者输入的重置日程'])assert.equal(clean(body,{sourceOriginal:true}),body);
});

test('cleanup is idempotent and only removes the empty space adjoining discarded generated notes',()=>{
 const source='운영자가 설정한 정보입니다.\n\n보상: 300개\n\n\n수령 조건: 레벨 30\n\n운영자 설정\n\n기간: 11월 12일 ~ 11월 26일\n\n커뮤니티 참고';
 const once=clean(source);assert.equal(once,'보상: 300개\n\n\n수령 조건: 레벨 30\n\n기간: 11월 12일 ~ 11월 26일');assert.equal(clean(once),once);
});
