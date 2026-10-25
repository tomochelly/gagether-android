import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const db=new DatabaseSync(':memory:');for(const f of ['0000_fixed_ares.sql','0001_futuristic_preak.sql','0010_overjoyed_nitro.sql'])db.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
let unavailable=false;const objects=new Map();
class Statement{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Statement(this.sql,args)}async all(){if(unavailable&&this.sql.includes('FROM editorial'))throw Error('DB unavailable');return {results:db.prepare(this.sql).all(...this.args)}}async first(){return db.prepare(this.sql).get(...this.args)||null}async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}}
globalThis.rosterFrameEnv={PATCHWORK_EDITOR_EMAILS:'owner@example.test',DB:{prepare:s=>new Statement(s),batch:async rows=>{db.exec('BEGIN');try{const result=[];for(const r of rows)result.push(await r.run());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}},BUCKET:{put:async(k,v)=>objects.set(k,v),get:async k=>objects.has(k)?{json:async()=>JSON.parse(objects.get(k))}:null}};
globalThis.rosterFrameUser={userId:'verified-owner',email:'owner@example.test'};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:roster-frame-env',shortCircuit:true};if(s==='@/app/chatgpt-auth')return {url:'test:roster-frame-user',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:roster-frame-env')return {format:'module',source:'export const env=globalThis.rosterFrameEnv',shortCircuit:true};if(u==='test:roster-frame-user')return {format:'module',source:'export const getChatGPTUser=async()=>globalThis.rosterFrameUser',shortCircuit:true};return n(u,c)}});
const api=await import('../app/api/editor/characters/route.ts'),history=await import('../app/api/editor/history/route.ts'),publicApi=await import('../app/api/characters/route.ts');
const {readCharacterRoster,saveCharacterRoster}=await import('../lib/character-roster-store.ts'),{readCharacterRosterView,rosterArtSource}=await import('../lib/roster-art-framing-store.ts');const{readWuwaReferenceView}=await import('../lib/wuwa-art-framing-store.ts');
const {rosterArts}=await import('../lib/character-roster.ts'),{referenceArtwork}=await import('../lib/wuwa-reference-view.ts'),{rosterArtFrame}=await import('../lib/roster-art-framing.ts');
const request=(body,origin='https://gagether.wiki')=>new Request('https://gagether.wiki/api/editor/characters',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),get=(game,id)=>new Request('https://gagether.wiki/api/editor/characters?'+new URLSearchParams({game,...id?{id}:{}}));
const frame={x:42,y:63,zoom:1.8,fit:'contain'};
test('draft recovery merges independent surfaces and stops same-surface conflicts',async()=>{
 const {mergeRosterArtDraft}=await import('../lib/roster-art-framing.ts'),url='https://example.test/exact.png',base={images:[{url,gallery:frame}]},mine={images:[{url,gallery:{...frame,x:50}}]},current={images:[{url,gallery:frame,detail:{...frame,zoom:.5}}]};
 const merged=mergeRosterArtDraft(base,mine,current);assert.equal(merged.conflicts.length,0);assert.equal(merged.value.images[0].gallery.x,50);assert.equal(merged.value.images[0].detail.zoom,.5);
 const conflict=mergeRosterArtDraft(base,mine,{images:[{url,gallery:{...frame,x:75}}]});assert.equal(conflict.conflicts.length,1);assert.equal(conflict.value.images[0].gallery.x,75);assert.equal(conflict.conflicts[0].mine.x,50);
});
test('owner-only exact-image frames survive real SQLite/R2 collection, CAS, reset and audited restoration',async()=>{
 const original=await readCharacterRoster('nikke'),c=original.data.characters.find(c=>c.id==='1'),url=rosterArts(c,'ko')[0].url;
 const first={gameId:'nikke',characterId:c.id,revision:0,changes:{images:[{url,gallery:frame}]}};
 globalThis.rosterFrameUser=null;assert.equal((await api.GET(get('nikke',c.id))).status,403);assert.equal((await api.POST(request(first))).status,403);globalThis.rosterFrameUser={userId:'not-owner',email:'other@example.test'};assert.equal((await api.POST(request(first))).status,403);globalThis.rosterFrameUser={userId:'verified-owner',email:'owner@example.test'};
 assert.equal((await api.POST(request(first,'https://evil.example'))).status,403);
 assert.equal((await api.POST(request({...first,changes:{images:[{url:'https://example.test/wrong-character.png',gallery:frame}]}}))).status,400);
 assert.equal((await api.POST(request({...first,changes:{images:[{url,gallery:{...frame,zoom:7}}]}}))).status,400);
 let r=await api.POST(request(first));assert.equal(r.status,200);let saved=await r.json();assert.equal(saved.revision,1);assert.ok(saved.history[0].created_at);assert.equal((await api.POST(request(first))).status,409);
 const view=await readCharacterRosterView('nikke');assert.deepEqual(rosterArtFrame(view.data.characters.find(row=>row.id===c.id).artworkFrames,url,'gallery'),frame);assert.notEqual(view.hash,original.hash);assert.equal((await readCharacterRoster('nikke')).hash,original.hash);
 const incoming=structuredClone(original.data);incoming.characters[0].stats[0].value='15001';incoming.characters[0].artworkFrames=[{url,gallery:{...frame,x:99}}];await saveCharacterRoster(incoming);
 const base=await readCharacterRoster('nikke');assert.ok(base.data.characters.every(c=>!c.artworkFrames));assert.equal(base.data.characters[0].stats[0].value,'15001');assert.deepEqual(rosterArtFrame((await readCharacterRosterView('nikke')).data.characters[0].artworkFrames,url,'gallery'),frame);
 const response=await publicApi.GET(new Request('https://gagether.wiki/api/characters?game=nikke&id=1'));assert.equal(response.status,200);assert.deepEqual((await response.json()).character.artworkFrames[0].gallery,frame);
 r=await api.POST(request({...first,revision:1,changes:{images:[{url,gallery:frame,detail:{...frame,zoom:.6}}]}}));assert.equal(r.status,200);saved=await r.json();assert.equal(saved.revision,2);
 unavailable=true;assert.equal((await api.POST(request({...first,revision:2}))).status,503);unavailable=false;assert.equal((await (await api.GET(get('nikke','1'))).json()).revision,2);
 r=await api.POST(request({...first,revision:2,changes:{images:[]}}));assert.equal(r.status,200);assert.equal((await r.json()).revision,0);
 const rows=(await (await history.GET(new Request('https://gagether.wiki/api/editor/history?target=roster-art&game=nikke&id=1'))).json()).history,reset=rows.find(r=>r.action==='reset');assert.ok(reset);
 const restoreRequest=new Request('https://gagether.wiki/api/editor/history',{method:'POST',headers:{Origin:'https://gagether.wiki','Content-Type':'application/json'},body:JSON.stringify({seq:reset.seq,revision:0,side:'before'})});assert.equal((await history.POST(restoreRequest)).status,200);
 const restored=(await api.GET(get('nikke','1')));assert.deepEqual((await restored.json()).frames.images[0].detail,{...frame,zoom:.6});
});
test('WuWa Rover variants and ordinary rosters share isolated placements without editing originals',async()=>{
 const inventory=await rosterArtSource('wuwa'),rover=inventory.characters.find(c=>c.id.startsWith('rover-')),source=await rosterArtSource('wuwa',rover.id),a=referenceArtwork(source.character,0),b=referenceArtwork(source.character,1);assert.ok(a&&b&&a.url!==b.url);
 const r=await api.POST(request({gameId:'wuwa',characterId:rover.id,revision:0,changes:{images:[{url:a.url,detail:frame}]}}));assert.equal(r.status,200);
 const c=(await readWuwaReferenceView()).data.characters.find(c=>c.id===rover.id);assert.deepEqual(rosterArtFrame(c.artworkFrames,a.url,'detail'),frame);assert.equal(rosterArtFrame(c.artworkFrames,b.url,'detail'),undefined);assert.equal(rosterArtFrame(c.artworkFrames,a.url,'gallery'),undefined);
 const {games}=await import('../lib/games.ts');for(const game of games){const r=await api.GET(get(game.id));assert.equal(r.status,200,game.id);assert.ok((await r.json()).characters.length>0,game.id)}
});
