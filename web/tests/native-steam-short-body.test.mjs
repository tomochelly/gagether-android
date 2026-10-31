import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {parseSteamEvents,additionalNoticeBody,steamBodyHtml}=await import('../lib/additional-game-notices.ts');
const {sourceDocument}=await import('../lib/collection-review.ts');
const fixture=JSON.parse(readFileSync(new URL('./fixtures/additional/holodreams-short-native.json',import.meta.url),'utf8'));
const locales={koreana:'ko',english:'en',japanese:'ja',schinese:'zh'};
const native=row=>parseSteamEvents({success:1,events:[row.event]},'holodreams',locales[row.language])[0];
test('actual four-language Holo1.2.101 native articles are bodies even below thirty characters',async()=>{
 for(const row of fixture){
  const notice=native(row);assert.equal(notice.id,'677387864414093794');assert.notEqual(notice.id,row.event.announcement_body.gid);
  const body=await additionalNoticeBody(notice,async()=>Response.json({success:1,events:[row.event]}));
  assert.equal(body,notice.bodyHtml);const parsed=sourceDocument(body,notice.url);
  assert.equal(parsed.access,'body');assert.equal(parsed.text,row.event.announcement_body.body.replace(/^\[p\]|\[\/p\]$/g,''));assert.ok(parsed.text.length<30);assert.deepEqual(parsed.images,[]);
  assert.equal(notice.publishedAt,new Date(row.event.announcement_body.posttime*1000).toISOString());assert.equal(notice.startAt,undefined);assert.equal(notice.endAt,undefined);
 }
});
test('native short-body eligibility still starts with exact publisher/app/language and known event identity',async()=>{
 const row=fixture[0],notice=native(row);
 for(const mutate of [e=>e.appid=1,e=>e.clan_steamid='0',e=>e.announcement_body.clanid='0',e=>e.announcement_body.language=0,e=>e.published=0,e=>e.hidden=1,e=>e.gid=e.announcement_body.gid]){
  const event=structuredClone(row.event);mutate(event);
  assert.equal(await additionalNoticeBody(notice,async()=>Response.json({success:1,events:[event]})),undefined);
 }
});
test('short arbitrary pages, scripts, login chrome and unregistered URLs remain metadata or unavailable',()=>{
 const url=native(fixture[0]).url,body=steamBodyHtml('Fixed various minor bugs.');
 for(const wrong of ['https://example.test/news/1',url.replace('/4282500/','/1/'),url.replace('https:','http:'),url.replace('?l=koreana',''),url+'&other=1',url+'#fragment',url.replace('store.steampowered.com','owner@store.steampowered.com')])assert.notEqual(sourceDocument(body,wrong).access,'body');
 for(const input of ['Fixed various minor bugs.','<p>Fixed various minor bugs.</p>','<main>Fixed various minor bugs.</main>','<html><article>Fixed various minor bugs.</article></html>','<article><script>alert(1)</script></article>','<article><nav>Sign in</nav></article>','<article><article>Fixed bugs.</article></article>','<article>Fixed bugs.</article><p>extra</p>'])assert.notEqual(sourceDocument(input,url).access,'body',input);
 for(const text of ['', 'Sign in','로그인','Loading...','Community Hub','console.log(1)','document.write("x")','alert("x")'])assert.notEqual(sourceDocument(steamBodyHtml(text),url).access,'body',text);
 const shell='<html><script>'+('x'.repeat(1300))+'</script><div id="app"></div></html>';assert.equal(sourceDocument(shell,url).access,'js-only');
});
test('short article exception does not remove the general thirty-character rule or image-only article support',()=>{
 assert.equal(sourceDocument('<article>Fixed bugs.</article>','https://bluearchive.jp/news/1').access,'metadata');
 const url=native(fixture[0]).url;assert.equal(sourceDocument('<article><img src="https://example.test/native.png"></article>',url).access,'body');
 assert.equal(sourceDocument('<p>Ordinary full article content remains readable and unchanged.</p>','https://bluearchive.jp/news/1').access,'body');
});
