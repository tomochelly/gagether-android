import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const {currentNotices}=await import('../lib/current-notices.ts'),{favoriteNoticeGroups}=await import('../lib/favorite-updates.ts'),{games}=await import('../lib/games.ts');
const [old,next]=JSON.parse(fs.readFileSync(new URL('./fixtures/reviewed-notice-replacements.json',import.meta.url)));
test('withdrawn notice leaves current selections only when its exact replacement is available',()=>{
 const previous={...old,sourceBodies:{ko:{text:'original',links:[{url:'https://youtu.be/WY8AnFUteSs'}]}}},current={...next,sourceBodies:{ko:{text:'original',links:[{url:'https://youtu.be/qQyg9IlgQ8c'}]}}},rows=[previous,current],snapshot=JSON.stringify(rows);
 assert.deepEqual(currentNotices(rows),[current]);assert.equal(JSON.stringify(rows),snapshot);assert.equal(rows.length,2);assert.equal(previous.sourceBodies.ko.links[0].url,'https://youtu.be/WY8AnFUteSs');
 assert.deepEqual(favoriteNoticeGroups(rows,games,['wuwa'],'global',{},'ko')[0].notices.map(e=>e.id),[current.id]);
});
test('missing/hidden replacement, wrong identity, newer copy and owner changes preserve withdrawn history',()=>{
 const rows=[old];assert.strictEqual(currentNotices(rows),rows);
 for(const patch of [{hidden:true},{sourceUrl:'https://example.test/'},{id:next.id+'x'},{region:'kr'},{kind:'event'},{summary:{...next.summary,ko:'Changed official content'}},{editor:{revision:4,fields:['image']}}]){const input=[old,{...next,...patch}];assert.strictEqual(currentNotices(input),input);}
 const owned=[{...old,editor:{revision:2,fields:['summary.ko']}},next];assert.strictEqual(currentNotices(owned),owned);
 const similar=[{...old,id:'unrelated-same-title'},next];assert.strictEqual(currentNotices(similar),similar);
});
