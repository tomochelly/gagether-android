import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const {parseLeakFeed,leakSources,leakGame,declaredLeakImages}=await import('../lib/leaks.ts');
const {entryDiscoveryMetadata,sectionDiscoveryMetadata,entryPath,discoverableEntry}=await import('../lib/discovery.ts');
const {default:LeakLanding}=await import('../components/leak-landing.tsx');
const {catalogLocaleHeaders}=await import('../lib/catalog-paths.ts');
const loc=s=>({ko:s,en:s,ja:s,zh:s}),entry={id:'current-notice',gameId:'hi3',region:'jp',kind:'update',title:loc('Ver.9.1 変更点'),summary:loc(''),sourceLocale:'ja',sourceUrl:'https://honkaiimpact3.hoyoverse.com/jp/ja-jp/news/1',sourceTitle:'Current update',startAt:null,endAt:null,publishedAt:'2026-10-20',verifiedAt:'2026-10-24T00:00:00Z'};
test('Chinese Atom preserves author body and publication instant, excludes comment-only leak flags and wrong-character images',()=>{
 const source=leakSources.find(s=>s.host==='disp.cc'),rows=parseLeakFeed(fs.readFileSync('tests/fixtures/leaks/disp-atom.xml','utf8'),source,'2026-10-24T12:00:00Z');assert.equal(rows.length,1);assert.equal(rows[0].gameId,'zzz');assert.equal(rows[0].publishedAt,'2026-10-24T07:26:04.000Z');assert.equal(rows[0].url,'https://disp.cc/b/21-iiDl');assert.ok(!rows[0].body.includes('捏造'));assert.ok(!rows[0].body.includes('作者 header'));assert.deepEqual(rows[0].images,['https://imgur.disp.cc/test/model.jpg']);
 for(const [s,id] of [['崩壞3 測試服 爆料','hi3'],['終末地 內鬼','endfield'],['星穹鐵道 爆料','hsr']])assert.equal(leakGame(s),id);
 assert.equal(declaredLeakImages('<img src="https://evil.example/model.jpg">','https://disp.cc/b/x').length,0);
});
test('discoverable leak landing is identical warning content for people and crawlers, with no spoiler art or pre-consent fetch',()=>{
 for(const locale of ['ko','en','ja','zh']){const meta=sectionDiscoveryMetadata('hi3',locale,'leaks'),html=renderToStaticMarkup(React.createElement(LeakLanding,{gameId:'hi3',locale}));assert.equal(meta.robots.index,true);assert.ok(meta.alternates.canonical.endsWith('/hi3/leaks'));assert.match(html,/role="alertdialog"/);assert.doesNotMatch(html,/<img|leak-article|Vita|리리|Lily/);assert.equal(catalogLocaleHeaders(new Request(meta.alternates.canonical)).get('x-gagether-route-locale'),locale);}
});
test('individual content pages have descriptive native titles, actual service identity and self canonicals without keyword stuffing',()=>{
 for(const locale of ['ko','en','ja','zh']){const meta=entryDiscoveryMetadata(entry,locale);assert.equal(meta.alternates.canonical,'https://gagether.wiki'+entryPath(locale,entry));assert.ok(meta.title.includes('9.1'));assert.ok(meta.title.includes('GAGETHER'));assert.equal(meta.keywords,undefined);assert.equal(meta.robots.index,true);assert.equal(catalogLocaleHeaders(new Request(meta.alternates.canonical)).get('x-gagether-route-locale'),locale);}
 assert.equal(discoverableEntry({...entry,hidden:true},'ja'),false);assert.equal(discoverableEntry({...entry,broadcast:{status:'ended'}},'ja'),false);assert.equal(discoverableEntry({...entry,title:{...entry.title,ko:''}},'ko'),false);
});
