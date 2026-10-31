import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const rows=JSON.parse(fs.readFileSync(new URL('../content/reviewed-trickcal-pickups.json',import.meta.url)));
const {entrySchema,safeExtras,safeArtwork}=await import('../lib/content-schema.ts');
const {seedEntries}=await import('../lib/seed.ts');
const {entryState}=await import('../lib/types.ts');
test('Butter pickup keeps Korean service and maintenance-only start precision',()=>{
 const e=rows[0];assert.equal(e.region,'kr');assert.equal(e.startAt,null);assert.equal(e.startDate,'2026-10-29');assert.equal(e.endAt,'2026-11-05T10:59:00+09:00');
 assert.equal(entryState(e,Date.parse('2026-10-31T05:00:00Z')),'active');assert.equal(entryState(e,Date.parse('2026-11-05T02:00:00Z')),'ended');
 assert.match(e.sourceBodies.ko.text,/10\/29\(목\) 정기점검 이후 ~ 11\/05\(목\) 10:59/);assert.match(e.sourceBodies.ko.text,/\[버터\]/);
 assert.equal(e.sourceBodies.ko.sourceUrl,e.sourceUrl);assert.deepEqual(e.officialLocales,['ko']);assert.equal(e.poolType,'character');
});
test('localized pickup, exact native portrait and existing seed IDs remain valid',()=>{
 for(const e of rows){assert.equal(entrySchema.safeParse(e).success,true);assert.equal(safeExtras(e),true);assert.equal(safeArtwork(e),true);for(const l of ['ko','en','ja','zh'])assert.ok(e.title[l]&&e.summary[l]);assert.match(e.image,/heroicons\/butter\/Butter\.png$/);assert.equal(e.imageLocale,'neutral');assert.equal(e.pickupMembers[0].name.ko,'버터');}
 assert.equal(new Set(seedEntries.map(e=>e.id)).size,seedEntries.length);assert.equal(seedEntries.filter(e=>e.id===rows[0].id).length,1);
});
