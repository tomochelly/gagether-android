import './load-typescript.mjs';
import {fileURLToPath,pathToFileURL} from 'node:url';
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
 const p=lazyRosterSnapshot(),ctx={resolve:async s=>({id:s}),addWatchFile:()=>{}};const exact=fileURLToPath(new URL('../content/character-rosters/bootstrap.json',import.meta.url)).replace(/\\/g,'/');
 assert.equal(await p.resolveId.call(ctx,exact),rosterSnapshotModule);assert.equal(await p.resolveId.call(ctx,exact.replaceAll('/','\\')),rosterSnapshotModule);assert.equal(await p.resolveId.call(ctx,exact.replace('/character-rosters/','/other-rosters/')),undefined);assert.equal(p.load.call(ctx,'other-module'),undefined);
});
test('compressed rosters open in real Workers with exact facts and a bounded two-game cache',async()=>{
 const {createRequire}=await import('node:module'),require=createRequire(import.meta.url),{Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[require.resolve('wrangler/package.json')]})).href);
 const code=lazyRosterCode([{gameId:'genshin',characters:[{id:'traveler',name:'여행자'}]},{gameId:'limbus',characters:[{id:'identity',name:'단독 인격'}]},{gameId:'reverse1999',characters:[{id:'native',name:'원문'}]}]).replace('export default','const rows=');
 const mf=new Miniflare({modules:true,compatibilityDate:'2025-04-01',compatibilityFlags:['nodejs_compat'],script:code+'\nexport default {fetch(){const ids=rows.map(r=>r.gameId),first=rows[0].characters,sameReference=rows[0].characters===first;rows[1].characters;rows[2].characters;return Response.json({ids,selected:rows[0].characters,sameReference,evicted:first!==rows[0].characters});}}'});
 try{const response=await mf.dispatchFetch('http://localhost/');assert.equal(response.status,200);assert.deepEqual(await response.json(),{ids:['genshin','limbus','reverse1999'],selected:[{id:'traveler',name:'여행자'}],sameReference:true,evicted:true});}finally{await mf.dispose();}
});
test('every full canonical game snapshot, including small Holo Dreams and DNA, inflates with byte-identical facts in Workers',async()=>{
 const {createRequire}=await import('node:module'),require=createRequire(import.meta.url),{Miniflare}=await import(pathToFileURL(require.resolve('miniflare',{paths:[require.resolve('wrangler/package.json')]})).href);
 const raw=JSON.parse(readFileSync('content/character-rosters/bootstrap.json','utf8'));
 const code=lazyRosterCode(raw).replace('export default','const rows=');
 const mf=new Miniflare({modules:true,compatibilityDate:'2025-04-01',compatibilityFlags:['nodejs_compat'],script:code+`\nexport default {async fetch(){const result=[];for(const row of rows){const text=JSON.stringify(row),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));result.push({game:row.gameId,count:row.characters.length,sha:Buffer.from(hash).toString('hex')});}return Response.json(result);}}`});
 try{const response=await mf.dispatchFetch('http://localhost/');assert.equal(response.status,200);assert.deepEqual(await response.json(),raw.map(row=>({game:row.gameId,count:row.characters.length,sha:createHash('sha256').update(JSON.stringify(row)).digest('hex')})));}
 finally{await mf.dispose();}
});
