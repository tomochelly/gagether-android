import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import reviewed from '../content/reviewed-public-copy.json' with {type:'json'};
import catalog from '../content/gfl2-combat-catalog.json' with {type:'json'};
const {cleanPublicInformationText:clean}=await import('../lib/public-information-text.ts');
const {cleanDisplayText,displaySection,displaySummary,displayTitle}=await import('../lib/content-display.ts');
const {reviewedPublicCopy}=await import('../lib/reviewed-public-copy.ts');
const {default:ContentBlocks}=await import('../components/content-blocks.tsx');
const {default:Archive}=await import('../components/gfl2-combat-archive.tsx');

test('complete process sentences disappear while future edits and actual game changes stay literal',()=>{
 for(const text of ['초기화 카운트다운에 반영했습니다.','The reset countdown has been updated.','リセットのカウントダウンに反映しました。','已更新重置倒计时。']){assert.equal(clean(text),'');assert.equal(clean(text,{sourceOriginal:true}),text);}
 assert.equal(clean('초기화 카운트다운에 반영했습니다. 보상은 300개입니다.'),'보상은 300개입니다.');
 for(const text of ['게임 운영자가 초기화 시각을 05:00로 변경했습니다.','마리안의 신규 코스튬과 보상 300개를 추가했습니다.','캐릭터 카운트다운의 공격 효과를 확인했습니다.'])assert.equal(clean(text),text);
 const rule=reviewed.replacements.find(r=>r.before.startsWith('Asia 서비스 현재 시즌'));
 assert.equal(reviewedPublicCopy(rule.before+' 새 편집: 보상 600개.'),undefined);
 assert.equal(clean(rule.before,{sourceOriginal:true}),rule.before);
 for(const row of reviewed.replacements){assert.equal(clean(clean(row.before)),clean(row.before));assert.equal(clean(row.before,{sourceOriginal:true}),row.before);}
});

test('reviewed Endfield and recurring notes retain exact clocks, service, quantities and unknown limits in four languages',()=>{
 for(const beforeStart of ['Asia 서비스 현재 시즌','Asia service, current Season','Asiaサービスの現在期','Asia服务当前']){
  const rule=reviewed.replacements.find(r=>r.before.startsWith(beforeStart));assert.ok(rule);
  const shown=cleanDisplayText(rule.before);for(const clock of ['2026-11-05','11:59','12:00','13:00:00','UTC+8','KST'])assert.ok(shown.includes(clock),clock);
  assert.doesNotMatch(shown,/반영|카운트다운|owner-confirmed|countdown|リセット表示に使用|运营者确认/);
 }
 const reward=reviewed.replacements.find(r=>r.before.startsWith('제공된 현재 게임 화면과 자료의 보상'));
 assert.match(cleanDisplayText(reward.before),/800/);assert.match(cleanDisplayText(reward.before),/28일/);assert.match(cleanDisplayText(reward.before),/도전 목표·인장/);
 const empty='초기화 카운트다운에 반영했습니다.';
 for(const preserve of [false,true])assert.equal(displaySection('초기화 안내',empty,preserve),false);
 const blank={ko:'',en:'',ja:'',zh:''},entry={id:'process-test',gameId:'wuwa',title:blank,summary:blank,sourceTitle:'',contentBlocks:[{id:'process',type:'text',title:{...blank,ko:'초기화 안내'},body:{...blank,ko:empty}}]};
 assert.equal(renderToStaticMarkup(React.createElement(ContentBlocks,{entry,locale:'ko'})),'','no empty heading remains');
 const summary=reviewed.replacements.find(r=>r.before.startsWith('한국 제17장'));
 assert.match(displaySummary({...entry,summary:{...blank,ko:summary.before},sourceLocale:'ko'},'ko'),/제17장/);
 assert.match(displaySummary({...entry,summary:{...blank,ko:summary.before},sourceLocale:'ko'},'ko'),/종료 날짜/);
});

test('delimited source suffixes are hidden and the actual GFL2 archive uses clean names and facts',async()=>{
 const endings={ko:'흙먼지 전선 제33기 · 한국 공식 원문',en:'Gunsmoke Frontline #33 · KR source',ja:'砂塵戦線 第33期・韓国公式出典',zh:'尘烟前线 第33期 · 韩国官方来源'};
 for(const[l,title]of Object.entries(endings)){assert.notEqual(clean(title),title);assert.equal(clean(title,{sourceOriginal:true}),title);assert.equal(displayTitle({title:{ko:'',en:'',ja:'',zh:'',[l]:title},sourceTitle:title,sourceLocale:l},l),clean(title));}
 const before=structuredClone(catalog);
 for(const locale of ['ko','en','ja','zh']){
  const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/'+locale+'/games/gfl2/combat',pretendToBeVisual:true}),saved=new Map(),set=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});};
  for(const key of ['window','document','HTMLElement','Element','Node','Event','MouseEvent'])set(key,dom.window[key]);set('IS_REACT_ACT_ENVIRONMENT',true);
  set('fetch',async url=>({ok:true,json:async()=>String(url).includes('catalog')?catalog:{signedIn:false,accountScope:null,setups:[],records:[],canModerate:false}}));
  const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));
  try{await act(async()=>root.render(React.createElement(Archive,{locale})));assert.ok(document.querySelector('.gf-intel').textContent.includes('KST'));assert.doesNotMatch(document.querySelector('.gf-intel').textContent,/단정하지|아래 기수|UTC-equivalence|同一時刻とは|不据此断言/);for(const option of document.querySelectorAll('.gf-period option'))assert.doesNotMatch(option.textContent,/한국 공식 원문|KR source|韓国公式出典|韩国官方来源/);}finally{await act(async()=>root.unmount());dom.window.close();for(const[key,descriptor]of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
 assert.deepEqual(catalog,before);
});
