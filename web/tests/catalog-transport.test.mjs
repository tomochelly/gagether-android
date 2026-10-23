import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {packCatalog,unpackCatalog} from '../lib/catalog-transport.ts';
import {catalogEntry} from '../lib/catalog-index.ts';
// Resolve seed dependencies after the TypeScript hooks have been registered.
const {seedEntries}=await import('../lib/seed.ts');
test('compact catalog preserves complete public data, null dates, locale artwork and owner revisions',()=>{
 const entries=seedEntries.map(e=>catalogEntry(e));
 const data={entries,sourceChecks:[],settings:{brand:{name:'<GAGETHER>'}},settingsRevision:7,persistent:true,serverTime:'2026-10-21T13:00:00Z'};
 const normalized=JSON.parse(JSON.stringify(data));
 const packed=JSON.parse(JSON.stringify(packCatalog(normalized)));
 assert.deepEqual(unpackCatalog(packed),normalized);
 assert.ok(JSON.stringify(packed).length<JSON.stringify(normalized).length*0.7);
 const special=JSON.parse('{"empty":{},"list":[null,0,-2,3.5,false,"",[],{}],"__proto__":{"safe":true},"optional":null}');
 assert.deepEqual(unpackCatalog(packCatalog(special)),special);
 assert.equal({}.safe,undefined);
});
