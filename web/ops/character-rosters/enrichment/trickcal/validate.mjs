import '../../../../tests/load-typescript.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const {characterRosterSchema}=await import('../../../../lib/character-roster.ts');
const audit=JSON.parse(fs.readFileSync(process.argv[3]||'ops/character-rosters/enrichment/trickcal/source-audit.json','utf8'));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(stable(v))).digest('hex');
const enriched=characterRosterSchema.parse(JSON.parse(fs.readFileSync(process.argv[2]||'/tmp/gagether-trickcal-result.json','utf8')));
assert.deepEqual(enriched.characters.map(c=>c.id),Object.keys(audit.inputPreservation));
let kr=0,global=0,icons=0,coefficients=0;
for(const b of enriched.characters){
 const receipt=audit.inputPreservation[b.id];assert.equal(hash(['regions','name','stats','regionalStats','rarity','rarityLabel'].map(k=>b[k]??null)),receipt.factsSha256,`${b.id} changed protected source facts`);assert.ok(b.image.width>=252);
 const tables=b.regionalSkillTables;assert.equal(tables.kr.length,3);kr+=tables.kr.length;
 for(const t of tables.kr){assert.deepEqual(t.regions,['kr']);assert.equal(t.nameLocale,'ko');assert.equal(t.description.en,'');assert.ok(t.description.ko);assert.ok(t.icon);icons++;}
 for(const t of tables.global||[]){assert.deepEqual(t.regions,['global']);assert.equal(t.nameLocale,'en');assert.equal(t.description.ko,'');assert.ok(t.description.en||t.values.length);global++;if(t.icon)icons++;if(t.maxLevel){assert.equal(t.maxLevel,15);for(const v of t.values){assert.equal(v.levels.length,15);coefficients+=v.levels.length;}}}
 for(const [key,bodyHash]of Object.entries(receipt.koreanSkillBodies)){const t=tables.kr.find(t=>t.id==='trickcal-kr-'+key);assert.equal(hash(t.description.ko),bodyHash,`${b.id} source skill facts changed`);}
}
const renewa=enriched.characters.find(c=>c.id==='renewa');assert.equal(renewa.image.kind,'card');assert.equal(renewa.image.sourceKind,'official');assert.equal(renewa.image.locale,'ko');assert.ok(renewa.images.some(i=>i.kind==='portrait'&&i.locale==='neutral'));
const coffe=enriched.characters.find(c=>c.id==='coffe');assert.equal(coffe.stats,undefined);assert.equal(coffe.image.sourceKind,'official');assert.equal(coffe.image.height,675);
console.log(JSON.stringify({stableIds:enriched.characters.length,krSkills:kr,globalSkills:global,skillIcons:icons,exactLevelCoefficientCells:coefficients,allOriginalStatsRegionsAndNamesPreserved:true}));
