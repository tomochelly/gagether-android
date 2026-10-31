import './load-typescript.mjs';import {test} from 'node:test';import assert from 'node:assert/strict';
const {artworkForLocale}=await import('../lib/artwork.ts');
test('shared-game reviewed original fallback keeps the real source language; unreviewed and independent-service art remains filtered',()=>{
 const art={image:'https://example.com/program.jpg',imageSource:'https://example.com/program',imageVerified:true,imageKind:'banner',imageLocale:'ja',originalLanguageFallback:true,imageCaption:{ko:'공식 일본어 방송 장면',en:'Japanese official program frame',ja:'日本語公式番組の場面',zh:'日语官方节目画面'}};
 assert.equal(artworkForLocale(art,'ko').image,art.image);assert.equal(artworkForLocale(art,'ko').imageLocale,'ja');assert.equal(artworkForLocale({...art,originalLanguageFallback:false},'ko').image,undefined);assert.equal(artworkForLocale({...art,imageVerified:false},'ko').image,undefined);assert.equal(artworkForLocale({...art,imageCaption:{ko:'only'}},'ko').image,undefined);assert.equal(artworkForLocale(art,'ko','preview','ko').image,undefined);assert.equal(artworkForLocale({...art,localizedArtwork:{ko:{image:'',imageLocale:'ko',imageVerified:false}}},'ko').image,undefined);
});
