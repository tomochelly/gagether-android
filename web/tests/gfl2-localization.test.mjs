import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import c from '../content/gfl2-combat-catalog.json' with {type:'json'};
import receipt from '../ops/research/gfl2-localization-20261029/verification.json' with {type:'json'};
const keys=c.characters.flatMap(x=>x.keys),rows=[...keys,...c.weapons,...c.sets];
const percent=s=>[...s.normalize('NFKC').matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map(x=>Number(x[1])).sort((a,b)=>a-b);
test('complete locale display catalog retains source identities, effects and percentages',()=>{
 assert.equal(c.characters.length,61);assert.equal(keys.length,452);assert.equal(c.weapons.length,126);assert.equal(c.sets.length,16);
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
 assert.equal(createHash('sha256').update(readFileSync('content/gfl2-combat-catalog.json','utf8').replaceAll('\r\n','\n')).digest('hex'),receipt.localizedSha256);
 assert.equal(receipt.savedIdentityAndRulesUnchanged,true);
 for(const row of rows){
  for(const l of ['ko','en','ja','zh']){
   assert.ok(row.name[l].trim(),row.id+' name '+l);assert.ok(row.description[l].trim(),row.id+' effect '+l);
   assert.doesNotMatch(row.description[l],/ZXQ|QXZ|\[effect:|effect name unavailable/);
   assert.deepEqual(percent(row.description[l]),percent(row.description.en),row.id+' percentages '+l);
  }
  assert.match(row.sourceUrl,/^https:\/\//);
 }
 for(const d of c.characters){if(d.id!=='OTs-14'){assert.match(d.name.ja,/[\p{Script=Katakana}\p{Script=Hiragana}\p{Script=Han}]/u);assert.match(d.name.zh,/\p{Script=Han}/u);}else{assert.equal(d.name.ja,'OTs-14');assert.equal(d.name.zh,'OTs-14');}}
 assert.equal(c.characters.find(x=>x.id==='Welrod').name.ko,'웰로드');
 assert.match(c.localization.note.ko,/참고/);
 assert.match(c.sets.find(x=>x.id==='Summon Boost').description.ko,/소환물.*20%/);
});
