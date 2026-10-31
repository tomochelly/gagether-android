import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
import geometry from '../content/gallery-subject-bounds.json' with {type:'json'};
import runtime from '../content/gallery-framing-runtime.json' with {type:'json'};
import reviewed from '../content/maintenance-gallery-focus.json' with {type:'json'};
const {rosterArt,rosterArts}=await import('../lib/character-roster.ts');
const {rosterGalleryFocus,reviewedRosterArtFrame}=await import('../lib/roster-gallery-focus.ts');
const {splashPortraitFrame,safeGalleryFrame,gallerySubject}=await import('../lib/gallery-framing.ts');
const {CharacterFacts,default:Gallery}=await import('../components/character-roster.tsx');

test('lossless framing dictionary retains every exact URL and number with a smaller client payload',()=>{
 const expanded={rows:runtime.rows,entries:runtime.entries.map(([p,s,n])=>[runtime.prefixes[p]+s,n]),backgrounds:runtime.backgrounds};
 assert.ok(JSON.stringify(runtime).length<JSON.stringify(expanded).length*.85);
 assert.equal(runtime.entries.length,Object.keys(geometry.entries).length);
 for(const[url,b]of Object.entries(geometry.entries)){const {sha256,...expected}=b;assert.deepEqual(gallerySubject(url),expected);}
});
test('reviewed maintenance heads stay visible across narrow cards, density and DPR; unrelated replacements keep no inferred frame',()=>{
 assert.ok(reviewed.entries.filter(r=>r.gameId==='zzz').length===61);
 assert.ok(reviewed.entries.filter(r=>r.gameId==='genshin').length===26);
 for(const r of reviewed.entries){
  const h=rosterGalleryFocus(r.gameId,r.url);
  assert.equal(rosterGalleryFocus(r.gameId,r.url+'?replacement=1'),undefined);
  if(!r.head){
   assert.equal(h,undefined);const b=gallerySubject(r.url);assert.ok(b,r.id);
   for(const dpr of [1,2,3]){const f=safeGalleryFrame(r,{width:180,height:300},b,28,dpr);assert.ok(f);assert.ok(f.scale<=1/dpr);for(const[x,y]of [[b.left,b.top],[b.right,b.bottom]]){const px=f.left+r.width*x/100*f.scale,py=f.top+r.height*y/100*f.scale;assert.ok(px>=28&&px<=152&&py>=9&&py<=234,r.id);}}
   continue;
  }
  assert.ok(h,r.id);
  for(const [width,height,slant]of [[180,300,28],[240,400,28],[400,450,60]])for(const dpr of [1,2,3]){
   const f=splashPortraitFrame(r,{width,height},h,slant,dpr);assert.ok(f,r.id);assert.ok(f.scale<=1/dpr+1e-8);
   for(const [x,y]of [[h.left,h.top],[h.right,h.top],[h.left,h.bottom],[h.right,h.bottom]]){
    const px=f.left+r.width*x/100*f.scale,py=f.top+r.height*y/100*f.scale;
    assert.ok(py>=12-1e-6&&py<=height-90+1e-6,r.gameId+':'+r.id);
    for(const reversed of [false,true]){const edge=reversed?slant*py/height:slant*(1-py/height);assert.ok(px>=edge-1e-6&&px<=width-slant+edge+1e-6,r.id);}
   }
  }
  const manual={x:9,y:34,zoom:.2,fit:'contain'};assert.deepEqual(reviewedRosterArtFrame(r.gameId,[{url:r.url,gallery:manual}],r.url,'gallery'),manual);
 }
});
test('an independently selected Japanese service shows its exact Japanese card with an original label, never relabels it neutral or borrows it into KR',()=>{
 const data=bootstrap.find(r=>r.gameId==='bluearchive');
 for(const id of ['20061','10151','20062','10152']){
  const c=data.characters.find(c=>c.id===id),before=JSON.stringify(c),art=rosterArt(c,'ko','jp');
  assert.ok(art,id);assert.equal(art.locale,'ja');assert.equal(art.kind,'card');assert.equal(rosterArt(c,'ko','kr'),undefined);
  const html=renderToStaticMarkup(React.createElement(CharacterFacts,{character:c,locale:'ko',service:'jp',gameId:'bluearchive'})),doc=new JSDOM(html).window.document;
  assert.match(doc.querySelector('.roster-detail-language').textContent,/일본어.*원문/);assert.equal(JSON.stringify(c),before);
 }
 const c={images:[{url:'https://example.org/ko.png',locale:'ko',kind:'splash'},{url:'https://example.org/ja.png',locale:'ja',kind:'splash'}]};
 assert.equal(rosterArts(c,'ko','global')[0].locale,'ko');assert.equal(rosterArts(c,'ko','jp')[0].locale,'ja');assert.equal(rosterArts(c,'ja','kr')[0].locale,'ko');
});
test('all seven standing-art galleries inherit tall continuous cards and name-adjacent stars in every language',()=>{
 for(const gameId of ['bluearchive','nikke','umamusume','zzz','gfl2','reverse1999','endfield'])for(const locale of ['ko','en','ja','zh']){
  const data=bootstrap.find(r=>r.gameId===gameId),sample={...data,characters:data.characters.slice(0,2)};
  const doc=new JSDOM(renderToStaticMarkup(React.createElement(Gallery,{gameId,locale,initialData:sample}))).window.document;
  assert.ok(doc.querySelector('.roster-portrait'),gameId);assert.equal(doc.querySelectorAll('.roster-rarity').length,0);
  if(doc.querySelector('.roster-name-stars'))assert.ok(doc.querySelector('.roster-card-caption .roster-name-stars'));
 }
});
