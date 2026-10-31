import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {regionalDetail}=await import('../lib/regional-notices.ts');
const {sourceDocument}=await import('../lib/collection-review.ts');
const root=new URL('../ops/research/whole-site-20261029/collection-audit/',import.meta.url);
const fixture=JSON.parse(readFileSync(new URL('gfl2-single-announcement-lang4.json',root),'utf8'));
const notice={gameId:'gfl2',region:'kr',locale:'ko',id:'668380665149915537',url:'https://steamcommunity.com/games/3308670/announcements/detail/668380665149915537?l=koreana',title:'fixture',publishedAt:null};
test('GFL2 reads the exact Korean announcement ID and locale instead of Steam navigation',async()=>{
 let called='';const body=await regionalDetail(notice,async u=>{called=String(u);return Response.json(fixture);});
 assert.ok(called.includes('announcement_gid='+notice.id)&&called.includes('lang_list=4'));
 const parsed=sourceDocument(body,notice.url);assert.equal(parsed.access,'body');assert.ok(parsed.text.includes('꿈속의 네버랜드'));assert.ok(!parsed.text.includes('Community Hub'));
 for(const line of fixture.event.announcement_body.body.split('\n').filter(s=>s.trim()&&!/\[|\{/.test(s)))assert.ok(parsed.text.includes(line.trim()));
});
test('wrong publisher, event-vs-announcement identity, language and incomplete native bodies fail closed',async()=>{
 const edits=[d=>d.event.appid=1,d=>d.event.clan_steamid='wrong',d=>d.event.announcement_body.clanid=1,d=>d.event.announcement_body.gid=d.event.gid,d=>d.event.announcement_body.language=0,d=>d.event.hidden=1,d=>d.event.published=0,d=>d.event.announcement_body.body='',d=>d.event.announcement_body.body='a'.repeat(200001)];
 for(const edit of edits){const data=structuredClone(fixture);edit(data);await assert.rejects(regionalDetail(notice,async()=>Response.json(data)),/identity or language/);}
 await assert.rejects(regionalDetail({...notice,url:notice.url.replace('3308670','1')},async()=>Response.json(fixture)),/identity/);
});
test('full scripted Steam shells are unavailable and cannot leak escaped script tails as prose',()=>{
 const html='<html><script>var template="<\\/script>"; leaked_code();</script><div>'+('Community Hub Language '.repeat(80))+'</div></html>';
 assert.deepEqual(sourceDocument(html,notice.url),{access:'js-only',text:'',images:[]});
 const prose=sourceDocument('<p>안내: &lt;문구&gt; / 문자 \\"와 원문</p>',notice.url);assert.ok(prose.text.includes('안내:'));
});
test('legacy exact Steam script/menu corruption is hidden on reads while its original remains intact',async()=>{
 const {sourceBodyFor}=await import('../lib/source-bodies.ts'),body={locale:'ko',sourceUrl:notice.url,text:'Steam :: fixture\n" ); };\n © Valve Corporation. All rights reserved.',images:[]};
 const entry={gameId:'gfl2',region:'kr',sourceLocale:'ko',sourceBodies:{ko:body}},before=JSON.stringify(entry);assert.equal(sourceBodyFor(entry,'ko').body,undefined);assert.equal(JSON.stringify(entry),before);
 const genuine={...entry,sourceBodies:{ko:{...body,text:'정상 공지 본문입니다. 변경 사항을 확인해 주세요.'}}};assert.equal(sourceBodyFor(genuine,'ko').body.text,genuine.sourceBodies.ko.text);
});
test('retained legacy body and its truncated summary identify exact GFL2 Steam chrome without changing originals',async()=>{
 const {isGfl2SteamNotice,isGfl2SteamShellText}=await import('../lib/gfl2-steam-body.ts');
 const old=JSON.parse(readFileSync(new URL('public-gfl2-notice.json',root),'utf8')).entry;
 const text=old.sourceBodies.ko.text,before=JSON.stringify(old);
 assert.equal(isGfl2SteamNotice(old.gameId,old.sourceUrl),true);
 assert.equal(isGfl2SteamShellText(old.gameId,old.sourceUrl,text),true);
 assert.equal(isGfl2SteamShellText(old.gameId,old.sourceUrl,text.split('\n').map(s=>s.trim()).filter(Boolean).join(' ').slice(0,320)),true);
 assert.equal(isGfl2SteamShellText('limbus',old.sourceUrl,text),false);
 for(const url of ['https://evil.example/games/3308670/announcements/detail/668380665149915537','https://steamcommunity.com/games/1/announcements/detail/668380665149915537','https://other@steamcommunity.com/games/3308670/announcements/detail/668380665149915537'])assert.equal(isGfl2SteamShellText('gfl2',url,text),false);
 assert.equal(isGfl2SteamShellText('gfl2',old.sourceUrl,'지휘관, 새로운 업데이트 안내입니다. Steam에서 업데이트한 뒤 접속해 주세요.'),false);
 assert.equal(JSON.stringify(old),before);
});
test('Steam main/article wrappers and cached plain chrome cannot generate an imported body or summary',async()=>{
 const {bodyFromDocument,importBody}=await import('../lib/source-bodies.ts');
 const old=JSON.parse(readFileSync(new URL('public-gfl2-notice.json',root),'utf8')).entry;
 const text=old.sourceBodies.ko.text,document={gameId:'gfl2',region:'kr',locale:'ko',url:notice.url,title:'fixture',sourceAccess:'body',bodyHash:'fixture',checkedAt:'2026-10-30T00:00:00Z'};
 const entry={...old,summary:{ko:'',en:'',ja:'',zh:''}},before=JSON.stringify(entry);
 for(const content of [text,'<article>'+text+'</article>','<html><main>'+text+'</main></html>','<html><article>'+text+'</article></html>','<html><main>Site shell without article markup or known navigation</main></html>']){
  assert.equal(sourceDocument(content,notice.url).access,'js-only');
  assert.equal(bodyFromDocument(document,{text:content,images:['https://clan.fastly.steamstatic.com/images/45289242/fixture.png']}),null);
 }
 assert.equal(importBody(entry,{...old.sourceBodies.ko,sourceUrl:notice.url}),entry);
 assert.equal(JSON.stringify(entry),before);
});
test('correct native imports keep authored summaries and other locales unchanged',async()=>{
 const {bodyFromDocument,importBody}=await import('../lib/source-bodies.ts');
 const native=await regionalDetail(notice,async()=>Response.json(fixture));
 const parsed=sourceDocument(native,notice.url),document={gameId:'gfl2',region:'kr',locale:'ko',url:notice.url,title:'fixture',sourceAccess:'body',bodyHash:'native-fixture',checkedAt:'2026-10-30T00:00:00Z'};
 const body=bodyFromDocument(document,{text:parsed.text,images:parsed.images});assert.ok(body);
 const entry={gameId:'gfl2',region:'kr',sourceLocale:'ko',sourceUrl:notice.url,summary:{ko:'운영자가 쓴 요약',en:'Existing English',ja:'',zh:''},title:{ko:'제목',en:'Existing title',ja:'',zh:''},sourceBodies:{en:{locale:'en',text:'Existing original',sourceUrl:notice.url}},rewards:[]};
 const before=JSON.stringify(entry),next=importBody(entry,body);
 assert.deepEqual(next.summary,entry.summary);assert.equal(next.sourceBodies.en,entry.sourceBodies.en);assert.equal(next.sourceBodies.ko.text,parsed.text);assert.equal(JSON.stringify(entry),before);
});
test('identity-valid API payloads containing Steam chrome fail instead of falling back to site HTML',async()=>{
 const old=JSON.parse(readFileSync(new URL('public-gfl2-notice.json',root),'utf8')).entry;
 for(const body of [old.sourceBodies.ko.text,'<!doctype html><html><main>Site shell</main></html>']){
  const data=structuredClone(fixture);data.event.announcement_body.body=body;
  await assert.rejects(regionalDetail(notice,async()=>Response.json(data)),/site chrome/);
 }
});

test('public summary hides retained Steam chrome while source and real game prose remain intact',async()=>{
 const {displaySummary}=await import('../lib/content-display.ts');
 const old=JSON.parse(readFileSync(new URL('public-gfl2-notice.json',root),'utf8')).entry;
 const text=old.sourceBodies.ko.text.split('\n').map(s=>s.trim()).filter(Boolean).join(' ').slice(0,320);
 const entry={...old,summary:{ko:text,en:text,ja:text,zh:text}},before=structuredClone(entry);
 for(const locale of ['ko','en','ja','zh'])assert.equal(displaySummary(entry,locale),'');
 assert.deepEqual(entry,before);
 const facts='웰로드 지정 발주 확률 UP. 종료 11월 18일 18:59.';
 assert.equal(displaySummary({...entry,summary:{...entry.summary,ko:facts}},'ko').replace(/\s+/g,' '),facts);
 assert.ok(displaySummary({...entry,gameId:'limbus'},'ko').includes('Steam'));
});
