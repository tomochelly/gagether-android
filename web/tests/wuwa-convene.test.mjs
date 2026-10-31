import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import weapons from '../content/wuwa-convene-weapons.json' with {type:'json'};
import reference from '../content/wuwa-reference.json' with {type:'json'};
import {readFileSync} from 'node:fs';
const {drawConvene,emptyConveneState,parseConveneState,validateConveneState,conveneRewards,conveneFiveStarRate}=await import('../lib/wuwa-convene.ts');
const {createWuwaConveneCatalog}=await import('../lib/wuwa-convene-catalog.ts');
import {catalog} from './fixtures/wuwa-convene-fixture.mjs';
const now=Date.parse('2026-10-27T00:00:00Z');
const values=(...numbers)=>{let i=0;return()=>numbers[i++]??.9;};
test('base probability boundaries distinguish 3,4,5 without mutation or server access',()=>{
 for(const [roll,rarity]of [[0,5],[.007999,5],[.008,4],[.067999,4],[.068,3],[.999999,3]]){
  const state=emptyConveneState(),before=JSON.stringify(state),drawn=drawConvene(state,catalog,'banner-a',1,now,values(roll,.1,.2));
  assert.equal(drawn.results[0].rarity,rarity);assert.equal(drawn.state.total,1);assert.equal(JSON.stringify(state),before);assert.ok(validateConveneState(drawn.state));
 }
});
test('legacy80th maximum guarantees preserve a loss then shared-banner featured guarantee',()=>{const old={...emptyConveneState(),total:79,pity5:79},a=drawConvene(old,catalog,'banner-a',1,now,()=>.9);assert.equal(a.results[0].number,80);assert.equal(a.results[0].id,'character:standard');const b=drawConvene({...a.state,total:159,pity5:79},catalog,'banner-b',1,now,()=>.9);assert.equal(b.results[0].number,160);assert.equal(b.results[0].id,'character:b');assert.equal(b.state.guaranteed5,false);assert.equal(b.state.pity5,0);});
test('real sequential batches use rising rates before80 and retain featured carryover',()=>{let state=emptyConveneState(),all=[];for(let i=0;i<16;i++){const d=drawConvene(state,catalog,i<8?'banner-a':'banner-b',10,now,()=>.9);state=d.state;all.push(...d.results);}assert.deepEqual(all.filter(r=>r.rarity===5).map(r=>r.number),[78,156]);assert.equal(state.pity5,4);assert.equal(all.find(r=>r.number===156).id,'character:b');for(let i=0;i<160;i+=10)assert.ok(all.slice(i,i+10).some(r=>r.rarity>=4));});
test('user table uses consecutive misses with exact65/66,70/71,75/76 and79/80 boundaries',()=>{const table=[.048,.088,.128,.168,.208,.288,.368,.448,.528,.608,.708,.808,.908,1,1];for(let n=1;n<=65;n++)assert.equal(conveneFiveStarRate(n-1),.008);for(let n=66;n<=80;n++)assert.equal(conveneFiveStarRate(n-1),table[n-66]);for(const n of [-1,80,.5,NaN])assert.throws(()=>conveneFiveStarRate(n));for(const n of [66,71,76,78]){const rate=conveneFiveStarRate(n-1),s={...emptyConveneState(),pity5:n-1};assert.equal(drawConvene(s,catalog,'banner-a',1,now,values(rate-1e-9,.1)).results[0].rarity,5);assert.notEqual(drawConvene(s,catalog,'banner-a',1,now,values(rate,.1,.2)).results[0].rarity,5);}});
test('soft-pity expected pulls match the supplied54.1 table without a flat80-point pileup',()=>{let survival=1,mean=0;const cumulative=[];for(let n=1;n<=80;n++){mean+=survival;survival*=1-conveneFiveStarRate(n-1);cumulative.push(1-survival);}assert.ok(Math.abs(mean-54.1027437865)<1e-8);assert.ok(Math.abs(cumulative[69]-.7040247)<1e-7);assert.equal(cumulative[78],1);});
test('rising five-star chance keeps the natural6% four-star band and ten-pull priority',()=>{const s={...emptyConveneState(),pity5:66};assert.equal(drawConvene(s,catalog,'banner-a',1,now,values(.1,.1,.2)).results[0].rarity,4);assert.equal(drawConvene(s,catalog,'banner-a',1,now,values(.2,.1)).results[0].rarity,3);assert.equal(drawConvene({...s,pity4:9},catalog,'banner-a',1,now,values(.5,.1)).results[0].rarity,4);assert.equal(drawConvene({...s,pity4:9},catalog,'banner-a',1,now,values(.08,.1)).results[0].rarity,5);});

test('ten-pull guarantee, four-star featured loss and featured next four survive banner switching and a five-star',()=>{
 const a=drawConvene({...emptyConveneState(),pity4:9},catalog,'banner-a',1,now,()=>.9);assert.equal(a.results[0].rarity,4);assert.equal(a.state.guaranteed4,true);
 const gold=drawConvene(a.state,catalog,'banner-b',1,now,values(0,.1));assert.equal(gold.results[0].rarity,5);assert.equal(gold.state.guaranteed4,true);assert.equal(gold.state.pity4,0);
 const up=drawConvene(gold.state,catalog,'banner-b',1,now,values(.02,.9));assert.equal(up.results[0].id,'character:up4');assert.equal(up.state.guaranteed4,false);
});
test('ordered ten pulls commit once, mark duplicates per individual draw and retain bounded history',()=>{
 let s=emptyConveneState();for(let i=0;i<24;i++)s=drawConvene(s,catalog,'banner-a',10,now,()=>.9).state;
 assert.equal(s.total,240);assert.equal(s.revision,24);assert.equal(s.history.length,200);assert.equal(s.history[0].number,240);assert.equal(s.history.at(-1).number,41);assert.equal(Object.values(s.owned).reduce((a,b)=>a+b,0),240);
 const fresh=drawConvene(emptyConveneState(),catalog,'banner-a',10,now,()=>.9);assert.equal(fresh.results[0].isNew,true);assert.equal(fresh.results[1].isNew,false);assert.equal(fresh.results[1].copies,2);assert.deepEqual(fresh.results.map(r=>r.number),[1,2,3,4,5,6,7,8,9,10]);
});
test('expired or incomplete pools and invalid random inputs cannot mutate a saved state',()=>{
 const state=emptyConveneState(),before=JSON.stringify(state);
 for(const fn of [()=>drawConvene(state,catalog,'banner-a',1,Date.parse('2099-01-01T00:00:00Z')),()=>drawConvene(state,{...catalog,threeIds:[]},'banner-a',1,now),()=>drawConvene(state,catalog,'banner-a',1,now,()=>NaN),()=>drawConvene(state,catalog,'banner-a',1,now,values(0,Infinity))])assert.throws(fn);
 assert.equal(JSON.stringify(state),before);
});
test('storage rejects corrupt, future-version, oversized, poisoned and unbounded data',()=>{
 assert.equal(parseConveneState(null).valid,true);assert.equal(parseConveneState(JSON.stringify(emptyConveneState())).valid,true);
 for(const raw of ['{',JSON.stringify({...emptyConveneState(),version:2}),JSON.stringify({...emptyConveneState(),pity5:80}),JSON.stringify({...emptyConveneState(),pity4:10}),JSON.stringify({...emptyConveneState(),owned:JSON.parse('{"__proto__":1}')}),' '.repeat(350001)])assert.equal(parseConveneState(raw).valid,false);
});
test('coral rewards include the official non-featured-five compensation and duplicate thresholds',()=>{
 const lost=drawConvene(emptyConveneState(),catalog,'banner-a',1,now,values(0,.9,.1)).results;
 assert.deepEqual(conveneRewards(lost),{afterglow:45,oscillated:0});
 assert.deepEqual(conveneRewards([{...lost[0],featured:true,copies:8}]),{afterglow:40,oscillated:0});
 assert.deepEqual(conveneRewards([{...lost[0],rarity:4,copies:8}]),{afterglow:8,oscillated:0});
 assert.deepEqual(conveneRewards([{...lost[0],rarity:3,kind:'weapon'}]),{afterglow:0,oscillated:15});
});
test('reviewed weapon inventory has15 three-star and20 four-star exact native identities, no excluded sources',()=>{
 assert.equal(weapons.weapons.length,35);assert.equal(new Set(weapons.weapons.map(w=>w.id)).size,35);assert.equal(weapons.weapons.filter(w=>w.rarity===3).length,15);assert.equal(weapons.weapons.filter(w=>w.rarity===4).length,20);
 for(const w of weapons.weapons){assert.match(w.icon,/^https:\/\/raw\.githubusercontent\.com\/DommyMM\/wuwabuild\/main\/public\/assets\/UIResources\//);for(const l of ['ko','en','ja','zh'])assert.ok(w.name[l]&&w.type[l]);assert.ok(!/Guardian|Training/i.test(w.name.en));}
});
test('only active exact reviewed rotation/member matches become banners; no future, expired, wrong-game or missing-4-star borrowing',()=>{
 const c=reference.characters.find(c=>c.id==='1312');const four=['1504','1602','1202'].map(id=>reference.characters.find(c=>c.id===id));
 const entry={id:'fixture-current',gameId:'wuwa',region:'global',kind:'pickup',sourceKind:'official',sourceUrl:'https://example.test',startAt:'2026-10-22T11:00:00+09:00',endAt:'2026-11-11T12:59:00+09:00',pickupMembers:[{role:'featured',rarity:5,name:c.name},...four.map(c=>({role:'rate-up',rarity:4,name:c.name}))]};
 const good=createWuwaConveneCatalog([entry],reference.characters,now);const lumi=good.items.find(i=>i.id==='character:1504');assert.match(lumi.image,/IconRolePile\/T_IconRole_Pile_dengdeng_UI\.webp$/);assert.equal(lumi.width,696);assert.equal(lumi.height,960);assert.ok(!lumi.image.includes('/images/splash/'));assert.equal(good.banners.length,1);assert.equal(good.banners[0].featuredId,'character:1312');assert.equal(good.threeIds.length,15);assert.equal(good.fourIds.filter(id=>id.startsWith('weapon:')).length,20);assert.equal(good.items.some(i=>i.id.includes('announced')),false);
 for(const changed of [{gameId:'hsr'},{sourceKind:'community'},{startAt:'2026-10-28T00:00:00Z'},{endAt:'2026-10-26T00:00:00Z'},{pickupMembers:entry.pickupMembers.slice(0,3)},{startAt:'2026-11-12T00:00:00Z',endAt:'2026-12-03T00:00:00Z'}])assert.equal(createWuwaConveneCatalog([{...entry,...changed}],reference.characters,now).banners.length,0);
 assert.ok(drawConvene(emptyConveneState(),good,'fixture-current',10,now,()=>.9).results.every(r=>good.items.some(i=>i.id===r.id)));
});

test('result-card projection preserves exact native identities and official standing originals',()=>{
 const cards=JSON.parse(readFileSync(new URL('../content/wuwa-convene-character-cards.json',import.meta.url),'utf8'));
 const originals=JSON.parse(readFileSync(new URL('../content/wuwa-reference-artwork.json',import.meta.url),'utf8')).entries;
 assert.equal(Object.keys(cards).length,19);for(const [id,c]of Object.entries(cards)){assert.equal(c.url,originals[id].url);assert.equal(c.width,originals[id].width);assert.equal(c.height,originals[id].height);}
});
