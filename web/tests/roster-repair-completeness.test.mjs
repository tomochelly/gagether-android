import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import b from '../content/character-rosters/bootstrap.json' with {type:'json'};
const {characterRosterSchema,rosterArt,rosterSelection}=await import('../lib/character-roster.ts');
const {enrichCharacterRoster}=await import('../lib/character-roster-enrichment.ts');
const {hydrateRosterDetails}=await import('../lib/roster-detail-catalog.ts');
const get=g=>b.find(r=>r.gameId===g);
test('native full-identity inventories retain newly recovered characters and numerical source gaps honestly',async()=>{
 for(const r of b){characterRosterSchema.parse(r);assert.ok(r.characters.every(c=>c.name.ko));assert.ok(r.characters.filter(c=>c.availability?.status!=='announced').every(c=>c.traits?.every(t=>t.label.ko&&t.value.ko)||!c.traits?.length),r.gameId)}
 assert.equal(get('trickcal').characters.length,136);assert.equal(get('reverse1999').characters.length,136);
 assert.equal(rosterSelection(get('trickcal'),'global').characters.length,82);
 assert.equal(get('trickcal').characters.filter(c=>c.regionalStats?.kr?.length).length,135);
 assert.equal(get('hi3').characters.filter(c=>c.stats?.length).length,85);
 const trickcal=get('trickcal');
 for(const raw of trickcal.characters){
  const c=await hydrateRosterDetails(trickcal,raw);
  assert.ok(c.sections?.every(s=>s.regions?.includes('kr')));
  assert.ok(c.regionalSkillTables.kr.length>0);
  for(const [service,tables]of Object.entries(c.regionalSkillTables))assert.ok(tables.every(t=>t.regions?.includes(service)));
 }
 assert.equal(get('limbus').characters.filter(c=>c.stats?.length).length,190);
});
test('reviewed radio and SD mistakes cannot return through persistent snapshots or refreshes',()=>{
 for(const [id,nativeId]of [['48','10304'],['61','10906']]){
  const c=get('limbus').characters.find(c=>c.id===id),art=rosterArt(c,'ko');
  assert.equal(art.url,`https://raw.githubusercontent.com/eldritchtools/limbus-shared-library/2b0bfb6b0ff767326295022b970af3a761897494/public/assets/identities/${nativeId}_gacksung_info.png`);
  assert.equal(art.kind,'card');assert.equal(art.width,537);assert.equal(art.height,827);
  const stale={...get('limbus'),characters:get('limbus').characters.map(x=>x.id===id?{...x,image:{...x.image,url:'https://gagether.wiki/roster-bootstrap/'+(id==='48'?'2668876571ac0f3cc7f40ab88795a68d01c57b4382da957c36f530015b997cbc':'c98d95e2f49c6f2dac560e73f2c1c21a11b3bfaf6fced08c4c454150c0afcf71')+'.webp',kind:'splash'}}:x)};
  const repaired=enrichCharacterRoster(stale).characters.find(x=>x.id===id);assert.equal(rosterArt(repaired,'ko').url,art.url);assert.equal(rosterArt(repaired,'ko').kind,'card');
 }
 for(let i=26;i<=37;i++){const c=get('limbus').characters.find(c=>c.id===String(i));assert.equal(rosterArt(c,'ko').kind,'portrait');assert.equal(rosterArt(c,'en').kind,'splash');const wrong={...c,image:{...c.image,locale:'neutral'},images:[]};assert.equal(rosterArt(wrong,'ko'),undefined);}
});

test('Star Rail dynamic player placeholders resolve to native identity and exact path on persisted refreshes',()=>{const h=structuredClone(get('hsr'));for(const c of h.characters)if(/^80(?:0[1-9]|10)$/.test(c.id))c.name=Object.fromEntries(['ko','en','ja','zh'].map(l=>[l,'{NICKNAME}']));const r=enrichCharacterRoster(h);const c=r.characters.find(c=>c.id==='8007');assert.equal(c.name.ko,'개척자 · 기억');assert.equal(c.name.en,'Trailblazer · Remembrance');assert.ok(r.characters.every(c=>!Object.values(c.name).some(v=>v.includes('{NICKNAME}'))));});

test('invalid reverse NPC panels are repaired, quarantined without a reference, and never erase valid source updates',()=>{
 const r=structuredClone(get('reverse1999')),c=r.characters.find(c=>c.id==='26');
 const invalid=stats=>stats.map(s=>({...s,value:['hp','atk'].includes(s.id)?'999999':s.value}));
 c.name.ko='Machine D III';c.stats=invalid(c.stats);
 const fixed=enrichCharacterRoster(r).characters.find(c=>c.id==='26');
 assert.equal(fixed.name.ko,'겨울');assert.equal(fixed.stats.find(s=>s.id==='hp').value,'1263');assert.equal(fixed.stats.find(s=>s.id==='atk').value,'242');assert.equal(fixed.stats.find(s=>s.id==='reality_def').value,'106');
 c.name.ko='겨울';c.stats=structuredClone(fixed.stats);c.stats.find(s=>s.id==='hp').value='1300';
 assert.equal(enrichCharacterRoster(r).characters.find(c=>c.id==='26').stats.find(s=>s.id==='hp').value,'1300');
 const other=r.characters.find(c=>c.stats?.length&&!c.stats.some(s=>['crit_rate','crit_dmg'].includes(s.id)));
 other.stats.push(...['crit_rate','crit_dmg'].map(id=>({...other.stats[0],id,value:'0%'})));
 assert.ok(!enrichCharacterRoster(r).characters.find(c=>c.id===other.id).stats.some(s=>['crit_rate','crit_dmg'].includes(s.id)));
 const unknown={...structuredClone(c),id:'unmatched-source-id',stats:invalid(c.stats)};r.characters.push(unknown);
 assert.equal(enrichCharacterRoster(r).characters.find(c=>c.id===unknown.id).stats,undefined);
 const reference=get('reverse1999').characters.find(c=>c.id==='26'),saved=reference.stats;
 try{reference.stats=invalid(reference.stats);c.stats=invalid(c.stats);assert.equal(enrichCharacterRoster(r).characters.find(c=>c.id==='26').stats,undefined);}finally{reference.stats=saved;}
});

test('exact ZZZ cropped card originals stay cards even in stale splash records and never claim a full illustration',async()=>{const React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server'),{CharacterFacts}=await import('../components/character-roster.tsx');for(const id of ['1041','1011','1101']){const original=structuredClone(get('zzz').characters.find(c=>c.id===id)),card=[original.image,...original.images||[]].find(a=>a?.url.includes('cdn.prydwen.gg/images/zenless-zone-zero/characters/')&&a.url.includes('_card.webp'));assert.ok(card);const c={...original,image:card,images:[]};c.image.kind='splash';assert.equal(rosterArt(c,'ko').kind,'card');const html=renderToStaticMarkup(React.createElement(CharacterFacts,{character:c,locale:'ko',service:'global'}));assert.match(html,/원본 이미지/);assert.ok(!html.includes('전체 일러스트'));const withFull={...c,images:[{...c.image,url:'https://example.org/exact-character/full.png',kind:'splash',locale:'neutral'}]};assert.equal(rosterArt(withFull,'ko').url,'https://example.org/exact-character/full.png');const withBody={...withFull,images:[{...withFull.images[0],kind:'full-body'}]};assert.equal(rosterArt(withBody,'ko').kind,'full-body');}});
