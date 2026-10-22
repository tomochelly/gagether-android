import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {pickupArtwork,pickupHasArtwork}=await import('../lib/pickup-artwork.ts');
const loc=s=>({ko:s,en:s,ja:s,zh:s});
const member=(name,role='featured')=>({name:loc(name),role,type:'rerun',image:'/assets/'+name+'.png',imageVerified:true,imageLocale:'neutral'});
const base={id:'rotation',gameId:'arknights',region:'kr',kind:'pickup',title:loc('Two'),pickupArchive:{status:'past'},pickupMembers:[member('first'),member('second'),member('lower','rate-up')]};
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
