import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('a long non-footer whitespace run cannot exhaust RSS parser memory or pin the maintenance cursor',()=>{
 const code=`import assert from 'node:assert/strict';import {parseLeakFeed,leakSources} from './lib/leaks.ts';
 const original='<hr><p>Wuthering Waves leak fixture</p>--'+' '.repeat(200000)+'still source text<img src="https://imgur.disp.cc/one.jpg">';
 const xml='<feed><entry><id>https://disp.cc/b/ACG/test123</id><title>鳴潮 leak fixture</title><content>'+original.replaceAll('<','&lt;').replaceAll('>','&gt;')+'</content><published>2026-10-25T00:00:00Z</published></entry></feed>';
 const rows=parseLeakFeed(xml,leakSources[2],'2026-10-25T22:00:00Z');assert.equal(rows.length,1);assert.ok(rows[0].body.includes('still source text'));assert.ok(rows[0].body.includes(' '.repeat(200000)));assert.deepEqual(rows[0].images,['https://imgur.disp.cc/one.jpg']);
 const footer=xml.replace('still source text','※ 發信站');assert.ok(!parseLeakFeed(footer,leakSources[2],'2026-10-25T22:00:00Z')[0].body.includes('發信站'));
 `;
 const result=spawnSync(process.execPath,['--max-old-space-size=96','--import','./tests/load-typescript.mjs','--input-type=module','-e',code],{cwd:process.cwd(),encoding:'utf8',timeout:10000,maxBuffer:200000});
 assert.equal(result.error,undefined,String(result.error));assert.equal(result.status,0,result.stderr.slice(-4000));
});
