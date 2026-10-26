import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('real CommonJS plugin skips the complete URL-heavy roster within a bounded process and still executes legacy JS correctly',()=>{
  const script=String.raw`
    import './tests/load-typescript.mjs';
    import assert from 'node:assert/strict';
    import {readFileSync} from 'node:fs';
    import {createRequire} from 'node:module';
    import {pathToFileURL} from 'node:url';
    const {guardCommonjsJson}=await import('./build/commonjs-json-guard.ts');
    const req=createRequire(import.meta.resolve('vinext'));
    const imported=await import(pathToFileURL(req.resolve('vite-plugin-commonjs')).href);
    const commonjs=typeof imported.default==='function'?imported.default:imported.default.default;
    const plugin=guardCommonjsJson(commonjs());
    const {resolveConfig}=await import('vite');
    await resolveConfig({configFile:false,plugins:[plugin]},'build');
    const actual=readFileSync('content/character-rosters/bootstrap.json','utf8');
    // The public mirror intentionally retains an older, smaller data snapshot.
    // Exercise the same pathological URL density there without copying live data.
    const source=actual.length>10_000_000?actual:JSON.stringify({actual,stress:Array.from({length:100000},(_,i)=>({url:'https://assets.example.invalid/official/character/illustration/'+i+'/source-original-with-preserved-quality-and-native-dimensions.png'}))});
    assert.ok(source.length>10_000_000);
    const handler=typeof plugin.transform==='function'?plugin.transform:plugin.transform.handler;
    for(const id of ['/snapshot.json','/snapshot.json?import','/snapshot.json?v=1','\0gagether:roster-bootstrap-packed.js'])assert.equal(await handler.call({},source,id),null);
    const legacy=await handler.call({},'module.exports = {answer:42};','/legacy-module.js');
    assert.ok(legacy?.code);
    const executed=await import('data:text/javascript,'+encodeURIComponent(legacy.code));
    assert.deepEqual(executed.default,{answer:42});
    console.log('complete JSON excluded; real legacy CommonJS preserved');
  `;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:new URL('../',import.meta.url),encoding:'utf8',timeout:10000,maxBuffer:1024*1024});
  assert.equal(result.error,undefined,String(result.error));
  assert.equal(result.status,0,result.stderr||result.stdout);
});
