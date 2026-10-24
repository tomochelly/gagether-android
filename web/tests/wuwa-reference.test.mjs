import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {registerHooks} from 'node:module';import {DatabaseSync} from 'node:sqlite';
import snapshot from '../content/wuwa-reference.json' with {type:'json'};
const read=name=>JSON.parse(readFileSync(new URL('./fixtures/wuwa-reference/'+name,import.meta.url),'utf8'));
const source=kind=>Object.fromEntries(Object.entries({ko:'ko',en:'en',ja:'ja',zh:'zh-Hans'}).map(([l,file])=>[l,read(kind+'-'+file+'.json')]));
const model=await import('../lib/wuwa-reference.ts');
const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE operations_health(key TEXT PRIMARY KEY,payload TEXT);CREATE TABLE refresh_jobs(id TEXT PRIMARY KEY,lease_until INTEGER,last_started_at TEXT);CREATE TABLE entries(id TEXT PRIMARY KEY,game_id TEXT,payload TEXT);');
class Statement{constructor(query,args=[]){this.query=query;this.args=args}bind(...args){return new Statement(this.query,args)}async first(){return sql.prepare(this.query).get(...this.args)||null}async all(){return {results:sql.prepare(this.query).all(...this.args)}}async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}}}}
globalThis.__wuwaReferenceTestEnv={DB:{prepare:q=>new Statement(q),batch:async queries=>{sql.exec('BEGIN');try{const results=await Promise.all(queries.map(q=>q.run()));sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:wuwa-reference-env',shortCircuit:true};return n(s,c)},load(u,c,n){return u==='test:wuwa-reference-env'?{format:'module',source:'export const env=globalThis.__wuwaReferenceTestEnv',shortCircuit:true}:n(u,c)}});
const store=await import('../lib/wuwa-reference-store.ts');
test('full released reference has 60 forms / 64 source IDs, four native languages, dated evidence and bounded level-one facts',()=>{
 assert.equal(model.validateWuwaReference(snapshot),snapshot);assert.equal(snapshot.characters.length,60);assert.equal(snapshot.coverage.sourceCharacters,64);assert.equal(snapshot.coverage.debutDates,38);assert.equal(snapshot.characters.filter(c=>c.id.startsWith('rover-')).length,4);assert.equal(snapshot.characters.some(c=>c.name.en==='Lily'),false);
 for(const c of snapshot.characters){for(const l of ['ko','en','ja','zh'])assert.ok(c.name[l]&&c.element.name[l]&&c.weapon.name[l]);assert.ok(c.stats.hp>0);assert.ok(!('rewards'in c));}
 const suoming=snapshot.characters.find(c=>c.name.en==='Suoming');assert.equal(suoming.debut.date,'2026-10-22');assert.equal(snapshot.cycles.find(c=>c.id==='tower-of-adversity:41').floors.length,12);assert.equal(snapshot.cycles.find(c=>c.id==='tower-of-adversity:41').floors.reduce((n,f)=>n+f.enemies.length,0),27);
 const bad=structuredClone(snapshot);bad.characters[0].name.ja='';assert.throws(()=>model.validateWuwaReference(bad));
});
test('actual tower localization joins enemy IDs, preserves each tower, ignores placeholder monster arrays and fails mixed periods',()=>{
 const rows=source('tower'),result=model.normalizeWutherTower(rows);assert.equal(result.floors.length,12);const center=result.floors.find(f=>f.area===2&&f.floor===4);assert.deepEqual(center.enemies.map(e=>e.name.ko),['이성(異性) 무장','크라운리스']);assert.ok(center.enemies.every(e=>e.level===100));assert.ok(!center.enemies.some(e=>e.id==='310000280'));assert.deepEqual(result.startDate,'2026-10-12');assert.equal(result.endDate,'2026-11-09');
 rows.ja.Begin='2026-11-09';assert.throws(()=>model.normalizeWutherTower(rows),/periods differ/);
});
test('wastes includes both teams; matrix keeps waves and explicit resistance tags without fabricated dates, levels or rewards',()=>{
 const wastes=model.normalizeWutherSlash(source('slash'));assert.equal(wastes.floors.length,12);assert.deepEqual(wastes.floors.slice(0,2).map(f=>f.floor),[1,2]);assert.ok(wastes.floors.every(f=>f.enemies.length));
 const matrix=model.normalizeWutherMatrix(source('matrix'));assert.equal(matrix.startDate,null);assert.equal(matrix.endDate,null);assert.ok(matrix.floors[0].enemies.every(e=>e.wave>0&&!e.level));assert.ok(matrix.floors[0].enemies.some(e=>e.resistanceTags.some(t=>t.ko.includes('저항'))));assert.equal(model.wuwaCycleState(matrix,'2026-10-24'),'archive');assert.ok(!('rewards'in matrix));
});
test('calendar bounds select current tower41 and wastes22 rather than largest upcoming IDs42/23, with exact end boundary',()=>{
 const plans=store.chooseWuwaCyclePlans(read('tower-index.json'),read('slash-index.json'),read('matrix-index.json'),'2026-10-24');assert.ok(plans.some(p=>p.type==='tower'&&p.id==='41'));assert.ok(plans.some(p=>p.type==='tower'&&p.id==='42'));assert.ok(plans.some(p=>p.type==='slash'&&p.id==='22'));assert.equal(model.currentWuwaCycles(snapshot.cycles,'2026-10-24').find(c=>c.modeId==='tower-of-adversity').id,'tower-of-adversity:41');assert.equal(model.wuwaCycleState(snapshot.cycles.find(c=>c.id==='tower-of-adversity:42'),'2026-10-24'),'upcoming');assert.equal(model.wuwaCycleState(snapshot.cycles.find(c=>c.id==='whimpering-wastes:22'),'2026-10-26'),'past');
 const html=readFileSync(new URL('./fixtures/wuwa-reference/matrix.html',import.meta.url),'utf8');assert.equal(store.matrixIndexFromHtml(html).cycles[0].Id,8);
});
test('real SQLite snapshots roundtrip in bounded immutable chunks, preserve unchanged timestamps, retain prior snapshots and never touch entries',async()=>{
 sql.prepare('INSERT INTO entries VALUES(?,?,?)').run('owner','wuwa','{"owner":"keep"}');const first=await store.saveWuwaReference(snapshot);assert.equal(first.changed,true);const got=await store.readWuwaReference();assert.deepEqual(got.data,snapshot);assert.equal(got.hash,first.hash);
 const unchanged={...snapshot,updatedAt:'2026-10-25T00:00:00Z',sources:snapshot.sources.map(s=>({...s,checkedAt:'2026-10-25T00:00:00Z'}))};assert.equal((await store.saveWuwaReference(unchanged)).changed,false);assert.equal((await store.readWuwaReference()).data.updatedAt,snapshot.updatedAt);
 const second=structuredClone(snapshot);second.characters[0].stats.atk++;await store.saveWuwaReference(second);assert.ok(sql.prepare('SELECT payload FROM operations_health WHERE key=?').get('wuwa-reference:snapshot:'+first.hash+':meta'));assert.equal(sql.prepare('SELECT payload FROM entries').get().payload,'{"owner":"keep"}');
 const fetch=globalThis.fetch;globalThis.fetch=async()=>new Response('Forbidden',{status:403});try{const result=await store.refreshWuwaReferenceStep(true);assert.equal(result.status,'error');assert.deepEqual((await store.readWuwaReference()).data,second);assert.equal(sql.prepare('SELECT lease_until FROM refresh_jobs').get().lease_until,0);}finally{globalThis.fetch=fetch;}
});
test('source text and asset resolution stay inert and pinned; no arbitrary image hosts, path traversal or false ownership numbers',()=>{
 assert.equal(model.wuwaBuildAsset('/assets/../../secret.png'),undefined);assert.equal(model.wuwaWutherAsset('https://evil.example/a.png'),undefined);assert.equal(model.wuwaPublicAsset('https://user:pass@raw.githubusercontent.com/x'),undefined);assert.equal(model.wuwaWutherAsset('/Game/Aki/UI/UIResources/Common/Image/ImgBoss/T_Boss_33020.T_Boss_33020'),'https://wutherin.cn-nb1.rains3.com/UI/UIResources/Common/Image/ImgBoss/T_Boss_33020.webp');assert.equal(model.plainText('<script>alert(1)</script> <color=red>data</color>'),'alert(1) data');
 const bad=structuredClone(snapshot);bad.statistics.available=true;assert.throws(()=>model.validateWuwaReference(bad),/denominator/);
});
test('the predefined automatic collector completes real SQLite checkpoints, checks both inventories and retains dated/current versus future content',async()=>{
 const nativeFetch=globalThis.fetch,NativeDate=globalThis.Date;globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-10-24T02:00:00Z']))}static now(){return new NativeDate('2026-10-24T02:00:00Z').valueOf()}};
 const characters=read('characters.json'),tower=read('tower-index.json'),slash=read('slash-index.json'),matrix=read('matrix-index.json');let calls=0;
 globalThis.fetch=async raw=>{calls++;const u=String(raw);let value,html;
  if(u==='https://wuther.in/ko/toa/')html='<script src="https://wutherin.cn-nb1.rains3.com/_next/static/chunks/source.js"></script>';
  else if(u.endsWith('/source.js'))html='e.s(["LATEST_DATA_VERSION",0,"3.7.8"]);';
  else if(u.endsWith('/Characters.json'))value=characters;
  else if(u.endsWith('/splashArt.ts'))html=readFileSync(new URL('./fixtures/wuwa-reference/splashArt.ts.txt',import.meta.url),'utf8');
  else if(u.endsWith('/disabledEntries.ts'))html='export const DISABLED_CHARACTER_IDS = new Set<string>([]);';
  else if(u.endsWith('/ko/character/index.json'))value=characters.map(c=>({Id:c.id}));
  else if(u.endsWith('/ko/tower/index.json'))value={seasons:tower.seasons.filter(c=>c.id==='41')};
  else if(u.endsWith('/ko/slash/index.json'))value={seasons:slash.seasons.filter(c=>c.id==='22')};
  else if(u==='https://wuther.in/ko/matrix/')html='self.__next_f.push('+JSON.stringify([1,'{"indexData":'+JSON.stringify({...matrix,cycles:matrix.cycles.slice(0,1)})+'}'])+')';
  else {const m=/\/(ko|en|ja|zh-Hans)\/(tower|slash|matrix)\/(41|22|8)\.json$/.exec(u);if(!m)throw Error('Unexpected source '+u);value=read(m[2]+'-'+m[1]+'.json');}
  return new Response(html??JSON.stringify(value),{headers:{'Content-Type':html?'text/html':'application/json'}});
 };
 try{let result;for(let n=0;n<8;n++){result=await store.refreshWuwaReferenceStep(true);assert.equal(result.status,'ok',result.error);if(result.done)break;}assert.equal(result.done,true);assert.ok(calls>=20);const data=(await store.readWuwaReference()).data;assert.equal(data.characters.length,60);assert.equal(data.cycles.find(c=>c.id==='tower-of-adversity:41').floors.length,12);assert.ok(data.cycles.some(c=>c.id==='tower-of-adversity:42'));const count=calls;assert.equal((await store.refreshWuwaReferenceStep()).skipped,true);assert.equal(calls,count);assert.equal(sql.prepare('SELECT payload FROM entries').get().payload,'{"owner":"keep"}');}
 finally{globalThis.fetch=nativeFetch;globalThis.Date=NativeDate;}
});
test('the public API uses conditional immutable reads while cross-origin and unauthenticated writes cannot invoke a collector',async()=>{
 registerHooks({resolve(s,c,n){if(s==='next/headers'||s==='next/navigation')return {url:'test:wuwa-'+s,shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:wuwa-next/headers')return {format:'module',source:'export const headers=async()=>new Headers()',shortCircuit:true};if(u==='test:wuwa-next/navigation')return {format:'module',source:'export const redirect=()=>{throw Error("No navigation in request test")}',shortCircuit:true};return n(u,c)}});const route=await import('../app/api/wuwa/library/route.ts');const read=await route.GET(new Request('https://gagether.wiki/api/wuwa/library'));assert.equal(read.status,200);assert.equal((await read.clone().json()).data.gameId,'wuwa');assert.ok(read.headers.get('etag'));const cached=await route.GET(new Request('https://gagether.wiki/api/wuwa/library',{headers:{'If-None-Match':read.headers.get('etag')}}));assert.equal(cached.status,304);assert.equal(await cached.text(),'');const no=await route.POST(new Request('https://gagether.wiki/api/wuwa/library',{method:'POST',headers:{origin:'https://evil.example'},body:'{"action":"refresh"}'}));assert.equal(no.status,403);const anonymous=await route.POST(new Request('https://gagether.wiki/api/wuwa/library',{method:'POST',headers:{origin:'https://gagether.wiki'},body:'{"action":"refresh"}'}));assert.equal(anonymous.status,403);
 const token='test-only-reference-token';globalThis.__wuwaReferenceTestEnv.GAGETHER_SYNC_TOKEN_SHA256=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)).then(b=>Buffer.from(b).toString('hex'));const bad=await route.POST(new Request('https://gagether.wiki/api/wuwa/library',{method:'POST',headers:{origin:'https://gagether.wiki','X-Gagether-Sync-Token':token},body:'{"action":"refresh","url":"https://evil.example"}'}));assert.equal(bad.status,400);
});

test('full artwork survives automatic normalization for every exact source ID including both Rover variants',()=>{
 const characters=model.normalizeWuwaCharacters(read('characters.json'),[]);const sourceById=new Map(read('characters.json').map(c=>[c.id,c]));assert.equal(characters.length,60);for(const c of characters)for(const p of c.portraits){assert.equal(p.artwork,model.wuwaBuildAsset(sourceById.get(p.id).icon.banner));assert.ok(p.fullArtwork);assert.ok(!p.fullArtwork.includes('IconRolePile'));}const havoc=characters.find(c=>c.id==='rover-havoc');assert.equal(havoc.portraits.length,2);assert.notEqual(havoc.portraits[0].artwork,havoc.portraits[1].artwork);assert.equal(model.validateWuwaReference(snapshot),snapshot,'v1 snapshots without art remain compatible');
});
