import './load-typescript.mjs';
import{test}from'node:test';import assert from'node:assert/strict';import React from'react';import{renderToStaticMarkup}from'react-dom/server';import{JSDOM}from'jsdom';
const{rosterCharacterSchema,rosterDirectory}=await import('../lib/character-roster.ts');
const{announcedCharacterPreview}=await import('../lib/roster-availability.ts');
const{hydrateRosterDetails}=await import('../lib/roster-detail-catalog.ts');
const{CharacterFacts}=await import('../components/character-roster.tsx');
const copy=s=>({ko:s,en:s,ja:s,zh:s}),announcement='https://zenless.hoyoverse.com/en-us/news/166054';
const source={id:'1631',sourceId:'1631',name:copy('Severian'),rarity:4,rarityLabel:'S',sourceUrl:'https://example.org/native/1631',sourceKind:'community',availability:{status:'announced',sourceUrl:announcement}};
test('official announcements retain identity and provenance but never hydrate beta stats or packed skills',async()=>{
 const stats=[{id:'hp',label:copy('HP'),value:'12345',basis:copy('Beta')}],c={...source,stats,sections:[{id:'beta',title:copy('Skill'),body:copy('Unreleased skill')}],variantDetails:{beta:{sourceId:'1631',stats}},detailSources:[{url:announcement,kind:'official'},{url:'https://example.org/beta',kind:'community'}]};
 const before=JSON.stringify(c),safe=announcedCharacterPreview(rosterCharacterSchema.parse(c));
 assert.equal(safe.id,'1631');assert.deepEqual(safe.name,c.name);assert.deepEqual(safe.availability,c.availability);assert.equal(safe.stats,undefined);assert.equal(safe.sections,undefined);assert.equal(safe.variantDetails,undefined);assert.equal(safe.detailSources.length,1);assert.equal(JSON.stringify(c),before);
 const data={gameId:'zzz',characters:[c],detailCatalog:{version:3,forms:{1631:{payload:'invalid',sourceId:'1631'}}}};
 assert.deepEqual(await hydrateRosterDetails(data,c),safe);
 assert.deepEqual(rosterDirectory({...data,characters:[safe]}).characters[0].availability,c.availability);
 const released={...c,availability:{...c.availability,status:'released'}};assert.equal(announcedCharacterPreview(released),released);assert.equal(released.stats[0].value,'12345');
 assert.equal(rosterCharacterSchema.safeParse({...source,availability:{status:'guessed',sourceUrl:announcement}}).success,false);
 assert.equal(rosterCharacterSchema.safeParse({...source,availability:{status:'announced',sourceUrl:'http://unsafe.test'}}).success,false);
});
test('all four locales show upcoming status and the official source without empty combat menus or fabricated release dates',()=>{
 for(const [locale,label]of Object.entries({ko:'출시 예정',en:'Upcoming',ja:'実装予定',zh:'即将登场'})){
  const d=new JSDOM(renderToStaticMarkup(React.createElement(CharacterFacts,{character:source,gameId:'zzz',locale,service:'global'}))).window.document;
  assert.ok(d.querySelector('.roster-availability').textContent.includes(label));assert.equal(d.querySelector('a[href="'+announcement+'"]').href,announcement);assert.equal(d.querySelector('.roster-name-grade').textContent,'S');assert.equal(d.querySelector('.character-section-nav'),null);assert.equal(d.querySelector('.roster-stats'),null);assert.equal(d.querySelector('time'),null);
 }
});
