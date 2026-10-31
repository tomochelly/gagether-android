import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url))),fresh=read('../content/official-pickup-updates.json'),rows=read('./fixtures/reviewed-official-pickups.json'),rules=read('../content/reviewed-official-pickups.json');
const {reviewedOfficialPickup}=await import('../lib/reviewed-official-pickups.ts'),{entrySchema,safeExtras,safeArtwork}=await import('../lib/content-schema.ts'),{seedEntries}=await import('../lib/seed.ts'),{entryState}=await import('../lib/types.ts');
test('six official global entries retain exact native periods, source bodies and event roles',()=>{
 assert.equal(new Set(seedEntries.map(e=>e.id)).size,seedEntries.length);
 for(const e of fresh){assert.equal(entrySchema.safeParse(e).success,true,e.id);assert.equal(safeExtras(e),true,e.id);assert.equal(safeArtwork(e),true,e.id);assert.equal(e.region,'global');assert.ok(e.sourceBodies.en.text);assert.equal(e.sourceBodies.en.sourceUrl,e.sourceUrl);for(const locale of ['ko','en','ja','zh'])assert.ok(e.title[locale]&&e.summary[locale]);if(e.recurring){assert.equal(e.recurring.modeId,'champions-meeting');assert.equal(e.recurring.resetAt,e.endAt);assert.equal(e.recurring.repeat,undefined);}else assert.equal(e.recurring,undefined);}
 const p=fresh.find(e=>e.poolType==='support');assert.equal(p.kind,'weapon');assert.equal(p.startAt,'2026-10-27T22:00:00Z');assert.equal(p.endAt,'2026-11-06T21:59:00Z');assert.equal(p.pickupMembers.length,2);assert.ok(p.pickupMembers.every(m=>m.rarity===3&&m.role==='featured'));assert.equal(p.pickupMembers[0].name.en,'[Q≠0] Agnes Tachyon');assert.equal(p.imageKind,'banner');assert.ok(!p.image.includes('/trainee/'));
 const now=Date.parse('2026-10-30T06:00:00Z'),cup=fresh.find(e=>e.id.endsWith('champions-meeting-capricorn'));assert.equal(entryState(cup,now),'upcoming');assert.equal(cup.startAt,'2026-10-31T22:00:00Z');
 const rally=fresh.find(e=>e.id.endsWith('nikkei-keisei'));assert.equal(rally.publishedAt,'2026-10-29');assert.equal(entryState(rally,now),'active');
 const tickets=fresh.find(e=>e.id.endsWith('daily-race'));assert.match(tickets.summary.en,/Each carat refill still grants three tickets/);assert.doesNotMatch(tickets.summary.en,/limited to three/);
});
test('Korean already-announced pools gain clocks without altering their identity, original art or source bodies',()=>{
 for(const row of rows){const old=JSON.stringify(row),next=reviewedOfficialPickup(row);assert.equal(next.startAt,'2026-10-30T12:00:00+09:00');assert.equal(next.endAt,'2026-11-10T11:59:00+09:00');assert.equal(next.pickupArchive.status,'announced');assert.strictEqual(next.localizedArtwork,row.localizedArtwork);assert.strictEqual(next.pickupMembers,row.pickupMembers);assert.strictEqual(next.sourceBodies,row.sourceBodies);assert.equal(next.sourceUrl,row.sourceUrl);assert.equal(JSON.stringify(row),old);assert.ok(next.relatedSources.some(s=>s.url==='https://pf.kakao.com/_DzxjIb/115032872'));assert.doesNotMatch(next.pickupArchive.note.ko,/미공개|확인했습니다/);}
});
test('different collected values and parent or descendant owner edits take precedence over timing supplements',()=>{
 for(const row of rows){const wrong={...row,region:'global'};assert.strictEqual(reviewedOfficialPickup(wrong),wrong);let freshClock={...row,startAt:'2026-10-30T13:00:00+09:00'};assert.equal(reviewedOfficialPickup(freshClock).startAt,freshClock.startAt);
 const owned={...row,editor:{revision:9,fields:['startAt','endAt','pickupArchive.note.en','relatedSources']}};assert.strictEqual(reviewedOfficialPickup(owned),owned);
 const fields=rules.changes.find(r=>r.id===row.id).fields;assert.equal(fields.startAt.before,null);assert.equal(row.pickupArchive.status,'announced');}
});
