import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import rosters from '../content/character-rosters/bootstrap.json' with {type:'json'};
import wuwa from '../content/wuwa-reference.json' with {type:'json'};
const {default:Gallery,CharacterFacts}=await import('../components/character-roster.tsx');
const {default:WuwaGallery,WuwaCharacterFacts}=await import('../components/wuwa-reference.tsx');
const {default:CharacterName}=await import('../components/character-name.tsx');
const {rosterCopy}=await import('../lib/character-roster.ts');
const locales=['ko','en','ja','zh'];
const nativeText=(game,c,locale)=>{
 if(game==='nikke')return ({1:'R',2:'SR',3:'SSR'})[c.rarity];
 if(game==='zzz')return ({3:'A',4:'S'})[c.rarity];
 if(game==='nte')return ({4:'A',5:'S'})[c.rarity];
 if(game==='limbus')return ({1:'0',2:'00',3:'000'})[c.rarity];
 if(game==='gfl2'){const rank=c.traits.find(t=>t.id==='rank')?.value;return rank&&(rank[locale]||rank.en);}
 return c.rarity?'★'.repeat(c.rarity):undefined;
};
function checkName(node,name,text){
 assert.ok(node?.classList.contains('roster-name-row'));
 assert.equal(node.querySelector('.roster-name-text').textContent,name);
 const grade=node.querySelector('.roster-name-grade');
 if(text){assert.equal(grade?.parentElement,node);assert.equal(grade.textContent,text);if(text.includes('★')){assert.equal(grade.getAttribute('role'),'img');assert.equal(grade.getAttribute('aria-label'),text.length+' ★');}else assert.equal(grade.getAttribute('role'),null);}
 else assert.equal(grade,null);
}
test('all17 shared codices render native game grades beside names in gallery and detail in four languages, never in detached badges',()=>{
 assert.equal(rosters.length,17);
 const before=JSON.stringify(rosters.map(r=>r.characters.map(c=>[c.id,c.rarity,c.rarityLabel])));
 for(const roster of rosters){
  const representatives=[...new Map(roster.characters.map(c=>[String(c.rarity)+'|'+c.rarityLabel+'|'+c.traits?.find(t=>t.id==='rank')?.value.en,c])).values()].map(c=>({id:c.id,name:c.name,rarity:c.rarity,rarityLabel:c.rarityLabel,regions:['global'],sourceUrl:c.sourceUrl,sourceKind:c.sourceKind,traits:c.traits||[]}));
  for(const locale of locales){
   const dom=new JSDOM(renderToStaticMarkup(React.createElement(Gallery,{gameId:roster.gameId,locale,region:'global',initialData:{...roster,characters:representatives},initialRead:{revision:'fixture',readAt:Date.now()}}))),d=dom.window.document;
   assert.equal(d.querySelector('.roster-rarity'),null);
   const cards=[...d.querySelectorAll('.roster-card')];assert.equal(cards.length,representatives.length);
   for(const c of representatives){
    const card=cards.find(a=>a.getAttribute('href').includes('/'+encodeURIComponent(c.id)+'?'));
    assert.ok(card,roster.gameId+':'+c.id);checkName(card.querySelector('.roster-card-caption>strong'),rosterCopy(c.name,locale),nativeText(roster.gameId,c,locale));
    const grade=d.querySelector(`select[aria-label="${{ko:'등급',en:'Rarity',ja:'レアリティ',zh:'稀有度'}[locale]}"] option[value="${c.rarity}"]`);
    if(c.rarity!==undefined&&representatives.length>1)assert.equal(grade.textContent,nativeText(roster.gameId,c,locale));
    const detail=new JSDOM(renderToStaticMarkup(React.createElement(CharacterFacts,{character:c,gameId:roster.gameId,locale,service:'global'})));
    checkName(detail.window.document.querySelector('.roster-detail-caption>h2'),rosterCopy(c.name,locale),nativeText(roster.gameId,c,locale));
    assert.equal(detail.window.document.querySelector('.roster-detail-caption>span'),null);detail.window.close();
   }
   dom.window.close();
  }
 }
 assert.equal(JSON.stringify(rosters.map(r=>r.characters.map(c=>[c.id,c.rarity,c.rarityLabel]))),before);
});
test('WuWa uses the same name-adjacent stars for every gallery form and each detail grade in all languages',()=>{
 for(const locale of locales){
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(WuwaGallery,{locale,section:'characters',initialRead:{data:wuwa,view:'directory',revision:'fixture',readAt:Date.now()},now:Date.now()}))),d=dom.window.document;
  assert.equal(d.querySelector('.reference-panel-copy>small'),null);
  assert.equal(d.querySelectorAll('.reference-gallery-panel').length,wuwa.characters.length);
  for(const c of wuwa.characters)checkName(d.querySelector(`[data-character-id="${c.id}"] .reference-panel-copy>strong`),c.name[locale],'★'.repeat(c.rarity));
  for(const c of new Map(wuwa.characters.map(c=>[c.rarity,c])).values()){
   const detail=new JSDOM(renderToStaticMarkup(React.createElement(WuwaCharacterFacts,{character:c,locale,detailsPending:true})));
   checkName(detail.window.document.querySelector('.reference-character-title>h2'),c.name[locale],'★'.repeat(c.rarity));
   assert.equal(detail.window.document.querySelector('.reference-hero-rarity'),null);detail.window.close();
  }
  dom.window.close();
 }
});
test('the shared name retains long text and never invents a grade for missing, zero or invalid rarity',()=>{
 const name='A long character name / 別衣装 / 긴 캐릭터 이름';
 for(const rarity of [undefined,0,-1,1.5,NaN,Infinity,11]){
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(CharacterName,{name,gameId:'genshin',rarity})));
  assert.equal(dom.window.document.querySelector('.roster-name-text').textContent,name);
  assert.equal(dom.window.document.querySelector('.roster-name-stars'),null);dom.window.close();
 }
});
