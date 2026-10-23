import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {parseWuwaWeapons,applyWuwaWeapons}=await import('../lib/wuwa-weapons.ts');
const {naverBody}=await import('../lib/naver-body.ts');
const {sourceDocument,pickupNotice}=await import('../lib/collection-review.ts');
const {parseNaverOfficial,expandedOfficialSources}=await import('../lib/expanded-notices.ts');
const {regionalDetail}=await import('../lib/regional-notices.ts');
const {safeSource}=await import('../lib/types.ts');
const time='2026-10-23T06:00:00Z',now=Date.parse(time),blank={ko:'',en:'',ja:'',zh:''};
const body=(file,locale)=>({...JSON.parse(fs.readFileSync(new URL('./fixtures/wuwa/'+file+'.json',import.meta.url))),locale,sourceUrl:locale==='ko'?'https://game.naver.com/lounge/WutheringWaves/board/detail/8346099':'https://wutheringwaves.kurogames.com/jp/main/news/detail/5670',images:[],bodyHash:'a'.repeat(64),sourceKind:'official',importedAt:time});
const ko=body('ko-8346099','ko'),ja=body('ja-5670','ja');
const weapon={id:'wuwa-3-7-phase-2-freeze-frame',gameId:'wuwa',kind:'weapon',region:'global',server:'global',title:{...blank,ko:'프리즈 프레임',en:'Freeze Frame',ja:'フリーズフレーム'},summary:blank,startDate:'2026-10-22',endDate:'2026-11-11',startAt:null,endAt:null,sourceUrl:'https://www.inven.co.kr/board/party/6196/3139',sourceKind:'community',sourceTitle:'old',sourceLocale:'ko',publishedAt:null,verifiedAt:'2026-10-16T00:00:00Z',image:'/assets/reviewed.png',imageFraming:{card:{x:20,y:40,zoom:1,fit:'contain'}},detailSections:[{title:blank,body:{...blank,ko:'Existing detailed stats'}}]};
test('actual Korean/Japanese current notices extract primary weapons, lower rarity and native exact clocks separately',()=>{
 const kr=parseWuwaWeapons(ko),jp=parseWuwaWeapons(ja);assert.deepEqual(kr.map(r=>r.name),['프리즈 프레임','스펙트럼 블래스터']);assert.equal(kr[0].rateUps.length,3);assert.equal(kr[0].startAt,null);assert.equal(jp[0].endAt,'2026-11-11T12:59:00+09:00');assert.equal(parseWuwaWeapons(body('ko-8346064','ko'))[0].name,'적막한 어둠');assert.equal(pickupNotice(ko.title),true);assert.equal(pickupNotice(ja.title),true);
});
test('routine application reuses rotation IDs, preserves full originals and is idempotent',()=>{
 const first=applyWuwaWeapons([weapon],ko,'2026-10-21',now);const w=first.entries.find(e=>e.id===weapon.id);assert.ok(w);assert.equal(w.startAt,null);assert.equal(w.image,weapon.image);assert.deepEqual(w.imageFraming,weapon.imageFraming);assert.deepEqual(w.detailSections,weapon.detailSections);assert.equal(weapon.pickupMembers,undefined,'planner must not mutate originals');assert.equal(w.pickupMembers.filter(m=>m.role==='featured').length,1);assert.equal(w.pickupMembers.filter(m=>m.role==='rate-up').length,3);assert.equal(applyWuwaWeapons(first.entries,ko,'2026-10-21',now).entries.length,0);
 const timed=applyWuwaWeapons(first.entries,ja,'2026-10-21',now).entries.find(e=>e.id===weapon.id);assert.equal(timed.startAt,'2026-10-22T11:00:00+09:00');assert.equal(timed.sourceLocale,'ko');assert.equal(timed.sourceBodies.ko.text,ko.text);assert.equal(timed.sourceBodies.ja.text,ja.text);
});
test('next rotation creates a stable current weapon record; ended rounds and weapon archives survive untouched',()=>{
 const next={...ko,text:ko.text.replaceAll('2026년 10월 22일','2026년 11월 22일').replaceAll('2026년 11월 11일','2026년 12월 11일')};const archived={...weapon,id:'archive',pickupArchive:{status:'past'},startDate:'2026-09-01',endDate:'2026-09-30'};const r=applyWuwaWeapons([weapon,archived],next,'2026-10-21',now);assert.ok(r.entries.every(e=>!e.pickupArchive));assert.ok(r.entries.every(e=>e.id!==weapon.id&&e.id!=='archive'));assert.deepEqual(r.entries.map(e=>e.id),applyWuwaWeapons([weapon,archived],next,'2026-10-21',now).entries.map(e=>e.id));assert.equal(applyWuwaWeapons(r.entries,next,'2026-10-21',now).entries.length,0);
});
test('conflicting clocks stop that weapon update and unknown timezones never make alarms',()=>{
 const conflict={...weapon,startAt:'2026-10-22T12:00:00+09:00',endAt:'2026-11-11T12:59:00+09:00'};const r=applyWuwaWeapons([conflict],ja,'2026-10-21',now);assert.ok(r.issues.some(s=>/conflict/.test(s)));assert.equal(r.entries.some(e=>e.id===weapon.id),false);const nozone={...ja,text:ja.text.replaceAll('日本標準時','server time')};assert.equal(parseWuwaWeapons(nozone)[0].startAt,null);assert.ok(applyWuwaWeapons([],ja,'2026-10-21',now).issues.some(s=>/mapping/.test(s)));
});
test('signature associations use explicit existing links across rotations, never date or member order',()=>{
 const old={...weapon,id:'old-weapon',startDate:'2026-06-01',endDate:'2026-06-20'},base={id:'old-character',gameId:'wuwa',region:'global',kind:'pickup',title:{...blank,ko:'루실라'},startDate:'2026-06-01',endDate:'2026-06-20',signatureWeapons:[{entryId:old.id,sourceUrl:ja.sourceUrl,sourceKind:'official',verifiedAt:time}]},current={...base,id:'new-character',signatureWeapons:undefined,startDate:'2026-10-22',endDate:'2026-11-11'},other={...current,id:'unrelated',title:{...blank,ko:'다른 캐릭터'}};
 const result=applyWuwaWeapons([weapon,old,base,current,other],ko,'2026-10-21',now);assert.equal(result.entries.find(e=>e.id===current.id).signatureWeapons[0].entryId,weapon.id);assert.equal(result.entries.some(e=>e.id===other.id),false);
});
test('SmartEditor exposes inert readable text, native original images and safe links, never execution or user instructions',()=>{
 const input=JSON.stringify({document:{components:[{'@ctype':'text',value:[{'@ctype':'paragraph',nodes:[{'@ctype':'textNode',value:'5성 무기 「적막한 어둠」 <script>bad()</script>',link:{url:'javascript:bad()'}}]}]},{'@ctype':'image',src:'https://nng-phinf.pstatic.net/a.jpg?type=w1678',domain:'https://nng-phinf.pstatic.net',path:'/a.jpg'}]}});const rendered=naverBody(input),parsed=sourceDocument(rendered,ko.sourceUrl);assert.equal(rendered.includes('<script>'),false);assert.ok(parsed.text.includes('적막한 어둠'));assert.deepEqual(parsed.images,['https://nng-phinf.pstatic.net/a.jpg']);assert.throws(()=>naverBody('{"wrong":[]}'),/format changed/);
});
test('Korean Wuwa official lounge board 28 is collected; authors, lounge and exact receipt are validated',async()=>{
 const row={feed:{feedId:8346064,loungeId:'WutheringWaves',title:'[적막한 어둠] 무기 이벤트 튜닝',createdDate:'20261021121029'},user:{userRoleCode:'game_manager'}};const parsed=parseNaverOfficial({code:200,content:{feeds:[row,{...row,user:{userRoleCode:'common_user'}}]}},'wuwa','WutheringWaves','global');assert.equal(parsed.length,1);assert.ok(safeSource(parsed[0].url,'wuwa'));assert.ok(expandedOfficialSources.some(s=>s.key==='wuwa/kr/naver/28'));const n=parsed[0],raw={code:200,content:{feed:{...row.feed,contents:'<p>Complete official body</p>'},user:row.user}};assert.match(await regionalDetail(n,async()=>Response.json(raw)),/Complete official body/);await assert.rejects(()=>regionalDetail(n,async()=>Response.json({...raw,content:{...raw.content,user:{userRoleCode:'common_user'}}})),/author identity/);
});
