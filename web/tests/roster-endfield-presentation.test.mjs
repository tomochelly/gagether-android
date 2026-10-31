import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {registerHooks} from 'node:module';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
import glyphs from '../content/roster-detail-icons.json' with {type:'json'};import focus from '../content/endfield-gallery-focus.json' with {type:'json'};
const data=bootstrap.find(r=>r.gameId==='endfield'),model=await import('../lib/character-roster.ts'),{retainEndfieldRosterIcons}=await import('../lib/endfield-roster-icons.ts'),{CharacterFacts}=await import('../components/character-roster.tsx');
const stripIcons=v=>{if(!v||typeof v!=='object')return;delete v.icon;for(const x of Object.values(v))stripIcons(x);};
test('all35 exact Endfield forms gain native glyphs while complete facts stay deferred and unpublished Minghe has no invented panel',()=>{
 model.characterRosterSchema.parse(data);assert.equal(data.characters.length,35);assert.equal(glyphs.filter(r=>r.gameId==='endfield').length,200);assert.ok(Buffer.byteLength(JSON.stringify(data))<4400000);
 let skills=0,stats=0,growth=0,sections=0;for(const c of data.characters){assert.equal(c.traits.filter(t=>t.icon).length,2);skills+=(c.skillTables||[]).filter(t=>t.icon).length;stats+=(c.stats||[]).filter(t=>t.icon).length;growth+=(c.statProgression?.stats||[]).filter(t=>t.icon).length;sections+=(c.sections||[]).filter(t=>t.icon).length;}
 assert.deepEqual({skills,stats,growth,sections},{skills:136,stats:272,growth:272,sections:391});const next=data.characters.find(c=>c.id==='minghe');assert.equal(next.stats,undefined);assert.equal(next.statProgression,undefined);assert.equal(next.skillTables,undefined);
 const list=model.rosterDirectory(data);assert.ok(Buffer.byteLength(JSON.stringify(list))<150000);for(const c of list.characters){assert.equal(c.stats,undefined);assert.equal(c.skillTables,undefined);assert.equal(c.sections,undefined);assert.equal(c.potentialRewards,undefined);}
});
test('every reviewed Endfield head stays inside either diagonal crop at native pixel limits; Perlica original languages remain honest',async()=>{
 const{rosterGalleryFocus,reviewedRosterArtFrame}=await import('../lib/roster-gallery-focus.ts'),{splashPortraitFrame}=await import('../lib/gallery-framing.ts');assert.equal(focus.entries.length,36);
 for(const r of focus.entries){assert.ok(rosterGalleryFocus('endfield',r.url));for(const [width,height,slant,dpr]of [[320,435,55,1],[185,300,38,2],[280,400,38,3]]){
  const f=splashPortraitFrame(r,{width,height},r.head,slant,dpr);assert.ok(f,r.id);assert.ok(f.scale<=1/dpr+1e-9);const h=r.head;const x1=f.left+r.width*h.left/100*f.scale,x2=f.left+r.width*h.right/100*f.scale,y1=f.top+r.height*h.top/100*f.scale,y2=f.top+r.height*h.bottom/100*f.scale;assert.ok(x1>=-1e-6&&x2<=width+1e-6&&y1>=-1e-6&&y2<=height+1e-6,r.id+' protected head');
  const own={x:17,y:29,zoom:2.3,fit:'cover'};assert.deepEqual(reviewedRosterArtFrame('endfield',[{url:r.url,gallery:own}],r.url,'gallery'),own);
 }}
 assert.equal(rosterGalleryFocus('endfield','https://example.org/new-original.png'),undefined);const p=data.characters.find(c=>c.id==='perlica');assert.equal(model.rosterArt(p,'ko').kind,'portrait');assert.equal(model.rosterArt(p,'ko').width,303);assert.equal(model.rosterArt(p,'en').locale,'en');assert.equal(model.rosterArt(p,'en').kind,'full-body');
});
test('folded Endfield native sections retain every original paragraph, native icons and separate owner prose',()=>{
 const c=structuredClone(data.characters.find(c=>c.id==='laevatain'));c.sections.push({id:'owner-note',title:{ko:'추가 조건',en:'',ja:'',zh:''},body:{ko:'직접 보존할 조건',en:'',ja:'',zh:''}});const html=renderToStaticMarkup(React.createElement(CharacterFacts,{character:c,gameId:'endfield',locale:'ko',service:'global'})),dom=new JSDOM(html);
 const folded=[...dom.window.document.querySelectorAll('details.roster-fact-disclosure')];assert.equal(folded.length,c.sections.length-2);assert.ok(folded.every(d=>!d.hasAttribute('open')&&d.querySelector('summary')));
 for(const s of c.sections){assert.ok([...dom.window.document.querySelectorAll('.roster-fact-section p')].some(p=>p.textContent===s.body.ko),s.id);}assert.ok(dom.window.document.querySelector('.roster-fact-disclosure summary img'));assert.ok(dom.window.document.querySelector('section.roster-fact-section').textContent);dom.window.close();
});
test('native icon supplements preserve current coefficients and explicit glyphs, and cannot attach to unrelated source revisions or edited paragraphs',()=>{
 const reference=data.characters.find(c=>c.id==='laevatain'),c=structuredClone(reference);stripIcons(c);const before=structuredClone(c);c.skillTables[0].values[0].levels[0]='9999%';c.skillTables[1].sourceUrl='https://example.org/new-native-revision';c.statProgression.sourceUrl='https://example.org/new-growth';c.sections[1].body.ko+='\n추가 조건';c.skillTables[2].icon='https://example.org/owner-glyph.png';
 const original=structuredClone(c),out=retainEndfieldRosterIcons(c,reference);assert.deepEqual(c,original);assert.ok(out.skillTables[0].icon);assert.equal(out.skillTables[0].values[0].levels[0],'9999%');assert.equal(out.skillTables[1].icon,undefined);assert.equal(out.skillTables[2].icon,'https://example.org/owner-glyph.png');assert.equal(out.statProgression.stats[0].icon,undefined);assert.equal(out.sections[1].icon,undefined);assert.deepEqual(out.statProgression.rows,before.statProgression.rows);
});
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+f,'utf8'));
class Query{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Query(this.sql,args)}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return{results:db.prepare(this.sql).all(...this.args)}}async run(){return{meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}}
const objects=new Map();let fail=false;globalThis.__endfieldEnv={DB:{prepare:s=>new Query(s),async batch(rows){const out=[];for(const q of rows)out.push(await q.run());return out}},BUCKET:{async put(k,v){if(fail)throw Error('R2 unavailable');objects.set(k,v)},async get(k){const v=objects.get(k);return v?{json:async()=>JSON.parse(v)}:null}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return{url:'test:endfield-env',shortCircuit:true};if(s==='@/lib/write-access')return{url:'test:endfield-auth',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:endfield-env')return{format:'module',source:'export const env=globalThis.__endfieldEnv',shortCircuit:true};if(u==='test:endfield-auth')return{format:'module',source:'export const canWriteData=async()=>false',shortCircuit:true};return n(u,c)}});
test('real SQLite/R2 old snapshots regain native icons on deferred reads and repeat refreshes without losing authored facts or owner frames',async()=>{
 const{saveCharacterRoster,readCharacterRoster}=await import('../lib/character-roster-store.ts'),route=await import('../app/api/characters/route.ts'),stale=structuredClone(data);stripIcons(stale);const c=stale.characters.find(c=>c.id==='laevatain');c.skillTables[0].values[0].levels[0]='9999%';c.sections.push({id:'owner-note',title:{ko:'추가',en:'',ja:'',zh:''},body:{ko:'보존한 조건',en:'',ja:'',zh:''}});const receipt=await saveCharacterRoster(stale);assert.ok(receipt.changed);
 db.prepare('INSERT INTO editorial(key,payload,revision,updated_at,updated_by)VALUES(?,?,?,?,?)').run('roster-art:endfield:laevatain',JSON.stringify({images:[{url:c.image.url,detail:{x:47,y:53,zoom:.8,fit:'contain'}}]}),1,'2026-10-26T00:00:00Z','owner');
 const list=await route.GET(new Request('https://gagether.wiki/api/characters?game=endfield'));assert.equal(list.status,200);const d=await list.json();assert.equal(d.data.characters.length,35);assert.ok(d.data.characters.every(c=>!c.stats&&!c.skillTables&&!c.sections));
 const response=await route.GET(new Request('https://gagether.wiki/api/characters?game=endfield&id=laevatain'));assert.equal(response.status,200);const{character}=await response.json();assert.ok(character.skillTables.every(t=>t.icon));assert.ok(character.statProgression.stats.every(t=>t.icon));assert.equal(character.skillTables[0].values[0].levels[0],'9999%');assert.ok(character.sections.some(s=>s.id==='owner-note'&&s.body.ko==='보존한 조건'));assert.equal(character.artworkFrames[0].detail.x,47);assert.equal((await saveCharacterRoster(stale)).changed,false);
 fail=true;await assert.rejects(saveCharacterRoster({...stale,sourceVersion:'failed-source'}),/R2/);fail=false;assert.equal((await readCharacterRoster('endfield')).hash,receipt.hash);
});

test('exact Arcane and Liino reward originals fill old persisted metadata on detail reads and routine refresh without changing source facts',async()=>{
 const {rosterHash,readCharacterRoster,saveCharacterRoster}=await import('../lib/character-roster-store.ts'),route=await import('../app/api/characters/route.ts'),stale=model.characterRosterSchema.parse(structuredClone(data)),ids=['lizhiyan','liino'];
 for(const c of stale.characters)if(ids.includes(c.id))for(const reward of c.potentialRewards)delete reward.image;
 const original=JSON.stringify(stale),storageHash=await rosterHash(stale);objects.set(`character-rosters/endfield/${storageHash}.json`,original);
 db.prepare('UPDATE operations_health SET payload=? WHERE key=?').run(JSON.stringify({hash:storageHash,count:35,checkedAt:stale.checkedAt}),'character-roster:endfield');
 const read=await readCharacterRoster('endfield');assert.equal(read.storageHash,storageHash);
 for(const id of ids){
  const response=await route.GET(new Request('https://gagether.wiki/api/characters?game=endfield&id='+id));assert.equal(response.status,200);const {character}=await response.json();
  const expected=data.characters.find(c=>c.id===id);assert.equal(character.potentialRewards.filter(r=>r.type==='illustration'&&r.image).length,3);
  const {pinRosterFactIcons}=await import('../lib/roster-detail-icons.ts');
  assert.deepEqual(character.potentialRewards,expected.potentialRewards);assert.deepEqual(character.statProgression,pinRosterFactIcons(expected,'endfield').statProgression);
 }
 assert.equal(objects.get(`character-rosters/endfield/${storageHash}.json`),original);
 assert.equal((await saveCharacterRoster(stale)).changed,true);assert.equal((await saveCharacterRoster(stale)).changed,false);assert.equal(JSON.stringify(stale),original);
 const list=await (await route.GET(new Request('https://gagether.wiki/api/characters?game=endfield'))).json();assert.ok(list.data.characters.every(c=>!c.potentialRewards));
});

test('reward-art supplements preserve owner images and prose and reject different identities, stages, titles or source revisions',async()=>{
 const {retainEndfieldPotentialRewardArt:retain}=await import('../lib/endfield-potential-reward-art.ts'),reference=data.characters.find(c=>c.id==='perlica'),current=structuredClone(reference);
 for(const r of current.potentialRewards)delete r.image;
 current.potentialRewards[0].note={ko:'직접 보존할 조건',en:'',ja:'',zh:''};const before=structuredClone(current),merged=retain(current,reference);
 assert.deepEqual(current,before);assert.ok(merged.potentialRewards[0].image);assert.deepEqual(merged.potentialRewards[0].note,before.potentialRewards[0].note);
 current.potentialRewards[0].image={...reference.potentialRewards[0].image,url:'https://example.org/owner-original.png'};assert.equal(retain(current,reference).potentialRewards[0].image.url,'https://example.org/owner-original.png');
 for(const mutation of [r=>r.id='other-reward',r=>r.level=5,r=>r.type='namecard',r=>r.title.en='Another image',r=>r.sourceUrl='https://example.org/new-revision']){
  const changed=structuredClone(before);mutation(changed.potentialRewards[0]);assert.equal(retain(changed,reference).potentialRewards[0].image,undefined);
 }
 assert.deepEqual(retain({...before,id:'unrelated-character'},reference),{...before,id:'unrelated-character'});
});

test('native AVIF originals keep exact local aliases and frame identity without making foreign URLs equivalent',async()=>{
 const {rosterArtUrl,rosterArtFrame,rosterArtFramesSchema}=await import('../lib/roster-art-framing.ts'),path='/roster-bootstrap/'+'a'.repeat(64)+'.avif',frame={x:40,y:50,zoom:1,fit:'contain'};
 assert.equal(rosterArtUrl('https://gagether.wiki'+path),path);assert.equal(rosterArtUrl('https://gagether.tomochelly.chatgpt.site'+path),path);
 assert.deepEqual(rosterArtFrame([{url:'https://gagether.wiki'+path,detail:frame}],path,'detail'),frame);rosterArtFramesSchema.parse({images:[{url:path,detail:frame}]});
 assert.equal(rosterArtUrl('https://example.org'+path),'https://example.org'+path);assert.equal(rosterArtUrl('https://gagether.wiki'+path+'?different=1'),'https://gagether.wiki'+path+'?different=1');
});
