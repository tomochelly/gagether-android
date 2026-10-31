import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {pickupArtwork,pickupHasArtwork}=await import('../lib/pickup-artwork.ts');
const loc=s=>({ko:s,en:s,ja:s,zh:s});
const member=(name,role='featured')=>({name:loc(name),role,type:'rerun',image:'/assets/'+name+'.png',imageVerified:true,imageLocale:'neutral'});
const base={id:'rotation',gameId:'arknights',region:'kr',kind:'pickup',title:loc('Two'),pickupArchive:{status:'past'},pickupMembers:[member('first'),member('second'),member('lower','rate-up')]};

test('Blue Archive full-body art survives all four languages without changing the canonical rotation or borrowing an outfit',async()=>{
 const {bluearchivePickupArtwork}=await import('../lib/bluearchive-pickup-artwork.ts');
 const {maintainedArtwork}=await import('../lib/maintained-artwork.ts');
 const {artworkForLocale}=await import('../lib/artwork.ts');
 const {pickupCards}=await import('../lib/pickup-cards.ts');
 const {pickupDetailEntry}=await import('../lib/pickup-detail.ts');
 const chosen=maintainedArtwork.filter(d=>d.gameId==='bluearchive'&&d.asset.imageLocale==='neutral'&&d.names.some(n=>n.en==='Hikari'||n.en==='Nozomi'));
 assert.equal(chosen.length,2);
 const e={...base,gameId:'bluearchive',pickupMembers:chosen.map(d=>({name:d.names[0],type:'new',role:'featured',image:'/ko-poster.png',imageKind:'banner',imageVerified:true,imageLocale:'ko',localizedArtwork:{ko:{image:'/ko-poster.png',imageKind:'banner',imageVerified:true,imageLocale:'ko'},ja:{image:'/ja-poster.png',imageKind:'banner',imageVerified:true,imageLocale:'ja'}}}))};
 const before=structuredClone(e),view=bluearchivePickupArtwork(e);
 for(const locale of ['ko','en','ja','zh'])for(let i=0;i<2;i++){
  const rendered=artworkForLocale(view.pickupMembers[i],locale);
  assert.equal(rendered.image,chosen[i].asset.image);assert.equal(rendered.imageLocale,'neutral');
  assert.equal(rendered.imageFraming.banner.fit,'contain');
  assert.equal(pickupDetailEntry(e,chosen[i].names[0]).image,chosen[i].asset.image);
  assert.equal(pickupArtwork(e,locale)[i].art.image,chosen[i].asset.image);
 }
 assert.deepEqual(e,before);assert.ok(pickupCards([e]).every(c=>c.entry===e));
 const other={...e,pickupMembers:[{...e.pickupMembers[0],name:{ko:'히카리(다른 의상)',en:'Hikari (Other outfit)',ja:'ヒカリ（別衣装）',zh:'光（其他服装）'}}]};
 assert.equal(bluearchivePickupArtwork(other).pickupMembers[0].image,'/ko-poster.png');
 assert.strictEqual(bluearchivePickupArtwork({...e,region:'cn'}).pickupMembers[0].image,'/ko-poster.png');
});
test('past and current archive entries retain each verified featured portrait without counting lower rarity',()=>{
 for(const status of ['past','announced','forecast'])for(const locale of ['ko','en','ja','zh']){
  const e={...base,pickupArchive:{status}};assert.equal(pickupHasArtwork(e,locale),true);assert.deepEqual(pickupArtwork(e,locale).map(x=>x.name.en),['first','second']);
 }
});
test('independent JP/CN portraits use the actual service language, and missing art stays absent',()=>{
 const jp={...base,region:'jp',pickupMembers:[{...member('JP'),imageLocale:'ja',localizedArtwork:{ko:{...member('KR'),name:undefined}}}]};
 assert.equal(pickupArtwork(jp,'ko')[0].art.image,'/assets/JP.png');
 const cn={...base,region:'cn',pickupMembers:[{...member('wrong'),imageLocale:'ko'}]};assert.equal(pickupHasArtwork(cn,'ko'),false);
 assert.equal(pickupHasArtwork({...base,pickupMembers:[{name:loc('Unverified'),image:'/assets/unknown.png'}]},'ko'),false);
});
test('one featured owner replacement remains authoritative and candidate lists are not featured portraits',()=>{
 const e={...base,image:'/api/media/owner.png',imageVerified:true,imageLocale:'neutral',editor:{fields:['image']},pickupMembers:[member('first'),member('lower','rate-up')]};
 assert.deepEqual(pickupArtwork(e,'ko').map(x=>x.art.image),['/api/media/owner.png']);
 assert.equal(pickupArtwork({...base,pickupMembers:[member('candidate','candidate')]},'ko').length,0);
});

test('sparse refresh preserves reviewed root/member languages and never grafts a previous character or file crop',async()=>{
 const {retainEntityDetails}=await import('../lib/presentation.ts');
 const previous={...base,...member('pool'),localizedArtwork:{ja:{image:'/ja-pool.png',imageVerified:true,imageLocale:'ja'}},pickupMembers:[{...member('first'),localizedArtwork:{ja:{image:'/ja-first.png',imageVerified:true,imageLocale:'ja'}}},member('second')]};
 const next=retainEntityDetails({...base,pickupMembers:[{name:loc('first'),type:'rerun',role:'featured'},{name:loc('third'),type:'new',role:'featured'}]},previous);
 assert.equal(next.image,previous.image);assert.equal(next.localizedArtwork.ja.image,'/ja-pool.png');assert.equal(next.pickupMembers[0].localizedArtwork.ja.image,'/ja-first.png');assert.equal(next.pickupMembers[1].image,undefined);
 const replaced=retainEntityDetails({...base,image:'/new-unclassified.png',imageVerified:false}, {...previous,previewBounds:{left:20,top:10,right:80,bottom:90}});
 assert.equal(replaced.image,'/new-unclassified.png');assert.equal(replaced.imageLocale,undefined);assert.equal(replaced.previewBounds,undefined);
 const corrected=retainEntityDetails({...previous,imageVerified:false},previous);assert.equal(corrected.imageVerified,false,'explicit audit corrections survive');
});
