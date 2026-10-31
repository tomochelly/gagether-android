import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const {equipmentCatalog,validateEquipmentCatalog}=await import('../lib/wuwa-equipment.ts');
const receipt=JSON.parse(fs.readFileSync(new URL('../ops/research/wuwa-equipment/receipt.json',import.meta.url)));
const clone=()=>structuredClone(equipmentCatalog);
test('complete reviewed3.7 native Echo inventory includes all six new Echoes and three new sets with four-language labels',()=>{
 assert.equal(equipmentCatalog.echoes.length,187);assert.equal(equipmentCatalog.sets.length,37);assert.equal(equipmentCatalog.weapons.length,124);
 assert.equal(equipmentCatalog.sourceVersion,'3.7');assert.equal(receipt.sourceCommit,equipmentCatalog.sourceCommit);
 const names=new Set(equipmentCatalog.echoes.map(row=>row.name.en));for(const name of receipt.officialVersionEvidence.echoes)assert.ok(names.has(name),name);
 const sets=new Set(equipmentCatalog.sets.map(row=>row.name.en));for(const name of receipt.officialVersionEvidence.sets)assert.ok(sets.has(name),name);
 assert.deepEqual(receipt.coverage.missingImages,[]);assert.deepEqual(receipt.coverage.missingNativeNames,[]);assert.deepEqual(receipt.coverage.unknownSets,[]);
});
test('every selectable original/phantom/weapon/set URL has an actual decoded byte/hash/dimension receipt',()=>{
 const images=new Map(receipt.images.map(row=>[row.url,row]));
 for(const row of [...equipmentCatalog.echoes,...equipmentCatalog.sets,...equipmentCatalog.weapons])for(const key of ['icon','phantomIcon'])if(row[key]){
  const image=images.get(row[key]);assert.ok(image,row[key]);assert.ok(image.width>=16&&image.height>=16);assert.equal(image.format,'WEBP');
  const original=fs.readFileSync(new URL('../'+image.originalPath,import.meta.url));assert.equal(original.length,image.bytes);assert.equal(createHash('sha256').update(original).digest('hex'),image.sha256);assert.equal(original.subarray(0,4).toString(),'RIFF');
 }
 assert.equal(images.size,receipt.coverage.imageUrls);
});
test('catalog rejects missing names, missing or unpinned originals, duplicate native IDs and wrong set identity',()=>{
 for(const change of [d=>d.echoes[0].name.ko='',d=>d.echoes[0].icon='',d=>d.sourceCommit='0'.repeat(40),d=>d.echoes[0].icon=d.echoes[0].icon.replace(d.sourceCommit,'main'),d=>d.echoes.push(d.echoes[0]),d=>d.echoes[0].setIds.push('99999'),d=>d.echoes[0].cost=2]){const value=clone();change(value);assert.throws(()=>validateEquipmentCatalog(value));}
});
test('source-based semantic stat options retain all13 native substats and per-cost main-stat endpoints',()=>{
 assert.equal(Object.keys(equipmentCatalog.subStats).length,13);assert.deepEqual(equipmentCatalog.mainStats['4cost'].critRate,[4.4,22]);assert.equal(equipmentCatalog.mainStats['1cost'].critRate,undefined);assert.ok(equipmentCatalog.mainStats['3cost'].electro);assert.equal(equipmentCatalog.statLabels.critRate.ko,'크리티컬');
 const value=clone();value.mainStats['3cost'].electro=[NaN,30];assert.throws(()=>validateEquipmentCatalog(value));
});
