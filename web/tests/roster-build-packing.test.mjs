import './load-typescript.mjs';
import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const{lazyRosterCode,lazyRosterSnapshot,rosterSnapshotModule}=await import('../build/roster-snapshot.ts');
test('build-only packing preserves every canonical fact, property order and hash while indexing game IDs decodes no game',async()=>{
 const source=readFileSync('content/character-rosters/bootstrap.json','utf8'),before=createHash('sha256').update(source).digest('hex'),raw=JSON.parse(source),code=lazyRosterCode(raw);
 assert.ok(Buffer.byteLength(code)<Buffer.byteLength(source));const {default:rows}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const map=new Map(rows.map(row=>[row.gameId,row]));assert.deepEqual([...map.keys()],raw.map(r=>r.gameId));
 for(const row of rows)assert.equal(typeof Object.getOwnPropertyDescriptor(row,'characters').get,'function');
 const selected=map.get('arknights');assert.deepEqual(structuredClone(selected),raw.find(r=>r.gameId==='arknights'));assert.deepEqual(Object.keys(selected),Object.keys(raw.find(r=>r.gameId==='arknights')));
 assert.equal(JSON.stringify(rows),JSON.stringify(raw));assert.deepEqual(rows,raw);assert.equal(createHash('sha256').update(readFileSync('content/character-rosters/bootstrap.json')).digest('hex'),before);
});
test('only the exact canonical bootstrap resolves to the lazy build module',async()=>{
 const p=lazyRosterSnapshot(),ctx={resolve:async s=>({id:s}),addWatchFile:()=>{}};const exact=new URL('../content/character-rosters/bootstrap.json',import.meta.url).pathname;
 assert.equal(await p.resolveId.call(ctx,exact),rosterSnapshotModule);assert.equal(await p.resolveId.call(ctx,exact.replace('/character-rosters/','/other-rosters/')),undefined);assert.equal(p.load.call(ctx,'other-module'),undefined);
});
