import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
const {catalogEntry,detailKey}=await import('../lib/catalog-index.ts');
const db=new DatabaseSync(':memory:');
db.exec('CREATE TABLE entries(id TEXT PRIMARY KEY,payload TEXT,updated_at TEXT); CREATE TABLE editorial(key TEXT PRIMARY KEY,payload TEXT,revision INTEGER,updated_at TEXT); CREATE TABLE source_checks(game_id TEXT,checked_at TEXT,status TEXT,count INTEGER,error TEXT);');
const queries=[];let failChecks=false,failEditorial=false,stalledRead;
globalThis.__catalogTestEnv={DB:{prepare(sql){queries.push(sql);let args=[];return {bind(...values){args=values;return this},async all(){if(stalledRead&&sql.includes('FROM entries')){const pending=stalledRead;stalledRead=null;await pending;}if(failChecks&&sql.includes('source_checks')||failEditorial&&sql.includes('FROM editorial'))throw new Error('Read unavailable');return {results:db.prepare(sql).all(...args)}}}}}};
registerHooks({resolve(specifier,context,next){return specifier==='cloudflare:workers'?{url:'data:text/javascript,export const env=globalThis.__catalogTestEnv',shortCircuit:true}:next(specifier,context)}});
const {readData,readEntry}=await import('../lib/store.ts');
const name={ko:'검수',en:'Review',ja:'検証',zh:'验证'};
const base={id:'performance-test',gameId:'wuwa',region:'global',kind:'pickup',title:name,summary:name,sourceUrl:'https://wutheringwaves.kurogames.com/kr/main',sourceTitle:'source',verifiedAt:'2026-10-17T00:00:00Z',startAt:null,endAt:null,startDate:'2026-10-22',contentBlocks:[{id:'free-text',type:'text',body:name}],detailSections:[{title:name,body:name}],detailImages:[{image:'/assets/exact-original.webp',width:3840,height:2160}],entityDetails:[{id:'base',name}],image:'/assets/exact-original.webp',localizedArtwork:{ja:{image:'/assets/exact-ja.webp',width:3840,height:2160}},videos:[{youtubeId:'abcdefghijk'}]};
const write=(e,revision='r1')=>db.prepare('INSERT OR REPLACE INTO entries VALUES (?,?,?)').run(e.id,JSON.stringify(e),revision);
write(base);write({...base,id:'hidden-test'});
const ownerDetails=[{id:'owner',name,notes:[name]}];
db.prepare('INSERT INTO editorial VALUES (?,?,?,?)').run('entry:'+base.id,JSON.stringify({entityDetails:ownerDetails,previewFocus:{x:40,y:50,zoom:1}}),2,'2026-10-17T01:00:00Z');
db.prepare('INSERT INTO editorial VALUES (?,?,?,?)').run('entry:hidden-test',JSON.stringify({hidden:true}),1,'2026-10-17T01:00:00Z');
test('index defers detail-only fields; dates, exact native artwork, localization and owner framing survive',async()=>{
 const index=(await readData({index:true})).entries.find(e=>e.id===base.id);
 const full=await readEntry(base.id);
 assert.deepEqual(index,catalogEntry(full,'r1'));
 assert.equal(index.contentBlocks,undefined);assert.deepEqual(full.contentBlocks,base.contentBlocks);assert.equal(index.entityDetails,undefined);assert.equal(index.detailSections,undefined);assert.equal(index.detailImages,undefined);assert.deepEqual(full.detailSections,base.detailSections);assert.deepEqual(full.detailImages,base.detailImages);assert.equal(index.startAt,null);
 assert.deepEqual(full.entityDetails,ownerDetails);assert.deepEqual(index.localizedArtwork,base.localizedArtwork);
 assert.deepEqual(index.previewFocus,{x:40,y:50,zoom:1});
 assert.ok(queries.some(q=>q.includes("json_remove(payload,'$.entityDetails','$.detailImages','$.detailSections','$.contentBlocks')")));
 assert.ok(queries.some(q=>q.includes('FROM entries WHERE id=?')));
 const automatic=(await readData({automatic:true})).entries.find(e=>e.id===base.id);
 assert.deepEqual(automatic.entityDetails,base.entityDetails);
 assert.equal(automatic.detailsDeferred,undefined);
});
test('detail and public index respect hidden entries and return no unrelated record',async()=>{
 assert.equal(await readEntry('hidden-test'),undefined);
 assert.equal(await readEntry('unknown-test'),undefined);
 assert.ok(!(await readData({index:true})).entries.some(e=>e.id==='hidden-test'));
});
test('stored revisions and owner revisions invalidate cached details even if verifiedAt is unchanged',async()=>{
 const a=(await readData({index:true})).entries.find(e=>e.id===base.id);write(base,'r2');
 const b=(await readData({index:true})).entries.find(e=>e.id===base.id);assert.notEqual(detailKey(a),detailKey(b));
 db.prepare('UPDATE editorial SET revision=3 WHERE key=?').run('entry:'+base.id);
 const c=(await readData({index:true})).entries.find(e=>e.id===base.id);assert.notEqual(detailKey(b),detailKey(c));
});
test('a source-check failure keeps successfully loaded content and owner overrides',async()=>{
 failChecks=true;
 try{const data=await readData({index:true});assert.equal(data.persistent,false);assert.deepEqual(data.entries.find(e=>e.id===base.id).previewFocus,{x:40,y:50,zoom:1});assert.equal((await readEntry(base.id)).entityDetails[0].id,'owner');}finally{failChecks=false;}
});
test('an editorial read failure marks the public snapshot as non-cacheable',async()=>{
 failEditorial=true;try{assert.equal((await readData({index:true})).persistent,false)}finally{failEditorial=false}
 assert.equal((await readData({index:true})).persistent,true);
});

 test('compact public response retains owner edits and uses a separate validator',async()=>{
 registerHooks({resolve(specifier,context,next){if(specifier==='next/headers')return {url:'data:text/javascript,export async function headers(){return new Headers()}',shortCircuit:true};if(specifier==='next/navigation')return {url:'data:text/javascript,export function redirect(){throw new Error("Unexpected redirect")}',shortCircuit:true};return next(specifier,context)}});
 const {GET}=await import('../app/api/data/route.ts');
 const {unpackCatalog}=await import('../lib/catalog-transport.ts');
 const normal=await GET(new Request('https://gagether.wiki/api/data?view=index'));
 const compact=await GET(new Request('https://gagether.wiki/api/data?view=index',{headers:{Accept:'application/vnd.gagether.catalog+json'}}));
 const plain=await normal.json(),packed=unpackCatalog(await compact.json());
 assert.deepEqual(packed.entries,plain.entries);
 assert.deepEqual(packed.settings,plain.settings);
 assert.notEqual(normal.headers.get('etag'),compact.headers.get('etag'));
 assert.equal(compact.headers.get('vary'),'Accept');
 const unchanged=await GET(new Request('https://gagether.wiki/api/data?view=index',{headers:{Accept:'application/vnd.gagether.catalog+json','If-None-Match':compact.headers.get('etag')}}));
 assert.equal(unchanged.status,304);
 assert.equal((await GET(new Request('https://gagether.wiki/api/data?view=automatic',{headers:{Accept:'application/vnd.gagether.catalog+json'}}))).status,403);
});

test('database reads are isolated when an earlier visitor disconnects',async()=>{
 let release;stalledRead=new Promise(resolve=>release=resolve);
 const first=readData({index:true});
 try{const second=await Promise.race([readData({index:true}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Shared pending request')),100))]);assert.equal(second.persistent,true);}
 finally{release();await first;}
});


test('the actual compact index repairs an old owner photo without transferring detail images or changing the owner record',async()=>{
 const owned={...base,id:'owned-photo',imageLocale:'zh',detailImages:[{image:'/api/media/reviewed.png',imageVerified:true,imageLocale:'neutral',imageKind:'character',width:2700,height:2700,verifiedAt:base.verifiedAt}]};
 write(owned,'photo-r1');const payload=JSON.stringify({image:'/api/media/reviewed.png',$unset:['imageLocale']});
 db.prepare('INSERT INTO editorial VALUES (?,?,?,?)').run('entry:'+owned.id,payload,3,'2026-10-17T01:00:00Z');
 const index=(await readData({index:true})).entries.find(e=>e.id===owned.id),full=await readEntry(owned.id);
 assert.equal(index.imageLocale,'neutral');assert.equal(index.imageKind,'character');assert.equal(index.image,full.image);assert.equal(index.detailImages,undefined);assert.equal(index.contentBlocks,undefined);assert.deepEqual(full.contentBlocks,base.contentBlocks);assert.equal(index.entityDetails,undefined);assert.equal(index.editor.revision,3);assert.equal(index.verifiedAt,base.verifiedAt);
 assert.ok(queries.some(q=>q.includes('json_each')&&q.includes('LIMIT 1')));assert.equal(db.prepare('SELECT payload FROM editorial WHERE key=?').get('entry:'+owned.id).payload,payload);
 write({...owned,detailImages:[{...owned.detailImages[0],image:'/another.png'}]},'photo-r2');assert.equal((await readData({index:true})).entries.find(e=>e.id===owned.id).imageLocale,undefined);
});
