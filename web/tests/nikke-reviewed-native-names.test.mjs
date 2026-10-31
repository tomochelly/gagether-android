import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {reviewedRosterName}=await import('../lib/reviewed-roster-names.ts');
const make=()=>({id:'230',name:{ko:'마리안 : 퀸',en:'Marian: Queen',ja:'',zh:''},image:{url:'https://cdn.prydwen.gg/images/nikke/characters/marian-queen_card.webp',sourceUrl:'https://www.prydwen.gg/nikke/characters/',kind:'card',locale:'neutral'},images:[],nameSources:{},detailSources:[],traits:[],stats:[],skills:[]});
test('official Queen native names fill only empty locale names without changing codex artwork or collected input',()=>{
 const c=make(),before=structuredClone(c),next=reviewedRosterName('nikke',c);
 assert.equal(next.name.ja,'マリアン：クイーン');assert.equal(next.name.zh,'瑪麗安：女王');assert.equal(next.name.en,c.name.en);
 assert.strictEqual(next.image,c.image);assert.strictEqual(next.images,c.images);assert.deepEqual(c,before);assert.strictEqual(reviewedRosterName('nikke',next),next);
 assert.equal(next.nameSources.ja.kind,'official');assert.ok(next.nameSources.ja.url.endsWith('/GLanguage.js'));
 const missing=make();missing.name.ko='';const complete=reviewedRosterName('nikke',missing);assert.equal(complete.name.ko,'마리안 : 퀸');assert.equal(complete.name.ja,'マリアン：クイーン');
});
test('other variants, owner/native locale names and explicitly sourced clears remain authoritative',()=>{
 for(const patch of [{id:'1'},{name:{...make().name,en:'Marian'}},{name:{...make().name,en:'Marian: Queen Costume'}}]){const c={...make(),...patch};assert.strictEqual(reviewedRosterName('nikke',c),c);}
 const c=make();assert.strictEqual(reviewedRosterName('another-game',c),c);
 c.name.ja='Later official name';c.nameSources.zh={url:'https://gagether.wiki',kind:'community'};assert.strictEqual(reviewedRosterName('nikke',c),c);
});
test('Goddeath and Sanctuary missing native names use their exact official patch and retain later locale sources',()=>{
 for(const [id,en,ja,zh]of [['229','Scarlet: Goddeath','紅蓮：神殺','紅蓮：弒神'],['231','Rapunzel: Sanctuary','ラプンツェル：サンクチュアリ','長髮公主：聖域']]){
  const c={...make(),id,name:{ko:'',en,ja:'',zh:''}},next=reviewedRosterName('nikke',c);assert.equal(next.name.ja,ja);assert.equal(next.name.zh,zh);assert.strictEqual(next.image,c.image);assert.ok(next.nameSources.zh.url.endsWith('/News_detail-237'));assert.ok(next.nameSources.ja.url.includes('8cae0ab1'));
  const cleared={...next,name:{...next.name,ko:'',ja:'',zh:''}};assert.strictEqual(reviewedRosterName('nikke',cleared),cleared);
 }
});
