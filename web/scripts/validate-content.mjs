import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
function readExport(file,name){const s=fs.readFileSync(file,'utf8');const match=s.match(new RegExp('export const '+name+'[^=]*=([\\s\\S]*?);\\n'));return JSON.parse(match[1]);}
const entries=readExport('lib/seed.ts','seedEntries');const games=readExport('lib/games.ts','games');
const moduleSrc=ts.transpileModule(fs.readFileSync('lib/types.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {entryState,safeSource,safeReference}=await import('data:text/javascript;base64,'+Buffer.from(moduleSrc).toString('base64'));
assert.equal(games.length,11);assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
for(const g of games){for(const field of ['logo','art'])assert.ok(fs.existsSync('public'+g[field]),`${g.id}: missing ${field}`);}
for(const e of entries){assert.ok(games.some(g=>g.id===e.gameId));assert.ok(safeSource(e.sourceUrl,e.gameId),e.id+': bad source '+e.sourceUrl);for(const field of ['title','summary'])for(const lang of ['ko','en','ja','zh'])assert.ok(e[field]?.[lang]?.length,e.id+': missing '+field+'/'+lang);if(e.startAt&&e.endAt)assert.ok(Date.parse(e.startAt)<Date.parse(e.endAt),e.id+': inverted interval');for(const field of ['startAt','endAt','verifiedAt'])if(e[field])assert.ok(Number.isFinite(Date.parse(e[field])),e.id+': invalid timestamp');if(e.image?.startsWith('/'))assert.ok(fs.existsSync('public'+e.image),e.id+': missing image');}
const sample={...entries[0],startAt:'2026-10-01T00:00:00+08:00',endAt:'2026-10-10T00:00:00+08:00'};
assert.equal(entryState(sample,Date.parse('2026-09-30T00:00:00Z')),'upcoming');assert.equal(entryState(sample,Date.parse('2026-10-05T00:00:00Z')),'active');assert.equal(entryState(sample,Date.parse('2026-10-09T16:00:00Z')),'ended');assert.equal(entryState({...sample,startAt:null,endAt:null},Date.now()),'notice');assert.equal(entryState({...sample,endAt:null},Date.now()),'notice');assert.equal(safeSource('https://genshin.hoyoverse.com.evil.example/test','genshin'),false);
for(const e of entries){
 assert.ok(Date.parse(e.verifiedAt)<=Date.now()+300000,e.id+': verification timestamp is in the future');
 const game=games.find(g=>g.id===e.gameId);assert.ok(game.regions.includes(e.region),e.id+': unsupported server');
 for(const [locale,url] of Object.entries(e.localizationSources||{}))assert.ok(safeSource(url,e.gameId),e.id+': bad locale source '+locale+' '+url);
 if(e.kind==='pickup'||e.kind==='weapon'){assert.ok(e.pickupType,e.id+': missing pickup type');assert.ok(e.pickupGroup,e.id+': missing rotation');assert.ok(e.poolType,e.id+': missing pool type');}
 for(const locale of ['ko','ja','zh'])assert.notEqual(e.title[locale],e.title.en,e.id+': untranslated '+locale);
}
for(const id of ['wuwa','endfield','nte','genshin','hsr','zzz'])assert.deepEqual(games.find(g=>g.id===id).regions,['global']);
assert.ok(entries.every(e=>e.region!=='cn'||['arknights','gfl2'].includes(e.gameId)),'CN is restricted to the two requested games');
const code=(file)=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const dataUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const presentation=code('lib/presentation.ts').replace("'./i18n'",JSON.stringify(dataUrl(code('lib/i18n.ts'))));
const {groupPickups,mergeVerifiedEntry,availableInLocale,versionCaption,effectiveRegion,scheduleRegions,inSchedule,matchedArtwork,featuredMembers}=await import(dataUrl(presentation));
const wuwa=groupPickups(entries.filter(e=>e.gameId==='wuwa'&&e.kind==='pickup'));
assert.equal(wuwa.length,1);assert.equal(wuwa[0].entries.length,3);assert.deepEqual(wuwa[0].entries.map(e=>e.pickupType),['new','rerun','rerun']);
const hsr=groupPickups(entries.filter(e=>e.gameId==='hsr'&&e.kind==='pickup'));
assert.equal(hsr.length,1);assert.equal(hsr[0].entries.length,2);assert.notEqual(hsr[0].entries[0].endAt,hsr[0].entries[1].endAt);
const isolation=[{...sample,id:'one',gameId:'hsr',region:'global',kind:'pickup',pickupGroup:'rotation',poolType:'character'}, {...sample,id:'two',gameId:'hsr',region:'jp',kind:'pickup',pickupGroup:'rotation',poolType:'character'}, {...sample,id:'three',gameId:'hsr',region:'global',kind:'weapon',pickupGroup:'rotation',poolType:'weapon'}];
assert.equal(groupPickups(isolation).length,3);
const updated={...sample,verifiedAt:'2026-10-16T10:00:00Z'};const old={...sample,verifiedAt:'2026-10-01T10:00:00Z'};assert.equal(mergeVerifiedEntry(updated,old),updated);
assert.equal(availableInLocale({...sample,id:'feed-test',gameId:'hsr',sourceLocale:undefined,officialLocales:undefined,translatedLocales:undefined,title:{ko:'English',en:'English',ja:'English',zh:'English'}},'ko'),false);
assert.equal(availableInLocale({...sample,id:'feed-test',officialLocales:['ko']},'ko'),true);
assert.equal(safeSource('https://x.com/random/status/123','arknights'),false);assert.equal(safeSource('https://pf.kakao.com/random/123','umamusume'),false);
console.log(JSON.stringify({ok:true,games:games.length,entries:entries.length,regions:[...new Set(entries.map(e=>e.region))],assetsVerified:true,timeBoundariesVerified:true}));

assert.equal(versionCaption(entries.find(e=>e.id==='endfield-si'),'ko'),'단청도');

// Do not reintroduce language-only server menus or hide shared updates from regional views.
for(const game of games.filter(g=>g.serviceMode==='shared-global')){
 assert.deepEqual(scheduleRegions(game),[]);
 for(const region of ['global','kr','jp']){
  assert.equal(effectiveRegion(game,region),'global');
  assert.equal(inSchedule({...sample,region:'global'},game,region),true);
 }
}
assert.equal(effectiveRegion(games.find(g=>g.id==='bluearchive'),'global'),'kr');
assert.equal(effectiveRegion(games.find(g=>g.id==='gfl2'),'jp'),'kr');
assert.equal(effectiveRegion(games.find(g=>g.id==='gfl2'),'global'),'global');
assert.equal(Date.parse(entries.find(e=>e.id==='gfl2-haoplay-mityl-featured').endAt)-Date.parse(entries.find(e=>e.id==='gfl2-kr-mityl-featured').endAt),9*3600000);

// Reviewed identity mappings are the gate: a path alone never makes a pickup image valid.
const audit=JSON.parse(fs.readFileSync('content/artwork-audit-2026-10-16.json','utf8'));
const entities=entries.filter(e=>['pickup','weapon'].includes(e.kind));
assert.equal(audit.entries.length,entities.length);
assert.equal(matchedArtwork({...sample,image:'/assets/wrong-character.webp',imageVerified:false}),false);
for(const entry of entities){
 assert.ok(matchedArtwork(entry),entry.id+': unreviewed artwork');
 assert.ok(entry.imageSource,entry.id+': missing artwork provenance');
 assert.equal(audit.entries.find(a=>a.entryId===entry.id)?.image,entry.image,entry.id+': mapping drift');
 for(const member of entry.pickupMembers||[]){if(!member.image){assert.ok(!member.imageVerified,entry.id+': missing art marked verified');continue;}assert.ok(member.imageVerified&&member.imageSource,entry.id+': unreviewed member');if(member.image.startsWith('/'))assert.ok(fs.existsSync('public'+member.image),entry.id+': missing member asset');}
}
assert.ok(entries.find(e=>e.id==='wuwa-hsin').image.includes('wuwa-hsin-splash'));
assert.ok(entries.find(e=>e.id==='nte-lacrimosa').image.includes('nte-lacrimosa-ko-full'));
assert.notEqual(entries.find(e=>e.id==='uma-global-20261014-opera').image,entries.find(e=>e.id==='uma-global-20261014-zephyr').image);
const gf2=groupPickups(entries.filter(e=>e.gameId==='gfl2'&&e.region==='kr'&&e.kind==='pickup'))[0];
assert.equal(gf2.entries.length,3);const headliners=gf2.entries.flatMap(featuredMembers);
assert.equal(headliners.filter(m=>m.type==='new').length,1);assert.equal(headliners.filter(m=>m.type==='rerun').length,2);

for(const entry of entries){
 for(const source of entry.relatedSources||[])assert.ok(safeReference(source.url,entry.gameId,source.kind),entry.id+': unsupported reference '+source.url);
 for(const section of entry.detailSections||[])for(const lang of ['ko','en','ja','zh'])assert.ok(section.title[lang]&&section.body[lang],entry.id+': missing localized detail');
 if(entry.price?.currency==='KRW')assert.equal(entry.marketRegion,'kr');
}
assert.ok(safeReference('https://vortexgaming.io/postdetail/1301160','bluearchive','community'));
assert.ok(safeReference('https://www.youtube.com/watch?v=2ZJgt46EnyA','bluearchive','video'));
assert.equal(safeReference('https://www.inven.co.kr.evil.example/guide','bluearchive','community'),false);
assert.equal(safeReference('https://youtube.com.evil.example/watch?v=2ZJgt46EnyA','bluearchive','video'),false);
console.log(JSON.stringify({artIdentityMappings:entities.length,canonicalSchedules:true,communityReferences:true,headlinerCounts:true}));
