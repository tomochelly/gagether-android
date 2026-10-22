import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {PERSONAL_NOTES_KEY,NoteStoreError,saveNote,readNotes,removeNote,decodeNotes,notesForScope,isNoteDate,weekDates,shiftNoteDate}=await import('../lib/personal-notes.ts');
const {personalUi}=await import('../lib/personal-ui.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {byId}=await import('../lib/games.ts');
const {default:Radar}=await import('../components/radar.tsx');
const {CalendarNotes}=await import('../components/calendar-notes.tsx');
const {default:ArtworkDisclosure}=await import('../components/artwork-disclosure.tsx');
function memory(raw=null){const values=new Map(raw===null?[]:[[PERSONAL_NOTES_KEY,raw]]);return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
const at='2026-10-16T23:50:00.000Z',later='2026-10-17T00:00:00.000Z';
const draft={date:'2026-10-17',gameId:'wuwa',region:'global',kind:'pull',title:'  새 캐릭터 획득  ',body:'70회 / 다음 픽업 준비'};
const error=code=>e=>e instanceof NoteStoreError&&e.code===code;

test('pull records survive reload, edit, date move and delete without changing other records',()=>{
 const db=memory();saveNote(db,draft,undefined,at,'first');saveNote(db,{...draft,kind:'plan',title:'다음 일정',date:'2026-10-22'},undefined,at,'second');
 const original=readNotes(db)[0];assert.equal(original.title,'새 캐릭터 획득');assert.equal(original.date,'2026-10-17');
 saveNote(db,{...draft,date:'2026-10-18',body:'80회로 수정'},original,later);
 const updated=readNotes(db);assert.equal(updated[0].createdAt,at);assert.equal(updated[0].updatedAt,later);assert.equal(updated[0].date,'2026-10-18');assert.equal(updated[1].title,'다음 일정');
 removeNote(db,updated[0]);assert.deepEqual(readNotes(db).map(n=>n.id),['second']);
});
test('two tabs preserve unrelated additions and reject a stale same-record edit or delete',()=>{
 const db=memory();saveNote(db,draft,undefined,at,'first');const stale=readNotes(db)[0];
 saveNote(db,{...draft,title:'다른 탭 추가'},undefined,at,'other');saveNote(db,{...draft,body:'다른 탭에서 수정'},stale,later);
 assert.throws(()=>saveNote(db,{...draft,body:'오래된 덮어쓰기'},stale,later),error('conflict'));
 assert.throws(()=>removeNote(db,stale),error('conflict'));assert.equal(readNotes(db).length,2);assert.equal(readNotes(db)[0].body,'다른 탭에서 수정');
});
test('damaged storage and failed writes cannot silently erase previous records',()=>{
 const bad=memory('{broken');assert.throws(()=>saveNote(bad,draft),error('invalid'));assert.equal(bad.getItem(PERSONAL_NOTES_KEY),'{broken');
 const db=memory();saveNote(db,draft,undefined,at,'first');const before=db.getItem(PERSONAL_NOTES_KEY),old=readNotes(db)[0];
 const full={getItem:db.getItem,setItem:()=>{throw new Error('QuotaExceeded');}};
 assert.throws(()=>saveNote(full,{...draft,body:'new'},old),error('unavailable'));assert.equal(db.getItem(PERSONAL_NOTES_KEY),before);
 assert.throws(()=>readNotes({getItem:()=>{throw new Error('SecurityError');},setItem:()=>{}}),error('unavailable'));
 assert.throws(()=>decodeNotes(JSON.stringify({version:2,notes:[]})),error('invalid'));
});
test('invalid calendar dates, blank titles and unsupported Chinese services are rejected',()=>{
 assert.equal(isNoteDate('2026-02-29'),false);assert.equal(isNoteDate('2028-02-29'),true);assert.equal(isNoteDate('2026-04-31'),false);
 const db=memory();assert.throws(()=>saveNote(db,{...draft,date:'2026-02-29'}),error('invalid'));assert.throws(()=>saveNote(db,{...draft,title:'  '}),error('invalid'));assert.throws(()=>saveNote(db,{...draft,region:'cn'}),error('invalid'));
 saveNote(db,{...draft,gameId:'arknights',region:'cn'},undefined,at,'ak');assert.equal(readNotes(db).length,1);
});
test('dashboard and game calendars share records while respecting favorites and actual services',()=>{
 const canonical=(id,region)=>effectiveRegion(byId[id],region),db=memory();
 const cases=[['wuwa','global'],['bluearchive','kr'],['bluearchive','jp'],['arknights','cn']];
 cases.forEach(([gameId,region],i)=>saveNote(db,{...draft,gameId,region},undefined,at,'n'+i));saveNote(db,{...draft,gameId:undefined,region:undefined},undefined,at,'general');const notes=readNotes(db);
 assert.deepEqual(notesForScope(notes,{gameId:'wuwa',region:'jp'},canonical).map(n=>n.id),['n0']);
 assert.deepEqual(notesForScope(notes,{gameId:'bluearchive',region:'jp'},canonical).map(n=>n.id),['n2']);
 assert.deepEqual(notesForScope(notes,{region:'kr',myOnly:true,favorites:['wuwa']},canonical).map(n=>n.id),['n0','general']);
 assert.deepEqual(notesForScope(notes,{gameId:'arknights',region:'cn'},canonical).map(n=>n.id),['n3']);
});
test('week navigation retains date-only values across month and year boundaries',()=>{
 assert.deepEqual(weekDates('2027-01-01'),['2026-12-27','2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02']);
 assert.equal(shiftNoteDate('2026-12-29',7),'2027-01-05');assert.equal(shiftNoteDate('2028-03-01',-1),'2028-02-29');
});
test('closed artwork does not render or preload its children',()=>{
 let rendered=false;function Image(){rendered=true;return createElement('img',{src:'/unrequested-art.webp'});}
 const markup=renderToStaticMarkup(createElement(ArtworkDisclosure,{locale:'ko'},createElement(Image)));assert.equal(rendered,false);assert.doesNotMatch(markup,/unrequested-art/);assert.match(markup,/aria-expanded="false"/);
});
test('simple mobile initial rendering omits pickup art and uses one calendar week; default keeps artwork and month',()=>{
 const name={ko:'테스트 픽업',en:'Test pickup',ja:'テストピックアップ',zh:'测试卡池'},now=Date.now();
 const entry={id:'test-pickup',gameId:'wuwa',kind:'pickup',region:'global',server:'global',title:name,summary:name,startAt:new Date(now-86400000).toISOString(),endAt:new Date(now+86400000).toISOString(),publishedAt:null,verifiedAt:new Date(now).toISOString(),sourceUrl:'https://wutheringwaves.kurogames.com/',sourceTitle:'Fixture',image:'/assets/fixture-pickup.webp',imageVerified:true,imageLocale:'neutral',imageKind:'banner',pickupType:'new',featured:true};
 const props={appMode:true,initialLocale:'ko',initialData:{entries:[entry],sourceChecks:[],settings:{}}};
 const compact=renderToStaticMarkup(createElement(Radar,{...props,initialMobileView:'simple'}));assert.match(compact,/simple-mode/);assert.doesNotMatch(compact,/fixture-pickup.webp/);assert.equal((compact.match(/class="calendar-cell(?: |")/g)||[]).length,7);assert.match(compact,/기록 추가/);
 const full=renderToStaticMarkup(createElement(Radar,props));assert.doesNotMatch(full,/app-shell app-mode simple-mode/);assert.match(full,/fixture-pickup.webp/);assert.ok((full.match(/class="calendar-cell(?: |")/g)||[]).length>=28);
});
test('personal UI is localized in four languages and user text is escaped',()=>{
 const keys=Object.keys(personalUi.ko);for(const locale of ['ko','en','ja','zh']){assert.deepEqual(Object.keys(personalUi[locale]),keys);assert.ok(Object.values(personalUi[locale]).every(v=>v.trim()));if(locale!=='ko')assert.doesNotMatch(Object.values(personalUi[locale]).join(' '),/[가-힣]/);}
 const note={...draft,title:'<img src=x onerror=alert(1)>',body:'<script>bad()</script>',id:'safe',createdAt:at,updatedAt:at};
 const markup=renderToStaticMarkup(createElement(CalendarNotes,{notes:[note],store:{ready:true,error:null},locale:'en',onAdd:()=>{},onEdit:()=>{}}));assert.match(markup,/&lt;img/);assert.doesNotMatch(markup,/<script>/);assert.match(markup,/Pull record/);
});
