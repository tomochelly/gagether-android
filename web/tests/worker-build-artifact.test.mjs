import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';

// A current client manifest cannot prove the API worker was rebuilt.
test('packaging rejects a stale API graph even when the worker file has a fresh timestamp',()=>{
 const root=mkdtempSync(join(tmpdir(),'gagether-stale-worker-test-'));
 try{for(const dir of ['.sites-runtime','dist/server','app/api/leaks'])mkdirSync(join(root,dir),{recursive:true});writeFileSync(join(root,'.sites-runtime/build-start.json'),JSON.stringify({root,startedAt:Date.now()-2000}));writeFileSync(join(root,'app/api/leaks/route.ts'),'export const GET=()=>Response.json({items:[]})');writeFileSync(join(root,'dist/server/index.js'),'const oldRoutes=[{pattern:`/api/data`}];');const result=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/verify-worker-build.mjs',import.meta.url))],{cwd:root,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/missing current API routes: \/api\/leaks/);
 }finally{rmSync(root,{recursive:true,force:true})}
});
