import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const {entrySchema,safeExtras,entityProfileSchema}=await import('../lib/content-schema.ts');
const {enrichEntityDetails}=await import('../lib/entity-catalog.ts');
const {retainEntityDetails}=await import('../lib/presentation.ts');
const {traitIcon,traitTone}=await import('../lib/trait-icons.ts');
const {statIcon}=await import('../lib/stat-icons.ts');
const {bodyCollectionCandidate}=await import('../lib/body-collection-candidate.ts');
const {bodyRewards}=await import('../lib/source-bodies.ts');
const {displayTimingNote}=await import('../lib/content-display.ts');
const {wikiCoverage}=await import('../lib/wiki-coverage.ts');
const {default:EntityMaterials}=await import('../components/entity-materials.tsx');
const {RewardDetails}=await import('../components/reward-display.tsx');
const catalog=JSON.parse(readFileSync(new URL('../content/entity-catalog.json',import.meta.url)));
const loc=s=>({ko:s,en:s,ja:s,zh:s});
const base={id:'next-rotation',gameId:'wuwa',kind:'pickup',region:'global',server:'global',title:loc('Other'),summary:loc(''),sourceUrl:'https://wutheringwaves.kurogames.com/kr/main/news/detail/5572',sourceTitle:'Version',sourceKind:'official',publishedAt:null,verifiedAt:'2026-10-23T00:00:00Z',startAt:null,endAt:null};

test('all catalog profiles and native material assets validate with no mixed weapon rewards',()=>{
 for(const row of catalog){const parsed=entityProfileSchema.safeParse(row.profile);assert.equal(parsed.success,true,parsed.error?.message);const entry={...base,gameId:row.gameId,kind:row.kind,region:row.regions?.[0]||'global',entityDetails:[row.profile]};assert.equal(entrySchema.safeParse(entry).success,true);assert.equal(safeExtras(entry),true,row.profile.id);for(const g of row.profile.materials||[]){assert.equal(new Set(g.items.map(m=>m.id)).size,g.items.length);for(const m of g.items){assert.ok(m.quantity);assert.ok(existsSync(new URL('../public'+m.icon.image,import.meta.url)),m.icon.image);}}}
 const lucilla=catalog.find(r=>r.profile.id==='wuwa-lucilla').profile;assert.ok(!lucilla.stats.some(s=>s.label.en.includes('Energy')&&s.value==='140'));assert.ok(lucilla.groups.some(g=>g.body.en.includes('Energy cost: 0')));
 const rue=catalog.find(r=>r.profile.id==='wuwa-weapon-21020107').profile;assert.ok(rue.materials[0].items.some(m=>m.name.en==='LF Mech Core'));assert.ok(!rue.materials[0].items.some(m=>m.name.en==='LF Howler Core'));assert.match(rue.groups[0].body.en,/less than 100 Concerto/);
});

test('future exact-entity pickup gets stats/materials, ignores rate-up and other games/outfits/services, and is idempotent',()=>{
 const data=catalog.find(r=>r.profile.id==='wuwa-lucilla');const e={...base,pickupMembers:[{name:data.names[0],type:'rerun',role:'featured'}]};const next=enrichEntityDetails(e);assert.equal(next.entityDetails[0].id,data.profile.id);assert.strictEqual(enrichEntityDetails(next),next);assert.equal(next.startAt,null);assert.equal(next.image,undefined);assert.equal(next.rewards,undefined);
 for(const changed of [{gameId:'bluearchive'},{kind:'event'},{pickupMembers:[{name:data.names[0],role:'rate-up',type:'unknown'}]},{pickupMembers:[{name:{...data.names[0],en:'Lucilla (Other outfit)'},role:'featured',type:'rerun'}]}])assert.strictEqual(enrichEntityDetails({...e,...changed}).entityDetails,undefined);
 const guin=catalog.find(r=>r.profile.name.en==='Guin');assert.equal(enrichEntityDetails({...base,gameId:'trickcal',region:'kr',pickupMembers:[{name:guin.names[0],role:'featured',type:'rerun'}]}).entityDetails,undefined);
 const owned={...next,entityDetails:[{...next.entityDetails[0],stats:[{label:loc('Owner value'),value:'123'}],materials:[{id:'owner',title:loc('Owner'),items:[{id:'a',name:loc('Owner'),quantity:'7',sourceUrl:'https://example.com',sourceKind:'community'}]}]}]};assert.strictEqual(enrichEntityDetails(owned),owned);
});

test('sparse refresh preserves same-profile materials while explicit owner data stays editable',()=>{
 const p=catalog[0].profile,old={...base,entityDetails:[p]},incoming={...base,entityDetails:[{...p,materials:undefined}]};assert.deepEqual(retainEntityDetails(incoming,old).entityDetails[0].materials,p.materials);
 const explicit={...base,entityDetails:[{...p,materials:[]}]};assert.deepEqual(retainEntityDetails(explicit,old).entityDetails[0].materials,[]);
});

test('material names can be blank in a locale; exact icon and quantity remain with no language substitution',()=>{
 const material=catalog[0].profile.materials[0].items[0];const group={id:'cost',title:loc('Cost'),items:[{...material,name:{ko:'',en:'Shell Credit',ja:'',zh:''}}]};
 for(const lang of ['ko','ja','zh']){const html=renderToStaticMarkup(React.createElement(EntityMaterials,{groups:[group],locale:lang}));assert.match(html,/170,000/);assert.match(html,/wuwa-material-2.png/);assert.doesNotMatch(html,/Shell Credit/);assert.doesNotMatch(html,/width="[7-9]\d{2}"/);}
 const bad={...catalog[0].profile,materials:[{...group,items:[{id:'empty',quantity:'1',sourceUrl:'https://example.com',sourceKind:'community'}]}]};assert.equal(entityProfileSchema.safeParse(bad).success,false);
 assert.equal(safeExtras({...base,entityDetails:[{...catalog[0].profile,materials:[{...group,items:[material,material]}]}]}),false);
});

test('Blue Archive legacy and current trait IDs both resolve correct native glyph/color, stat IDs remain game-specific',()=>{
 for(const id of ['attack','attack-type']){const t={id,label:loc('Attack'),value:{ko:'폭발',en:'Explosive',ja:'爆発',zh:'爆发'}};assert.match(traitIcon('bluearchive',t).image,/type-attack/);assert.equal(traitTone('bluearchive',t),'ba-type-explosive');assert.equal(traitIcon('wuwa',t),undefined);}
 assert.match(traitIcon('wuwa',{id:'weapon',label:loc('Weapon'),value:loc('Sword')}).image,/wuwa-weapon-2/);
 const indoor={id:'terrain',label:loc('Terrain'),value:loc('Indoor')};assert.match(traitIcon('bluearchive',indoor).image,/terrain-indoor/);
 const accuracy={label:{ko:'기본 명중',en:'Base accuracy',ja:'基礎命中値',zh:'基础命中值'},value:'100'};assert.match(statIcon('bluearchive',accuracy).image,/accuracypoint/);assert.equal(statIcon('wuwa',accuracy),undefined);const custom={...accuracy,icon:catalog[0].profile.stats[1].icon};assert.strictEqual(statIcon('bluearchive',custom),custom.icon);
});

test('curated Korean Blue Archive update is body-collected; owner/archive/broadcast records are excluded',()=>{
 assert.equal(bodyCollectionCandidate({...base,id:'ba-kr-update-20261013',gameId:'bluearchive',kind:'update'}),true);for(const change of [{id:'custom-owner'},{pickupArchive:{status:'past'}},{sourceKind:'community'},{broadcast:{status:'live'}},{sourceUrl:'https://www.youtube.com/watch?v=abcdefghijk'}])assert.equal(bodyCollectionCandidate({...base,...change}),false);
});

test('version gifts never become weapon/pickup rewards, and punctuation is not swallowed in quantities',()=>{
 const e={...base,gameId:'wuwa',kind:'update'},body={locale:'en',text:'Astrite300, Lustrous Tide5,',sourceUrl:e.sourceUrl,sourceKind:'official',images:[],bodyHash:'a'.repeat(64),importedAt:e.verifiedAt};assert.deepEqual(bodyRewards({...e,kind:'weapon'},body),[]);assert.deepEqual(bodyRewards({...e,kind:'pickup'},body),[]);const rows=bodyRewards(e,body);assert.ok(rows.some(r=>r.quantity==='300'));assert.ok(rows.every(r=>!r.quantity.endsWith(',')));assert.equal(renderToStaticMarkup(React.createElement(RewardDetails,{entry:{...e,kind:'weapon',rewards:rows},locale:'ko'})),'');
});

test('duplicate timezone/date narration disappears, practical timing conditions remain and all15 games have reachable wiki paths recorded',()=>{
 assert.equal(displayTimingNote({...base,timingNote:loc('Asia/Seoul')},'ko'),'');assert.equal(displayTimingNote({...base,startAt:'2026-10-22T11:00:00+09:00',endAt:'2026-11-11T12:59:00+09:00',timingNote:loc('2026-10-22 11:00 ~ 2026-11-11 12:59')},'ko'),'');assert.equal(displayTimingNote({...base,timingNote:loc('보상 수령: 종료 후 7일')},'ko'),'보상 수령: 종료 후 7일');const coverage=wikiCoverage([]);assert.equal(coverage.length,15);assert.ok(coverage.every(g=>g.sources.length));
});

test('body fetch slots rotate across actual services without one weapon-heavy game consuming the budget',async()=>{
 const {selectBodyCandidates}=await import('../lib/body-collection-candidate.ts');const now=Date.parse('2026-10-23T12:00:00Z');
 const rows=[...Array.from({length:20},(_,i)=>({...base,id:'weapon-'+i,kind:'weapon',sourceTitle:'武器ピックアップ',sourceUrl:'https://example.com/w/'+i})),{...base,id:'ba',gameId:'bluearchive',region:'kr',kind:'update',sourceUrl:'https://example.com/ba'},{...base,id:'ak',gameId:'arknights',region:'jp',sourceUrl:'https://example.com/ak'}];
 const queue=new Map();const chosen=selectBodyCandidates(rows,queue,now,3);assert.equal(new Set(chosen.map(e=>e.gameId+'|'+e.region)).size,3);assert.ok(chosen.some(e=>e.id==='ba'));
 queue.set('https://example.com/prior',{gameId:'wuwa',region:'global',sourceAccess:'body',checkedAt:'2026-10-23T11:59:00Z'});
 queue.set('https://example.com/ba',{gameId:'bluearchive',region:'kr',sourceAccess:'metadata',checkedAt:'2026-10-23T11:59:59Z',status:'pending'});
 assert.equal(selectBodyCandidates(rows,queue,now,1)[0].gameId,'arknights');assert.equal(selectBodyCandidates(rows.filter(e=>e.gameId!=='arknights'),queue,now,1)[0].id,'ba');
 const reviewed={gameId:'bluearchive',region:'kr',sourceAccess:'body',checkedAt:'2026-10-20T00:00:00Z',status:'reviewed'};queue.set('https://example.com/ba',reviewed);assert.ok(!selectBodyCandidates(rows,queue,now,10).some(e=>e.id==='ba'));
 const cool={...reviewed,status:'pending',checkedAt:'2026-10-23T11:30:00Z'};queue.set('https://example.com/ba',cool);assert.ok(!selectBodyCandidates(rows,queue,now,10).some(e=>e.id==='ba'));
});
