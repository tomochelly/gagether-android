import './load-typescript.mjs';import{test}from'node:test';import assert from'node:assert/strict';
import additions from'../content/limbus-reviewed-releases.json'with{type:'json'};import analyses from'../content/reviewed-broadcast-analysis.json'with{type:'json'};
import ownerArtRepairs from '../content/reviewed-owner-artwork-repairs.json' with {type:'json'};
const {repairSupersededOwnerArtwork}=await import('../lib/reviewed-owner-artwork.ts'),{artworkForLocale}=await import('../lib/artwork.ts');
test('the requested shared Akane art replaces only the exact superseded owner edit and preserves later owner work',()=>{
 const r=ownerArtRepairs[0],entry={id:r.id,gameId:r.gameId,region:r.region,image:r.previousImage,imageLocale:r.previousLocale,editor:{revision:r.revision,updatedAt:r.updatedAt,fields:['image','localizedArtwork']},summary:{ko:'keep'},pickupMembers:[{...r.asset,name:{ko:'아카네 린'}}],localizedArtwork:{ja:{image:r.previousImage,imageLocale:'ja'}}},before=structuredClone(entry),next=repairSupersededOwnerArtwork(entry);
 for(const l of ['ko','en','ja','zh'])assert.equal(artworkForLocale(next,l,'full').image,r.asset.image);
 assert.deepEqual(entry,before);assert.deepEqual(next.summary,entry.summary);assert.deepEqual(next.pickupMembers,entry.pickupMembers);
 for(const changed of [{...entry,id:'other'},{...entry,image:'https://example.test/later.png'},{...entry,editor:{...entry.editor,revision:r.revision+1}},{...entry,pickupMembers:[]}])assert.equal(repairSupersededOwnerArtwork(changed),changed);
});
const{reviewedRosterAdditions,reviewedRosterName}=await import('../lib/reviewed-roster-names.ts'),{rosterCharacterSchema}=await import('../lib/character-roster.ts'),{broadcastSpecial}=await import('../lib/broadcast-special.ts'),{games}=await import('../lib/games.ts'),{safeImage}=await import('../lib/content-schema.ts'),{safeSource}=await import('../lib/types.ts');
test('new Limbus native releases expose both complete originals without guessed combat panels or duplicate future provider identities',()=>{
 assert.equal(additions.length,2);for(const c of additions){rosterCharacterSchema.parse(c);assert.equal(c.availability.status,'released');assert.equal(c.image.width,1920);assert.equal(c.image.height,1080);assert.equal(c.image.locale,'neutral');assert.equal(c.stats,undefined);assert.equal(c.skillTables,undefined);assert.ok(c.images[0].url!==c.image.url);assert.equal(reviewedRosterAdditions('limbus',[{...c,id:'provider-'+c.sourceId}]).some(x=>x.sourceId===c.sourceId),false);}
 const c={id:'135',name:{ko:'헤도네',en:'Hedone',ja:'',zh:'赫多涅'},regions:['cn'],image:{url:'https://example.test/original-1380.png',width:1380,height:2048},images:[]},r=reviewedRosterName('reverse1999',c);assert.deepEqual(r.image,c.image);assert.deepEqual(r.regions,['cn']);assert.ok(r.images.some(x=>x.url.endsWith('hedone_insight.webp')));assert.deepEqual(c.images,[]);
});
test('maintained review definitions no longer restore Korean copy into foreign editorial fields',()=>{
 for(const a of analyses){for(const l of['en','ja','zh'])for(const v of[a.review.title?.[l],a.review.summary?.[l],...a.review.segments.flatMap(s=>[s.title?.[l],s.body?.[l]]),...a.review.feature?.highlights?.map(h=>h[l])||[]])assert.ok(!/[가-힣]/.test(v||''),a.gameId+'/'+l+' '+v);}
});
test('only exact reviewed translated recaps can cross UI languages, native recap wins, and broadcast frame namespace stays bounded',()=>{
 const game=games.find(g=>g.id==='nte'),now=Date.parse('2026-10-30T00:00:00Z'),copy={ko:'정리',en:'Recap',ja:'まとめ',zh:'汇总'},make=(id,locale)=>({id,gameId:'nte',region:'global',kind:'update',title:copy,summary:copy,sourceUrl:'https://www.youtube.com/watch?v='+id.split('-').at(-1),sourceLocale:locale,translatedLocales:['zh','en'],broadcastRecap:{reviewedAt:'2026-10-29T08:00:00Z',bannerUntil:'2026-11-11T00:00:00Z'}}),known=make('recap-nte-en-UxT6b7h5Mcc','en'),unknown=make('recap-nte-ko-AAAAAAAAAAA','ko');
 assert.equal(broadcastSpecial([unknown],game,'global','zh',now),undefined);assert.equal(broadcastSpecial([known],game,'global','zh',now).id,known.id);const ko=make('recap-nte-ko-SXTEyXX__I8','ko');assert.equal(broadcastSpecial([known,ko],game,'global','en',now).id,known.id);
 assert.equal(safeImage('/api/broadcast-frames/'+'a'.repeat(64)),true);assert.equal(safeImage('/api/broadcast-frames/'+'a'.repeat(64)+'?secret=x'),false);assert.equal(safeImage('/api/broadcast-frames/../media/test'),false);assert.equal(safeSource('https://pbs.twimg.com/media/UNREVIEWED.jpg?name=orig','nte'),false);
});
