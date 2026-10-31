import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {reviewedRosterAdditions,reviewedRosterName}=await import('../lib/reviewed-roster-names.ts');
const {rosterCharacterSchema}=await import('../lib/character-roster.ts');
const {safeReference}=await import('../lib/types.ts');
const additions=reviewedRosterAdditions('nte',[]),elyms=additions[0];
test('official Elyms preview has retained original dimensions, no client identity or invented combat panel, and yields to native release',()=>{
 assert.equal(additions.length,1);assert.equal(rosterCharacterSchema.parse(elyms).availability.status,'announced');assert.equal(elyms.name.en,'Elyms');assert.equal(elyms.name.zh,'');assert.equal(elyms.image.width,1920);assert.equal(elyms.images[0].width,2160);for(const k of ['sourceId','stats','skillTables','rarity'])assert.equal(elyms[k],undefined);
 assert.equal(reviewedRosterAdditions('nte',[elyms]).length,0);assert.equal(reviewedRosterAdditions('nte',[{id:'native-elyms',name:{ko:'',en:'Elyms',ja:'',zh:''}}]).length,0);assert.equal(reviewedRosterAdditions('zzz',[]).length,0);
});
test('Chaos keeps its exact high-resolution full body and private source changes, with official labelled website art supplementary',()=>{
 const raw=JSON.parse(readFileSync(new URL('../content/character-rosters/bootstrap.json',import.meta.url),'utf8')).find(r=>r.gameId==='nte').characters.find(c=>c.id==='18'),before=JSON.stringify(raw),next=reviewedRosterName('nte',raw);
 assert.equal(next.image.url,raw.image.url);assert.equal(next.image.kind,'full-body');assert.equal(next.image.sourceKind,raw.image.sourceKind);assert.equal(next.images.at(-1).locale,'en');assert.equal(next.images.at(-1).width,2560);assert.equal(JSON.stringify(raw),before);assert.deepEqual(reviewedRosterName('nte',next),next);
 const owner={...raw,image:{...raw.image,url:'https://example.com/new-owner-original.png'}};assert.equal(reviewedRosterName('nte',owner),owner);
});
test('reviewed broadcast frame keeps exact source and original bytes instead of a generated clean-art claim',()=>{
 assert.ok(safeReference(elyms.image.sourceUrl,'nte','community'));assert.equal(elyms.image.sourceUrl,'https://www.4gamer.net/games/817/G081722/20261028047/screenshot.html?num=004');assert.equal(elyms.image.sourceKind,'community');assert.match(elyms.image.caption.ko,/방송 장면/);
 const receipts=JSON.parse(readFileSync(new URL('../ops/research/nte-art-20261029/receipts.json',import.meta.url),'utf8'));for(const a of receipts.items){if(!a.path.startsWith('ops/research/nte-art-20261029/'))continue;const bytes=readFileSync(new URL('../'+a.path,import.meta.url));assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);}
});
