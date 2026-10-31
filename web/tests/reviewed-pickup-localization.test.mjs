import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {reviewedPickupLocalization:localize}=await import('../lib/reviewed-pickup-localization.ts');
const {artworkForLocale}=await import('../lib/artwork.ts');
const {spotlightSlides}=await import('../lib/spotlight.ts');
const {pickupCards}=await import('../lib/pickup-cards.ts');
const review=JSON.parse(fs.readFileSync(new URL('../content/reviewed-pickup-localization.json',import.meta.url)));
const artReview=JSON.parse(fs.readFileSync(new URL('../content/reviewed-pickup-artwork.json',import.meta.url)));
const rule=review.changes[0],art=artReview.rules.find(r=>r.entryId===rule.entryId),locales=['ko','en','ja','zh'];
function original(){const old={...art.previous[0],imageVerified:true,imageKind:'character',imageLocale:'neutral'};return {id:rule.entryId,gameId:rule.gameId,region:rule.region,kind:'pickup',sourceUrl:rule.sourceUrl,...structuredClone(rule.expected),...old,startAt:null,startDate:'2026-10-29',endAt:'2026-11-19T04:59:59+09:00',verifiedAt:'2026-10-29T06:00:00Z',pickupMembers:[{name:structuredClone(rule.memberName.expected),role:'featured',type:'new',...old}],sourceBodies:{ko:{text:'Unmodified official source body',sha256:'immutable'}}};}

test('same official rotation localizes only known copied pickup fields and retains clocks, source and raw originals',()=>{
 const entry=original(),before=structuredClone(entry),next=localize(entry);
 assert.deepEqual(next.title,{ko:'마리안 : 퀸',en:'Marian: Queen',ja:'マリアン：クイーン',zh:'瑪麗安：女王'});
 assert.deepEqual(next.pickupMembers[0].name,next.title);
 for(const l of ['en','ja','zh']){assert.doesNotMatch(next.summary[l],/[가-힣]/);assert.doesNotMatch(next.timingNote[l],/[가-힣]/);assert.match(next.summary[l],/4[%％]/);assert.match(next.summary[l],/1[%％]/);}
 for(const key of ['startAt','startDate','endAt','verifiedAt','sourceUrl','image','imageSource'])assert.equal(next[key],entry[key]);
 assert.strictEqual(next.sourceBodies,entry.sourceBodies);assert.deepEqual(entry,before);assert.strictEqual(localize(next),next);
 assert.ok(next.relatedSources.some(s=>s.kind==='official'&&s.url.includes('7da04680')));
});

test('wrong source, server, item and non-pickup records remain exactly unchanged',()=>{
 const entry=original();for(const patch of [{id:'next-rotation'},{region:'jp'},{gameId:'another-game'},{sourceUrl:'https://nikke-kr.com/other'},{kind:'notice'}]){const changed={...entry,...patch};assert.strictEqual(localize(changed),changed);}
});

test('per-language owner changes, explicit clears and newly collected values override known copy corrections',()=>{
 const entry=original();entry.editor={revision:8,fields:['title.ja','summary.en','pickupMembers.0.name.zh']};
 const next=localize(entry);assert.equal(next.title.ja,'');assert.equal(next.summary.en,entry.summary.en);assert.equal(next.pickupMembers[0].name.zh,'');assert.equal(next.title.zh,'瑪麗安：女王');
 const later=original();later.summary.en='Later verified description';later.title.ja='';later.timingNote.en='';later.pickupMembers[0].name.en='Later official name';
 assert.equal(localize(later).summary.en,later.summary.en);assert.equal(localize(later).timingNote.en,'');assert.strictEqual(localize(later).pickupMembers,later.pickupMembers);
 const owner=original();owner.editor={revision:9,fields:['title','summary','timingNote','pickupMembers']};assert.strictEqual(localize(owner),owner);
});

test('localized pickup slides/cards use the exact official neutral original while full/card originals and owner frames survive',()=>{
 const entry=original(),copy=localize(entry),now=Date.parse('2026-10-30T03:39:11Z');
 const saved={banner:{fit:'contain',x:64,y:41,zoom:1.1}};copy.imageFraming=saved;
 const slides=spotlightSlides([copy],now),cards=pickupCards([copy]);assert.equal(slides.length,1);assert.equal(cards.length,1);
 for(const l of locales){const current=artworkForLocale(slides[0].art,l);assert.equal(current.image,art.asset.image);assert.equal(current.width,1748);assert.equal(current.height,1080);assert.equal(artworkForLocale(cards[0].display,l).image,art.asset.image);assert.equal(artworkForLocale(copy,l,'full').image,entry.image);}
 const projected=artworkForLocale(copy,'en');assert.strictEqual(projected.imageFraming,saved);
 assert.ok(projected.relatedSources.some(s=>s.url===art.asset.imageSource&&s.kind==='official'));
 assert.ok(projected.relatedSources.some(s=>s.url===art.previous[0].image&&s.kind==='community'));
 const clear={image:'',imageVerified:false,imageLocale:'en',width:1,height:1,verifiedAt:'2026-10-30T00:00:00Z'};copy.localizedArtwork={en:clear};assert.equal(artworkForLocale(copy,'en').image,undefined);
});
