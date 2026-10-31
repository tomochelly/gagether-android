import './load-typescript.mjs';
import{test}from'node:test';import assert from'node:assert/strict';import React from'react';import{renderToStaticMarkup}from'react-dom/server';import{JSDOM}from'jsdom';
import reference from'../content/wuwa-reference.json'with{type:'json'};
const{wuwaAnnouncements,wuwaAnnouncement,releasedAnnouncement}=await import('../lib/wuwa-announcements.ts');
const{rosterCharacterSchema}=await import('../lib/character-roster.ts');
const{default:Announcements}=await import('../components/wuwa-announcements.tsx');
test('Lily has four exact official introduction names, a synthetic preview ID and no invented combat facts',()=>{
 const row=rosterCharacterSchema.parse(wuwaAnnouncement('announced-lily'));assert.deepEqual(row.name,{ko:'릴리',en:'Lily',ja:'リリー',zh:'莉莉'});assert.equal(row.sourceId,undefined);assert.equal(row.rarity,undefined);assert.equal(row.stats,undefined);assert.equal(row.statProgression,undefined);assert.equal(row.availability.status,'announced');assert.equal(row.detailSources.length,4);
 for(const locale of ['ko','en','ja','zh']){const d=new JSDOM(renderToStaticMarkup(React.createElement(Announcements,{characters:reference.characters,locale,search:row.name[locale]}))).window.document;assert.equal(d.querySelector('strong').textContent,row.name[locale]);assert.ok(d.querySelector('a').href.endsWith('/characters/announced-lily'));assert.equal(d.querySelector('img').src,'https://gagether.wiki/assets/leaks/lily-cover.jpg');if(locale!=='ja')assert.ok(d.querySelector('small').textContent);}
});
test('a released exact native identity removes the preview; similar prefixes and a single translated-name collision do not',()=>{
 const row=wuwaAnnouncement('announced-lily'),known={id:'verified-native-id',name:row.name};
 assert.equal(releasedAnnouncement(row,[known]),known);assert.equal(wuwaAnnouncements([...reference.characters,known]).some(c=>c.id===row.id),false);
 assert.equal(releasedAnnouncement(row,[{...known,name:{...row.name,en:'Lily of the Valley',ko:'다른 캐릭터',ja:'別名',zh:'别名'}}]),undefined);
 assert.equal(releasedAnnouncement(row,[{...known,name:{en:'Lily',ko:'',ja:'',zh:''}}]),undefined);
 const d=new JSDOM(renderToStaticMarkup(React.createElement(Announcements,{characters:reference.characters,locale:'en',filtered:true}))).window.document;assert.equal(d.querySelector('.reference-announcements'),null);
});
