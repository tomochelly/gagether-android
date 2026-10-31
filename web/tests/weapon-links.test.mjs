import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
const {signatureWeapons,weaponUi}=await import('../lib/weapon-links.ts');
const {retainEntityDetails,groupPickups}=await import('../lib/presentation.ts');
const {entrySchema,safeExtras}=await import('../lib/content-schema.ts');
const {default:SignatureWeapons}=await import('../components/signature-weapons.tsx');
const {PickupSection}=await import('../components/radar.tsx');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const es=JSON.parse(readFileSync(new URL('./fixtures/weapon-links.json',import.meta.url)));
const now=Date.parse('2026-10-17T12:40:00Z');
const find=id=>es.find(e=>e.id===id);
const character=find('wuwa-hsin'),weapon=find('wuwa-blooming-jadehaven');
const games=catalogGames({}),byId=Object.fromEntries(games.map(g=>[g.id,g]));
const ctx=(locale='ko',simpleMode=false)=>({games,byId,t:catalogUi({},locale),editMode:false,openEditor:()=>{},simpleMode});
const section=(entry,locale='ko')=>renderToStaticMarkup(createElement(CatalogContext.Provider,{value:ctx(locale)},createElement(PickupSection,{group:groupPickups([entry])[0],weaponEntries:es,locale,now,saved:[],onSave:()=>{},onOpen:()=>{}})));
test('owner-edited character title retains exact weapon connection',()=>{
 const links=signatureWeapons({...character,title:{ko:'Owner edit',en:'Owner',ja:'編集',zh:'编辑'}},es);
 assert.equal(links.length,1);assert.equal(links[0].entry.id,weapon.id);
});
test('combined weapon pools select correct featured artwork independent of order',()=>{
 const e=find('genshin-71-weapon'),reordered={...e,pickupMembers:[...e.pickupMembers].reverse()};
 const links=signatureWeapons(find('genshin-71-escoffier'),[reordered]);
 assert.equal(links[0].name.en,'Symphonist of Scents');
 assert.equal(links[0].art.image,e.pickupMembers.find(m=>m.name.en==='Symphonist of Scents').image);
 assert.equal(signatureWeapons(find('genshin-71-escoffier'),[{...e,pickupMembers:e.pickupMembers.filter(m=>m.name.en!=='Symphonist of Scents')}]).length,0);
});
test('cross-region/game, hidden, archived and secondary weapon entries never attach',()=>{
 for(const patch of [{region:'cn'},{gameId:'genshin'},{hidden:true},{pickupArchive:{status:'past'}},{pickupMembers:weapon.pickupMembers.map(m=>({...m,role:'rate-up'}))}]){
  const links=signatureWeapons(character,[{...weapon,...patch}]);
  assert.equal(links.length,0);
 }
 assert.equal(signatureWeapons({...character,id:'unreviewed'},es).length,0);
 assert.equal(signatureWeapons({...character,poolType:'support'},es).length,0);
 assert.equal(signatureWeapons({...character,signatureWeapons:[]},es).length,0);
});
test('new sourced links validate and survive automatic collector omission',()=>{
 const refs=[{entryId:weapon.id,sourceUrl:weapon.sourceUrl,sourceKind:'official',verifiedAt:'2026-10-17T12:00:00Z'}];
 const e={...character,id:'new-rotation',signatureWeapons:refs};
 assert.equal(entrySchema.safeParse(e).success,true);assert.equal(safeExtras(e),true);
 assert.equal(signatureWeapons(e,es).length,1);
 assert.deepEqual(retainEntityDetails(character,e).signatureWeapons,refs);
 assert.deepEqual(retainEntityDetails({...character,signatureWeapons:[]},e).signatureWeapons,[]);
 assert.equal(safeExtras({...e,signatureWeapons:[{...refs[0],sourceUrl:'http://example.org'}]}),false);
});
test('standalone weapon sections are absent while linked weapons and character/support remain visible',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const html=section(weapon,locale);
  assert.equal(html,'');
  const card=section(character,locale);assert.ok(card.includes('signature-weapon'));assert.ok(card.includes('entry-image-button'));
  const tags=card.match(/<\/?button\b[^>]*>/g)||[];let depth=0;for(const tag of tags){if(tag.startsWith('</'))depth--;else{depth++;assert.equal(depth,1);}}assert.equal(depth,0);
 }
 const support=es.find(e=>!e.pickupArchive&&e.poolType==='support');assert.ok(section(support).includes('entry-image-button'));
});
test('compact weapon link has localized name and no image mounted',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const html=renderToStaticMarkup(createElement(SignatureWeapons,{links:signatureWeapons(character,es),locale,compact:true,onOpen:()=>{}}));
  assert.ok(!html.includes('<img'));assert.ok(html.includes(weaponUi[locale].open));
 }
});
