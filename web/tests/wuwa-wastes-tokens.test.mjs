import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const {wastesTokens,wastesToken,selectableWastesTokens,validateWastesTokenCatalog}=await import('../lib/wuwa-wastes-tokens.ts');
const receipt=JSON.parse(fs.readFileSync(new URL('../ops/research/wuwa-wastes-tokens/receipt.json',import.meta.url)));
test('full sitemap-declared token inventory retains113 native identities and109 effect-complete selectable rows',()=>{
 assert.equal(wastesTokens.tokens.length,113);assert.equal(selectableWastesTokens.length,109);assert.deepEqual(wastesTokens.coverage.missingEffectIds,['71500009','71500012','71500013','71500015']);
 for(const t of wastesTokens.tokens)for(const locale of ['ko','en','ja','zh'])assert.ok(t.name[locale].length);
 assert.ok(selectableWastesTokens.every(t=>Object.values(t.description).every(Boolean)));
});
test('supplied lantern exact71500103 effect preserves shield,3%,2.5%,3seconds,15stacks and2uses',()=>{
 const t=wastesToken('71500103');assert.equal(t.name.ko,'허상을 비추는 등불');assert.equal(t.name.en,'Lamp That Illuminates the Illusion');assert.equal(t.rarity,5);assert.equal(t.maxUses,2);assert.equal(t.useLimit,'limited');
 for(const text of ['실드','3%','2.5%','3초','15스택'])assert.ok(t.description.ko.includes(text),text);
 assert.ok(t.description.ko.includes('\n\n'));assert.equal(t.description.ko.includes('\\n'),false);assert.equal(t.description.ko.includes('<color'),false);
});
test('four-language originals are recoverable and match actual public source bytes by native ID',()=>{
 assert.equal(receipt.tokenCount,113);
 for(const t of wastesTokens.tokens)for(const locale of ['ko','en','ja','zh']){
  const source=receipt.itemSources[t.id][locale];assert.ok(source.url.includes('/item/'+t.id+'/'));
  const bytes=gunzipSync(fs.readFileSync(new URL('../'+source.originalPath,import.meta.url)));assert.equal(bytes.length,source.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
 }
});
test('unknown equip limits/current23 availability and unverified image bytes are never promoted into facts',()=>{
 assert.equal(wastesTokens.limits.maxEquippedPerRun,null);assert.equal(wastesTokens.limits.maxEquippedPerTeam,null);assert.equal(wastesTokens.coverage.currentCycleAvailability,'unknown');assert.ok(wastesTokens.tokens.every(t=>t.imageStatus==='declared-unverified'));assert.equal(wastesTokens.cycles[0].scope,'reward-entries-only');assert.equal(wastesTokens.cycles.some(c=>c.id==='whimpering-wastes:23'),false);
 for(const change of [d=>d.tokens[0].id='unknown',d=>d.tokens[0].name.ko='',d=>d.tokens[0].maxUses=2,d=>d.limits.maxEquippedPerTeam=3,d=>d.tokens.push(d.tokens[0]),d=>d.tokens[0].imageStatus='verified']){const d=structuredClone(wastesTokens);change(d);assert.throws(()=>validateWastesTokenCatalog(d));}
});
