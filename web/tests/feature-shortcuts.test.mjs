import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {default:Shortcuts}=await import('../components/feature-shortcuts.tsx');
const {games}=await import('../lib/games.ts');
const {defaultAnnouncements,announcementHref,visibleAnnouncements,safeAnnouncementLink}=await import('../lib/site-announcements.ts');
const {gameLaunchLabel,gameLaunchShortLabel}=await import('../lib/game-launch.ts');

test('home shortcuts expose localized build, record, stats and simulator links without writing visitor data',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki'}),previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});const root=createRoot(document.getElementById('root'));
 try{for(const locale of ['ko','en','ja','zh']){
  await act(()=>root.render(React.createElement(Shortcuts,{locale,games,favorites:['gfl2']})));
  const buttons=[...document.querySelectorAll('.feature-shortcuts-actions button')],combat=buttons[0];assert.equal(document.querySelectorAll('.feature-shortcuts-panel').length,0);assert.equal(document.querySelector('.feature-shortcuts-actions>a').getAttribute('href'),`/${locale}/community`);
  await act(()=>combat.click());assert.equal(combat.getAttribute('aria-expanded'),'true');const groups=[...document.querySelectorAll('.feature-shortcuts-games>div')];assert.equal(groups.length,3);assert.equal(groups[0].querySelector('strong').textContent,games.find(g=>g.id==='gfl2').name[locale]);
  const actual=[...document.querySelectorAll('.feature-shortcuts-games a')].map(a=>a.getAttribute('href'));for(const game of ['wuwa','zzz','gfl2'])for(const view of ['setups','records','stats'])assert.ok(actual.includes(`/${locale}/games/${game}/combat?view=${view}`));
  await act(()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(document.querySelectorAll('.feature-shortcuts-panel').length,0);assert.equal(document.activeElement,combat);
  await act(()=>buttons[1].click());assert.deepEqual([...document.querySelectorAll('.feature-shortcuts-games a')].map(a=>a.getAttribute('href')),[`/${locale}/games/wuwa/convene`,`/${locale}/games/nte/convene`]);
  await act(()=>document.body.dispatchEvent(new window.MouseEvent('pointerdown',{bubbles:true})));assert.equal(document.querySelectorAll('.feature-shortcuts-panel').length,0);
 }
 assert.equal(window.localStorage.length,0);
 }finally{await act(()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);}
});

test('latest notices keep owner overrides and localize only supported relative links',()=>{
 for(const locale of ['ko','en','ja','zh']){const notices=visibleAnnouncements(undefined,locale);assert.equal(notices.length,3);for(const n of notices){assert.equal(n.publishedDate,'2026-10-30');assert.ok(n.title[locale]&&n.body[locale]);assert.ok(safeAnnouncementLink(n.href));assert.ok(announcementHref(n.href,locale).startsWith('/'+locale+'/'));}assert.deepEqual(visibleAnnouncements([],locale),[]);}
 const owner={id:'owner',title:{ko:'직접 쓴 공지'},body:{ko:'직접 쓴 내용'},href:'/ko/custom'};assert.deepEqual(visibleAnnouncements([owner],'ko'),[owner]);assert.equal(announcementHref(owner.href,'en'),'/ko/custom');assert.equal(announcementHref('https://example.com/article','ja'),'https://example.com/article');assert.equal(safeAnnouncementLink('javascript:alert(1)'),false);assert.equal(defaultAnnouncements.length,3);
});

test('Korean library dates are short while regional facts and all full launch labels remain intact',()=>{
 const before=JSON.stringify(games),silver=games.find(g=>g.id==='silver-palace'),azur=games.find(g=>g.id==='azur-promilia'),ananta=games.find(g=>g.id==='ananta');assert.equal(gameLaunchShortLabel(silver,'ko'),'미정');assert.equal(gameLaunchShortLabel(azur,'ko'),'2026년 11월 26일');assert.equal(gameLaunchShortLabel(ananta,'ko'),'2027년 1월 15일');assert.equal(gameLaunchShortLabel(azur,'ko','global'),'미정');assert.match(gameLaunchLabel(azur,'ko'),/한국.*출시 예정/);for(const locale of ['en','ja','zh'])for(const game of [silver,azur,ananta])assert.equal(gameLaunchShortLabel(game,locale),gameLaunchLabel(game,locale));assert.equal(JSON.stringify(games),before);
});
