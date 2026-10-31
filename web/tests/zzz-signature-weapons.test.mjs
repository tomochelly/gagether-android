import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {withZzzSignatureWeapon}=await import('../lib/zzz-signature-weapons.ts');
const {rosterCharacterSchema}=await import('../lib/character-roster.ts');
const {signatureWeapons}=await import('../lib/weapon-links.ts');
const manifest=JSON.parse(readFileSync(new URL('../content/zzz-signature-weapons.json',import.meta.url))),raw=JSON.parse(readFileSync(new URL('../ops/research/whole-site-20261029/catalog-audit/raw/zzz-avatars.data',import.meta.url)));
const catalog=JSON.parse(readFileSync(new URL('../content/zzz-combat-catalog.json',import.meta.url)));
const loc=s=>({ko:s,en:s,ja:s,zh:s});
test('all61 released native Agent-to-W-Engine joins stay exact and surface sourced names and icons',()=>{
 assert.equal(Object.keys(manifest.characters).length,61);
 for(const [id,w]of Object.entries(manifest.characters)){assert.equal(w,String(raw[id].WeaponId));const weapon=catalog.weapons.find(x=>x.id===w);const c=withZzzSignatureWeapon({id,name:loc(id),sourceUrl:manifest.sourceUrl,sourceKind:'community'});assert.equal(rosterCharacterSchema.safeParse(c).success,true);assert.deepEqual(c.sections[0].body,weapon.name);assert.equal(c.sections[0].icon,weapon.icon);assert.equal(withZzzSignatureWeapon(c),c);}
 assert.equal(withZzzSignatureWeapon({id:'1631',availability:{status:'announced'}}).sections,undefined);
});
test('announced current and future rotation weapons attach with exact member selectors, past and forecasts do not',()=>{
 const id='hist-zzz-global-20261021-character-ad1c2854ac2c',wid='hist-zzz-global-20261021-weapon-c89e05eab109';
 const c={id,gameId:'zzz',region:'global',kind:'pickup'},w={id:wid,gameId:'zzz',region:'global',kind:'weapon',pickupArchive:{status:'announced'},title:loc('pool'),pickupMembers:[{name:loc('Joyau Dore')},{name:loc('Plume of Rebirth')}]};
 assert.deepEqual(signatureWeapons(c,[w]).map(x=>x.name.en),['Plume of Rebirth','Joyau Dore']);for(const status of ['past','forecast'])assert.equal(signatureWeapons(c,[{...w,pickupArchive:{status}}]).length,0);
});

test('reviewed missing names and exact Japanese posters fill gaps without replacing later native art',async()=>{
 const {reviewedRosterName}=await import('../lib/reviewed-roster-names.ts');const c={id:'230',name:{ko:'',en:'Marian',ja:'',zh:''}};assert.equal(reviewedRosterName('nikke',c).name.ko,'마리안 : 퀸');const ba={id:'10153',name:loc('Hifumi')};const poster=reviewedRosterName('bluearchive',ba);assert.ok(poster.image.url.endsWith('DuU7HLlZ.png'));assert.equal(poster.image.locale,'ja');assert.equal(reviewedRosterName('bluearchive',{...ba,image:{url:'https://native.test/new.png'}}).image.url,'https://native.test/new.png');assert.equal(reviewedRosterName('bluearchive',{...ba,id:'unknown'}).image,undefined);
});
