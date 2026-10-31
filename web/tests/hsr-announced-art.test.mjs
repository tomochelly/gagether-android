import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const {reviewedRosterAdditions}=await import('../lib/reviewed-roster-names.ts');
const {rosterCharacterSchema}=await import('../lib/character-roster.ts');
test('Aha announced preview has exact official names and supplied original, never a guessed client ID or beta panel',()=>{
 const [c]=reviewedRosterAdditions('hsr',[]);rosterCharacterSchema.parse(c);assert.equal(c.name.ko,'에이언즈★아하');assert.equal(c.availability.status,'announced');assert.match(c.sourceUrl,/entry\/10393/);assert.equal(c.image.kind,'full-body');assert.equal(c.image.sourceKind,'community');assert.match(c.image.caption.en,/User-provided/);for(const k of ['stats','skillTables','sourceId','rarity'])assert.equal(c[k],undefined);
 const raw=readFileSync(new URL('../public/assets/announced/hsr-aha-user-original.webp',import.meta.url));assert.equal(raw.length,95500);assert.equal(createHash('sha256').update(raw).digest('hex'),'08c9ecf1aea3c1ffe43e5a76d07ba336364656557c1e47fa478fd2c1495d37ef');
 assert.deepEqual(reviewedRosterAdditions('hsr',[{id:'native-release',name:c.name}]),[]);assert.deepEqual(reviewedRosterAdditions('zzz',[]),[]);
});
