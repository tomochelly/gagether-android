import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const {reviewedRecurringEntry}=await import('../lib/recurring-review.ts'),{officialRecurringWindow}=await import('../lib/recurring-official-rules.ts'),{recurringReset,recurringItems}=await import('../lib/recurring-events.ts'),{recurringDisplayEntry}=await import('../lib/recurring-schedule.ts'),{entrySchema,safeExtras,safeArtwork}=await import('../lib/content-schema.ts'),{safeReference}=await import('../lib/types.ts'),{seedEntries}=await import('../lib/seed.ts');
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url))),review=read('../content/recurring-review.json'),fresh=read('../content/recurring-reviewed-entries.json');
const C=s=>({ko:s,en:s,ja:s,zh:s}),base=(id,gameId,region,modeId)=>({id,gameId,region,kind:'event',server:'',title:C('Mode'),summary:C('Guide'),startAt:null,endAt:null,publishedAt:null,verifiedAt:'2026-10-29T00:00:00Z',sourceUrl:'https://faq.limbuscompany.site/',sourceTitle:'Official',recurring:{modeId,cycleLabel:C('Phase'),sourceKind:'official',sourceUrls:['https://faq.limbuscompany.site/'],verifiedAt:'2026-10-29T00:00:00Z'}});
test('all new reviewed phases validate with registered exact sources; no duplicate canonical identities',()=>{
 assert.equal(new Set(seedEntries.map(e=>e.id)).size,seedEntries.length);
 for(const e of fresh){assert.equal(entrySchema.safeParse(e).success,true,e.id);assert.equal(safeExtras(e),true,e.id);assert.equal(safeArtwork(e),true,e.id);assert.equal(safeReference(e.sourceUrl,e.gameId,e.sourceKind||'official'),true,e.id);for(const s of e.detailSections||[])for(const u of s.sourceUrls||[])assert.equal(safeReference(u,e.gameId,s.sourceKind||'official'),true,e.id+' '+u);for(const l of ['ko','en','ja','zh'])assert.ok(e.title[l]&&e.summary[l],e.id+' '+l);}
});
test('review deltas are exact, immutable, owner-safe and do not overwrite a newer collection',()=>{
 for(const r of review.changes){const e={id:r.id,gameId:r.gameId,region:r.region,sourceUrl:r.sourceUrl,verifiedAt:'2026-10-01T00:00:00Z',...Object.fromEntries(Object.entries(r.fields).map(([f,d])=>[f,d.before]))},before=JSON.stringify(e);const changed=reviewedRecurringEntry(e);for(const[f,d]of Object.entries(r.fields))assert.deepEqual(changed[f],d.after,r.id+' '+f);assert.equal(JSON.stringify(e),before);assert.equal(reviewedRecurringEntry({...e,sourceUrl:'https://example.invalid/'}).detailRevision,undefined);
 const owned={...e,editor:{revision:99,updatedAt:'2026-10-30T00:00:00Z',fields:Object.keys(r.fields)}};assert.equal(reviewedRecurringEntry(owned),owned);
 const concurrent={...e,...Object.fromEntries(Object.keys(r.fields).map(f=>[f,'a newer value']))};assert.equal(reviewedRecurringEntry(concurrent),concurrent);}
});
test('official monthly dates respect variable months and leap years without clocks',()=>{
 const e=base('genshin-recurring-spiral-abyss','genshin','global','spiral-abyss');
 for(const[at,start,end,reset]of [['2026-10-30T00:00:00+09:00','2026-10-16','2026-11-15','2026-11-16'],['2028-02-16T00:00:00+09:00','2028-02-16','2028-03-15','2028-03-16'],['2028-03-15T23:59:59+09:00','2028-02-16','2028-03-15','2028-03-16']]){const w=officialRecurringWindow(e,Date.parse(at));assert.equal(w.startDate,start);assert.equal(w.endDate,end);assert.equal(w.resetDate,reset);assert.equal(w.endAt,null);assert.equal(recurringReset(e,Date.parse(at)).date,reset);}
 const t=base('genshin-global-recurring-imaginarium-theater','genshin','global','imaginarium-theater'),w=officialRecurringWindow(t,Date.parse('2028-02-29T12:00:00+09:00'));assert.equal(w.endDate,'2028-02-29');assert.equal(w.resetDate,'2028-03-01');
 assert.equal(officialRecurringWindow({...e,region:'cn'},Date.now()),undefined);assert.equal(officialRecurringWindow({...e,editor:{fields:['endAt']}},Date.now()),undefined);assert.equal(officialRecurringWindow({...e,recurring:{...e.recurring,repeat:{enabled:false}}},Date.now()),undefined);
});
test('Reverse source uses fixed UTC-5 through DST changes; CN remains date-only',()=>{
 const e=base('reverse1999-global-recurring-limbo','reverse1999','global','limbo');
 assert.equal(recurringReset(e,Date.parse('2026-10-30T00:00:00Z')).at,'2026-11-16T10:00:00.000Z');assert.equal(recurringReset(e,Date.parse('2027-03-14T12:00:00Z')).at,'2027-03-16T10:00:00.000Z');
 const cn=base('reverse1999-cn-recurring-limbo','reverse1999','cn','limbo');assert.deepEqual(recurringReset(cn,Date.parse('2026-10-30T00:00:00Z')),{date:'2026-11-16'});
});
test('Limbus Thursday KST reset crosses the precise boundary without changing stored clocks',()=>{
 const e=base('limbus-global-recurring-mirror-dungeon','limbus','global','mirror-dungeon'),old=JSON.stringify(e),boundary=Date.parse('2026-11-05T06:00:00+09:00');assert.equal(recurringReset(e,boundary-1).at,'2026-11-04T21:00:00.000Z');assert.equal(recurringReset(e,boundary).at,'2026-11-11T21:00:00.000Z');assert.equal(recurringDisplayEntry(e,boundary).startAt,'2026-11-04T21:00:00.000Z');assert.equal(JSON.stringify(e),old);
});
test('current named phases replace generic rules and confirmed clocks survive date-only next opening',()=>{
 const t=base('genshin-global-recurring-imaginarium-theater','genshin','global','imaginarium-theater'),oct=fresh.find(e=>e.id==='genshin-global-imaginarium-theater-20261001');assert.equal(recurringItems([t,oct],'ko',Date.parse('2026-10-30T00:00:00+09:00'))[0].id,oct.id);
 const current={...base('hsr-old','hsr','global','memory-of-chaos'),recurring:{...base('x','hsr','global','memory-of-chaos').recurring,resetAt:'2026-11-02T05:00:00+09:00'}},next=fresh.find(e=>e.id==='hsr-global-memory-of-chaos-20261102');assert.equal(recurringItems([current,next],'ko',Date.parse('2026-11-02T04:59:59+09:00'))[0].id,current.id);assert.equal(recurringItems([current,next],'ko',Date.parse('2026-11-02T05:00:00+09:00'))[0].id,next.id);
});
test('calendar and native feed suppress duplicate rule fallbacks but keep real upcoming phases',async()=>{
 const {recurringScheduleEntries}=await import('../lib/recurring-events.ts'),{mobileFeed}=await import('../lib/mobile.ts');const t=base('genshin-global-recurring-imaginarium-theater','genshin','global','imaginarium-theater'),oct=fresh.find(e=>e.id==='genshin-global-imaginarium-theater-20261001'),now=Date.parse('2026-10-30T00:00:00+09:00');
 const selected=recurringScheduleEntries([t,oct],'ko',now);assert.deepEqual(selected.map(e=>e.id),[oct.id]);assert.equal(mobileFeed([t,oct],{},'ko',undefined,now).widgetEntries.length,1);
 const limbus=base('limbus-global-recurring-mirror-dungeon','limbus','global','mirror-dungeon'),feed=mobileFeed([limbus],{},'ko',undefined,now);assert.equal(feed.entries.length,1);assert.equal(feed.entries[0].endAt,'2026-11-04T21:00:00.000Z');
});

test('Trickcal global finite official phases appear without copying Korean resets or reviving ended Frontier',()=>{
 const now=Date.parse('2026-10-30T03:00:00Z');
 const rules=review.changes.filter(r=>r.id.startsWith('trickcal-global-event-'));
 assert.equal(rules.length,3);
 const entries=rules.map(r=>{const rec=r.fields.recurring.after;assert.equal(rec.repeat,undefined);assert.ok(rec.sourceUrls.every(u=>u.startsWith('https://trickcal.biligames.com/news/')));assert.equal(safeExtras({...base(r.id,r.gameId,r.region,rec.modeId),sourceUrl:r.sourceUrl,recurring:rec}),true);return reviewedRecurringEntry({...base(r.id,r.gameId,r.region,rec.modeId),recurring:undefined,sourceUrl:r.sourceUrl,title:r.fields.title?.before||C(r.id),endAt:rec.resetAt});});
 for(const locale of ['ko','en','ja','zh'])assert.deepEqual(recurringItems(entries,locale,now).map(e=>e.id).sort(),['trickcal-global-event-brawl-pit-20261008','trickcal-global-event-dimension-clash-20261029']);
 assert.equal(entries.find(e=>e.id.includes('brawl-pit')).title.ja,'勝者の喧嘩場');
 for(const e of entries){assert.equal(recurringReset(e,Date.parse('2026-11-06T00:00:00Z')),null);assert.equal(e.recurring.resetAt,rules.find(r=>r.id===e.id).fields.recurring.after.resetAt);}
 const wrong={...entries[0],region:'kr',recurring:undefined};assert.strictEqual(reviewedRecurringEntry(wrong),wrong);
});

test('Japan native BA phases expose one current and one announced window, then expire without invented repeats',async()=>{
 const {eventState}=await import('../lib/event-presentation.ts');
 const current=fresh.find(e=>e.id==='bluearchive-jp-set-20261029'),next=fresh.find(e=>e.id==='bluearchive-jp-total-assault-nightmare-train-20261104'),now=Date.parse('2026-10-30T04:28:14Z');
 assert.equal(current.region,'jp');assert.equal(next.region,'jp');assert.equal(current.startAt,'2026-10-29T11:00:00+09:00');assert.equal(current.endAt,'2026-11-25T03:59:00+09:00');assert.equal(next.startAt,'2026-11-04T11:00:00+09:00');assert.equal(next.endAt,'2026-11-11T03:59:00+09:00');
 assert.equal(eventState(current,now),'active');assert.equal(eventState(next,now),'upcoming');
 for(const locale of ['ko','en','ja','zh'])assert.deepEqual(recurringItems([current,next],locale,now).map(e=>e.id),[current.id,next.id]);
 for(const e of [current,next]){assert.equal(e.sourceUrl,'https://bluearchive.jp/news/newsJump/705');assert.equal(e.recurring.repeat,undefined);assert.equal(e.rewards,undefined);assert.equal(e.image,undefined);assert.equal(e.officialLocales[0],'ja');assert.equal(e.recurring.sourceUrls.includes('https://bluearchive.jp/news/newsJump/697'),true);}
 assert.deepEqual(recurringItems([current,next],'ja',Date.parse(next.endAt)).map(e=>e.id),[current.id]);
 assert.deepEqual(recurringItems([current,next],'ja',Date.parse(current.endAt)),[]);assert.deepEqual(recurringItems([current,next],'ja',Date.parse('2027-01-01T00:00:00Z')),[]);
});
