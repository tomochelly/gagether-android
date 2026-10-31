import './load-typescript.mjs';
import{test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
const{rosterGalleryFocus}=await import('../lib/roster-gallery-focus.ts'),{splashPortraitFrame}=await import('../lib/gallery-framing.ts');
test('HSR and hololive reviewed art frames preserve source identity and complete heads at native pixels',()=>{
 for(const game of ['hsr','holodreams']){
  const registry=JSON.parse(fs.readFileSync(`content/${game}-gallery-focus.json`));assert.ok(registry.entries.length>0);
  for(const r of registry.entries){assert.match(r.sha256,/^[a-f0-9]{64}$/);assert.ok(r.width>0&&r.height>0);if(!r.head)continue;const head=rosterGalleryFocus(game,r.url);assert.ok(head,r.id);
   for(const box of [{width:190,height:310},{width:350,height:420},{width:580,height:400}])for(const dpr of [1,2,3]){const f=splashPortraitFrame({width:r.width,height:r.height},box,head,60,dpr);assert.ok(f,r.id);assert.ok(f.scale<=1/dpr+1e-8,r.id);const top=f.top+r.height*head.top/100*f.scale,bottom=f.top+r.height*head.bottom/100*f.scale;assert.ok(top>=12-1e-6&&bottom<=box.height-90+1e-6,r.id);const left=f.left+r.width*head.left/100*f.scale,right=f.left+r.width*head.right/100*f.scale;for(const y of [top,bottom]){assert.ok(left>=60*(1-y/box.height)-1e-6,r.id+' left cut');assert.ok(right<=box.width-60*y/box.height+1e-6,r.id+' right cut');assert.ok(left>=60*y/box.height-1e-6,r.id+' reverse left cut');assert.ok(right<=box.width-60*(1-y/box.height)+1e-6,r.id+' reverse right cut');}}
  }
  assert.equal(rosterGalleryFocus(game,'https://example.test/replacement.png'),undefined);
 }
 assert.equal(rosterGalleryFocus('wuwa','https://example.test/replacement.png'),undefined);
});
test('reviewed delivery aliases retain owner frames, with an exact new edit taking precedence',async()=>{const{reviewedRosterArtFrame}=await import('../lib/roster-gallery-focus.ts');const r=JSON.parse(fs.readFileSync('content/holodreams-gallery-focus.json')).entries[0],old={x:5,y:20,zoom:1.2,fit:'contain'},fresh={x:20,y:15,zoom:1.4,fit:'cover'},frames=[{url:r.aliases[0],gallery:old}];assert.deepEqual(reviewedRosterArtFrame('holodreams',frames,r.url,'gallery'),old);assert.deepEqual(reviewedRosterArtFrame('holodreams',[...frames,{url:r.url,gallery:fresh}],r.url,'gallery'),fresh);assert.equal(reviewedRosterArtFrame('hsr',frames,r.url,'gallery'),undefined);});
test('stored legacy artwork gets reviewed full originals and framing without mutating snapshots or custom art',async()=>{
 const {rosterArts,rosterArt}=await import('../lib/character-roster.ts'),{upgradeReviewedRosterArt}=await import('../lib/roster-art-replacements.ts');
 for(const game of ['hsr','holodreams'])for(const r of JSON.parse(fs.readFileSync(`content/${game}-gallery-focus.json`)).entries){
  const image={url:r.aliases[0],sourceUrl:'https://example.test/source',kind:game==='hsr'?'splash':'portrait',locale:'neutral',...(game==='holodreams'?{width:1558,height:952}:{})},row={id:r.id,name:{ko:r.id,en:r.id,ja:r.id,zh:r.id},image},before=JSON.stringify(row);
  const art=rosterArt(row,'ko','global');assert.equal(art.url,r.url,r.id);assert.equal(art.width,r.width);assert.equal(art.height,r.height);assert.deepEqual(rosterGalleryFocus(game,r.aliases[0]),rosterGalleryFocus(game,r.url));
  assert.equal(rosterArts(row,'en').length,1);assert.equal(JSON.stringify(row),before);
  if(game==='holodreams')assert.equal(art.preview.url,r.aliases[0]);
 }
 const custom={url:'https://example.test/owner-replacement.png',sourceUrl:'https://example.test/source',kind:'full-body'};assert.equal(upgradeReviewedRosterArt(custom),custom);
});
