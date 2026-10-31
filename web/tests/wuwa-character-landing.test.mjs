import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import snapshot from '../content/wuwa-reference.json' with {type:'json'};

registerHooks({
 resolve(specifier,context,next){
  if(specifier==='@/app/api/wuwa/library/route')return {url:'test:wuwa-detail-read',shortCircuit:true};
  if(specifier==='@/lib/roster-public-read')return {url:'test:wuwa-normal-roster',shortCircuit:true};
  if(specifier==='next/navigation')return {url:'test:wuwa-detail-navigation',shortCircuit:true};
  return next(specifier,context);
 },
 load(url,context,next){
  if(url==='test:wuwa-detail-read')return {format:'module',source:'export const GET=async request=>globalThis.__wuwaSeoRead(request)',shortCircuit:true};
  if(url==='test:wuwa-normal-roster')return {format:'module',source:'export const readPublicCharacterRoster=async()=>{throw Error("WuWa used normal roster")}',shortCircuit:true};
  if(url==='test:wuwa-detail-navigation')return {format:'module',source:'export function redirect(url){const e=Error("REDIRECT");e.status=307;e.url=url;throw e}export function notFound(){const e=Error("NOT_FOUND");e.status=404;throw e}',shortCircuit:true};
  return next(url,context);
 }
});
const {default:CharacterPage,generateMetadata}=await import('../app/[locale]/games/[gameId]/characters/[characterId]/page.tsx');
const {default:Panel}=await import('../components/wuwa-reference.tsx');
const {referenceArtwork}=await import('../lib/wuwa-reference-view.ts');
const {wuwaLevel90Stats}=await import('../lib/wuwa-reference.ts');
const character=snapshot.characters.find(c=>c.name.en==='Jinhsi');
const props=(locale='en',characterId=character.id)=>({params:Promise.resolve({locale,gameId:'wuwa',characterId}),searchParams:Promise.resolve({region:'cn'})});

test('every WuWa gallery form has a crawlable native detail address before hydration in all four languages',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const dom=new JSDOM(renderToString(React.createElement(Panel,{locale,section:'characters',now:Date.now(),initialRead:{data:snapshot,view:'directory',revision:'source-1',readAt:Date.now()}})));
  const links=[...dom.window.document.querySelectorAll('.reference-gallery-panel[href]')];
  assert.equal(links.length,snapshot.characters.length);
  const byId=new Map(links.map(a=>[a.dataset.characterId,a]));
  for(const c of snapshot.characters){const a=byId.get(c.id);assert.equal(a.tagName,'A');assert.equal(a.getAttribute('href'),`/${locale}/games/wuwa/characters/${encodeURIComponent(c.id)}`);assert.ok(a.textContent.includes(c.name[locale]));}
  dom.window.close();
 }
});

test('real WuWa detail route renders localized facts, skill values, chains, full original and source without a browser fetch',async()=>{
 const requests=[];
 globalThis.__wuwaSeoRead=async request=>{requests.push(new URL(request.url));return Response.json({gameId:'wuwa',character,revision:'source-1'});};
 for(const locale of ['ko','en','ja','zh']){
  const page=await CharacterPage(props(locale)),dom=new JSDOM(renderToString(page)),document=dom.window.document;
  assert.equal(document.querySelector('h1').textContent,character.name[locale]);
  assert.ok(document.querySelector('.reference-identity').textContent.includes(character.element.name[locale]));
  assert.ok(document.querySelector('.reference-identity').textContent.includes(character.weapon.name[locale]));
  assert.deepEqual([...document.querySelectorAll('.reference-traits>span')].map(e=>e.textContent),character.tags.map(t=>t.name[locale]));
  const stats=character.stats90||wuwaLevel90Stats(character.stats);
  assert.deepEqual([...document.querySelectorAll('.reference-core-stats dd')].map(e=>e.textContent),[stats.hp,stats.atk,stats.def].map(n=>n.toLocaleString(locale)));
  for(const skill of character.skills){assert.ok([...document.querySelectorAll('.reference-skill-section h3')].some(h=>h.textContent===skill.name[locale]));for(const value of skill.values)if(value.levels[0])assert.ok([...document.querySelectorAll('.reference-skill-section dd')].some(dd=>dd.textContent===value.levels[0]));}
  assert.equal(document.querySelectorAll('.reference-chain').length,character.chains.length);
  for(const chain of character.chains)assert.ok(document.querySelector('.reference-character-body').textContent.includes(chain.name[locale]));
  const artwork=referenceArtwork(character),image=document.querySelector('.reference-hero-visual .reference-full-art');
  assert.equal(image.getAttribute('src'),artwork.url);assert.equal(image.getAttribute('width'),String(artwork.width));assert.equal(image.getAttribute('height'),String(artwork.height));
  assert.ok(document.querySelector(`.reference-source-link[href="${character.sourceUrl}"]`));
  assert.equal(document.querySelectorAll('.document-languages>a').length,4);assert.equal(document.querySelectorAll('[href*="region="]').length,0);assert.equal(document.querySelector('.roster-edit-art'),null);
  dom.window.close();
  const metadata=await generateMetadata(props(locale));
  assert.equal(metadata.alternates.canonical,`https://gagether.wiki/${locale}/games/wuwa/characters/${character.id}`);
  assert.deepEqual(Object.values(metadata.alternates.languages),['ko','en','ja','zh'].map(l=>`https://gagether.wiki/${l}/games/wuwa/characters/${character.id}`));
 }
 assert.equal(requests.length,8);
 for(const url of requests){assert.equal(url.pathname,'/api/wuwa/library');assert.deepEqual([...url.searchParams], [['id',character.id]]);}
});

test('announced WuWa pages show sourced previews without base-stat fabrication, and redirect after exact native release',async()=>{
 const previewProps=locale=>({params:Promise.resolve({locale,gameId:'wuwa',characterId:'announced-lily'})});
 globalThis.__wuwaSeoRead=async()=>Response.json({data:snapshot});
 const dom=new JSDOM(renderToString(await CharacterPage(previewProps('en')))),d=dom.window.document;
 assert.equal(d.querySelector('h1').textContent,'Lily');assert.match(d.querySelector('.roster-availability').textContent,/Upcoming/);assert.equal(d.querySelector('.roster-stats'),null);assert.equal(d.querySelector('.character-section-nav'),null);assert.equal(d.querySelector('time'),null);
 assert.ok(d.querySelector('.roster-availability a').href.includes('1EL_hOZzwH0'));
 const metadata=await generateMetadata(previewProps('en'));assert.equal(metadata.alternates.canonical,'https://gagether.wiki/en/games/wuwa/characters/announced-lily');
 const names={ko:'릴리',en:'Lily',ja:'リリー',zh:'莉莉'};globalThis.__wuwaSeoRead=async()=>Response.json({data:{...snapshot,characters:[...snapshot.characters,{...character,id:'actual-publisher-id',name:names}]}});
 await assert.rejects(CharacterPage(previewProps('en')),e=>e.status===307&&e.url==='/en/games/wuwa/characters/actual-publisher-id');dom.window.close();
});
test('missing WuWa identity is a real 404; upstream failures and wrong cached identities never become fake documents',async()=>{
 let calls=0;globalThis.__wuwaSeoRead=async()=>{calls++;return Response.json({error:'Character not found'},{status:404});};
 await assert.rejects(CharacterPage(props('en','missing-character')),e=>e.status===404);
 await assert.rejects(generateMetadata(props('en','missing-character')),e=>e.status===404);
 assert.equal(calls,2);
 await assert.rejects(CharacterPage(props('xx')),e=>e.status===404);
 await assert.rejects(CharacterPage(props('en','x'.repeat(201))),e=>e.status===404);
 assert.equal(calls,2,'invalid locale and identity stop before the public read');
 globalThis.__wuwaSeoRead=async()=>Response.json({error:'Temporarily unavailable'},{status:503});
 await assert.rejects(CharacterPage(props()),/Saved resonator unavailable/);
 globalThis.__wuwaSeoRead=async()=>Response.json({gameId:'wuwa',character:{...character,id:'different'}});
 await assert.rejects(CharacterPage(props()),/identity mismatch/);
 globalThis.__wuwaSeoRead=async()=>Response.json({gameId:'other-game',character});
 await assert.rejects(generateMetadata(props()),/identity mismatch/);
});
