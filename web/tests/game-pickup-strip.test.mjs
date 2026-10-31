import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
const {default:Strip}=await import('../components/game-pickup-strip.tsx');
const {spotlightSlides}=await import('../lib/spotlight.ts');
const name=(en,ko=en)=>({ko,en,ja:en,zh:en});
const entry={id:'test-characters',gameId:'nte',region:'global',kind:'pickup',poolType:'character',title:name('Current pickup'),summary:name(''),startAt:'2026-10-01T00:00:00Z',endAt:'2026-11-10T00:00:00Z',sourceUrl:'https://example.org/notice',pickupMembers:[{name:name('First','첫 캐릭터'),rarity:5,image:'https://example.org/first.png',imageSource:'https://example.org',imageVerified:true,imageLocale:'neutral',imageFraming:{card:{fit:'contain',x:51,y:62,zoom:1.6}}},{name:name('Second','둘째 캐릭터'),rarity:4,image:'https://example.org/second.png',imageSource:'https://example.org',imageVerified:true,imageLocale:'neutral'}]};
const now=Date.parse('2026-10-30T17:00:00Z');
test('four locale pickup bands show every current member, correct rank and native canonical links without caption boxes or disclosure',()=>{
 const original=JSON.stringify(entry),slides=spotlightSlides([entry],now,'nte');
 assert.equal(slides.length,2);assert.deepEqual(slides[0].art.imageFraming.card,entry.pickupMembers[0].imageFraming.card);
 for(const locale of ['ko','en','ja','zh']){const d=new JSDOM(renderToStaticMarkup(React.createElement(Strip,{slides,locale,now,onOpen(){}}))).window.document;
  assert.equal(d.querySelectorAll('.game-pickup-tiles>li').length,2);assert.equal(d.querySelectorAll('details').length,0);
  assert.deepEqual([...d.querySelectorAll('.game-pickup-grade')].map(n=>n.textContent),['S','A']);
  assert.deepEqual([...d.querySelectorAll('.game-pickup-caption>strong')].map(n=>n.textContent),[entry.pickupMembers[0].name[locale],entry.pickupMembers[1].name[locale]]);
  for(const a of d.querySelectorAll('.game-pickup-tiles a'))assert.ok(a.getAttribute('href').startsWith('/'+locale+'/games/nte/'));
  assert.equal(d.querySelectorAll('button[aria-label]').length,2);assert.equal(d.querySelectorAll('.pickup-thumbnail img').length,2);
 }
 assert.equal(JSON.stringify(entry),original);
});
test('single pickup remains visible and an empty lineup creates no empty band',()=>{
 assert.equal(renderToStaticMarkup(React.createElement(Strip,{slides:[],locale:'ko',now,onOpen(){}})),'');
 const slides=spotlightSlides([{...entry,pickupMembers:[entry.pickupMembers[0]]}],now,'nte'),d=new JSDOM(renderToStaticMarkup(React.createElement(Strip,{slides,locale:'en',now,onOpen(){}}))).window.document;
 assert.equal(d.querySelectorAll('.game-pickup-tiles>li').length,1);assert.equal(d.querySelectorAll('button').length,0);
});
test('game public band uses the existing section while owner carousel remains and mobile drawer ignores horizontal illustration swipes',()=>{
 const radar=readFileSync(new URL('../components/radar.tsx',import.meta.url),'utf8'),drawer=readFileSync(new URL('../components/use-mobile-drawer.ts',import.meta.url),'utf8'),css=readFileSync(new URL('../app/game-pickup-strip.css',import.meta.url),'utf8');
 assert.match(radar,/view==='game'&&!editMode\?<GamePickupStrip/);assert.match(radar,/:simpleMode\?<ArtworkDisclosure/);assert.match(drawer,/\.game-pickup-tiles/);
 assert.match(css,/grid-auto-flow:column/);assert.match(css,/overflow-x:auto/);assert.match(css,/game-pickup-caption\{position:absolute/);
});
