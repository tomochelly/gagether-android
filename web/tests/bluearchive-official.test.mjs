import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const {blueArchiveOfficialChanges}=await import('../lib/bluearchive-official.ts');
const {entrySchema,safePickupArchive,safeArtwork}=await import('../lib/content-schema.ts');
const {pickupPeriod}=await import('../lib/pickup-history.ts');
const {upcomingPickups}=await import('../lib/upcoming-pickups.ts');
const original=JSON.parse(fs.readFileSync('ops/bluearchive/20261027/before-recruitment.json'));
const at='2026-10-27T06:00:00Z';
test('real Korean notice replaces stale forecast periods on the same IDs, keeps selection and full original facts, and is idempotent',()=>{
 const input=structuredClone(original),rows=blueArchiveOfficialChanges(input,at);assert.equal(rows.length,9);assert.deepEqual(input,original);
 assert.ok(rows.find(c=>c.after.id==='hist-bluearchive-kr-20261110-character-8a70a4827766').after.hidden);
 for(const {after:e}of rows){const valid=entrySchema.safeParse(e);assert.ok(valid.success,JSON.stringify(valid.error?.issues));assert.ok(safePickupArchive(e));assert.ok(safeArtwork(e));}
 const current=rows.find(c=>c.after.id.startsWith('hist-')).after,recollect=rows.find(c=>c.after.selectionCount).after,next=rows.find(c=>c.after.id==='ba-kr-official-20261103-character').after;
 assert.equal(current.endAt,'2026-11-03T10:59:00+09:00');assert.equal(current.startAt,null);assert.equal(current.sourceKind,'official');assert.equal(current.pickupMembers.length,5);assert.equal(pickupPeriod(current,Date.parse(at)),'current');
 assert.deepEqual(current.entityDetails,original.find(e=>e.id===current.id).entityDetails);
 assert.equal(recollect.selectionCount,1);assert.equal(recollect.pickupMembers.length,5);assert.ok(recollect.pickupMembers.every(m=>m.role==='candidate'));
 assert.equal(next.startAt,'2026-11-03T11:00:00+09:00');assert.equal(next.endAt,'2026-11-10T10:59:00+09:00');assert.equal(next.pickupMembers.length,5);
 assert.ok([...current.pickupMembers,...next.pickupMembers].every(m=>m.imageLocale==='ko'&&m.imageVerified&&m.imageKind==='banner'));
 assert.ok([...current.pickupMembers,...next.pickupMembers].every(m=>m.previewFocus===undefined&&m.imagePosition===undefined),'a new exact source must clear old per-image crop coordinates');
 assert.equal(current.previewFocus,undefined);assert.equal(current.imagePosition,undefined);
 const merged=new Map(input.map(e=>[e.id,e]));for(const c of rows)merged.set(c.after.id,c.after);
 assert.deepEqual(blueArchiveOfficialChanges([...merged.values()],'2026-10-27T06:01:00Z'),[]);
 const upcoming=upcomingPickups([...merged.values()],'ko',Date.parse(at),'Asia/Seoul');assert.equal(upcoming.filter(i=>i.entry.id===current.id).length,0);assert.equal(upcoming.filter(i=>i.entry.id===next.id).length,5);assert.equal(upcoming.filter(i=>i.entry.id==='hist-bluearchive-kr-20261110-character-8a70a4827766').length,0);
});
test('foreign services, copied community bodies and unknown outfits never gain Korean official schedules',()=>{
 for(const mutate of [e=>{e.region='global'},e=>{e.sourceKind='community'},e=>{e.sourceUrl='https://example.com/bluearchive/board_view?board=1076'},e=>{e.sourceBodies.ko.sourceUrl+='&changed=1'}]){const doc=structuredClone(original.find(e=>e.id==='quick-bluearchive-kr-3559967'));mutate(doc);assert.deepEqual(blueArchiveOfficialChanges([doc],at),[]);}
 const changed=structuredClone(original);changed.find(e=>e.id==='quick-bluearchive-kr-3559967').sourceBodies.ko.text=changed.find(e=>e.id==='quick-bluearchive-kr-3559967').sourceBodies.ko.text.replaceAll('히카리','다른신규이름');assert.throws(()=>blueArchiveOfficialChanges(changed,at),/Unmatched official/);
});
test('explicit new-student schedules without a rerun tag import without inventing their pickup type',()=>{
 const doc=structuredClone(original.find(e=>e.id==='quick-bluearchive-kr-3559967'));doc.sourceBodies.ko.text=doc.sourceBodies.ko.text.replaceAll('[ 복각]','').replaceAll('[복각]','');const rows=blueArchiveOfficialChanges([doc],at);assert.equal(rows.filter(c=>c.after.kind==='pickup').length,2);assert.ok(rows.filter(c=>c.after.kind==='pickup').every(c=>c.after.pickupType==='unknown'));
});
test('January recruitment announced in December uses the next year and keeps a maintenance start date-only',()=>{
 const doc=structuredClone(original.find(e=>e.id==='quick-bluearchive-kr-3559967'));doc.publishedAt='2026-12-26T01:00:00Z';doc.sourceUrl='https://forum.nexon.com/bluearchive/board_view?board=1076&thread=9999999';doc.sourceBodies.ko={...doc.sourceBodies.ko,sourceUrl:doc.sourceUrl,bodyHash:'f'.repeat(64),text:'한국 시간 기준 - [복각] 히카리(★3) 픽업 모집 일정: 1월 5일(화) 점검 후 ~ 1월 12일(화) 오전 10시 59분'};
 const [{after:e}]=blueArchiveOfficialChanges([doc],'2026-12-27T01:00:00Z');assert.equal(e.startDate,'2027-01-05');assert.equal(e.startAt,null);assert.equal(e.endAt,'2027-01-12T10:59:00+09:00');
});
