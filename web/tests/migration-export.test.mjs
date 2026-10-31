import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {databaseInventory,databasePart,tableOrder,schemaSQL,r2Page,r2Archive,digest} from '../lib/migration-export.ts';
import {restoreSchema,tarFile,changedTables} from '../lib/migration-export-client.ts';

const db=new DatabaseSync(':memory:'),queries=[];
db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE parent(id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT, updated_at INTEGER);
 CREATE TABLE child(id TEXT PRIMARY KEY, parent_id INTEGER REFERENCES parent(id), body TEXT CHECK(json_valid(body)), bytes BLOB, huge INTEGER, empty BLOB, nil TEXT, nul TEXT, generated TEXT GENERATED ALWAYS AS (id||'-derived') STORED);
 CREATE INDEX child_parent ON child(parent_id);
 CREATE TABLE audit(id INTEGER PRIMARY KEY, old_revision INTEGER, note TEXT);
 CREATE TRIGGER child_audit AFTER INSERT ON child BEGIN INSERT INTO audit(old_revision,note) VALUES(1,'created'); END;
 CREATE VIEW child_view AS SELECT id,parent_id FROM child;
 CREATE TABLE d1_migrations(id INTEGER PRIMARY KEY, name TEXT, applied_at TEXT);
 CREATE TABLE heap(value TEXT);
 INSERT INTO parent(id,label,updated_at) VALUES(1,'한글',100),(999,'deleted',100);
 DELETE FROM parent WHERE id=999;
 INSERT INTO d1_migrations VALUES(1,'all.sql','2026-10-31');
 INSERT INTO heap VALUES('no primary key');`);
const body=JSON.stringify({text:'한글\u0000é😊'.repeat(22000)}),blob=Buffer.from(Array.from({length:120001},(_,i)=>i%256));
db.prepare('INSERT INTO child(id,parent_id,body,bytes,huge,empty,nil,nul) VALUES(?,?,?,?,9223372036854775807,?,?,?)').run('row-1',1,body,blob,Buffer.alloc(0),null,'a\0b😊');
for(let i=0;i<12;i++)db.exec(`CREATE TABLE extra_${i}(id INTEGER PRIMARY KEY,revision INTEGER); INSERT INTO extra_${i} VALUES(1,${i});`);
const adapter={prepare(sql){assert.match(sql,/^(SELECT|PRAGMA)\b/i,'production adapter must be read-only');queries.push(sql);let args=[];return{bind(...a){args=a;return this},async all(){return{results:db.prepare(sql).all(...args)}},async first(){return db.prepare(sql).get(...args)||null}}}};
async function inventory(){const first=await databaseInventory(adapter);let next=first.nextOffset;while(next!==null){const page=await databaseInventory(adapter,next);first.tables.push(...page.tables);first.excluded.push(...page.excluded);next=page.nextOffset;}first.nextOffset=null;return first;}
const scratch=mkdtempSync(path.join(tmpdir(),'gagether-export-test-'));
process.on('exit',()=>rmSync(scratch,{recursive:true,force:true}));
test('D1 SQL restores schema, audit history, migration history, huge integers, NUL text, generated columns, large BLOB/JSON and sequence',async()=>{
 const start=await inventory(),parts=[],counts={};assert.equal(start.tables.length,17);assert.ok(start.excluded.some(r=>r.name==='sqlite_sequence'));
 parts.push({name:'0000-tables.sql',data:new TextEncoder().encode(restoreSchema(start))});
 let seq=1;for(const t of tableOrder(start.tables)){let offset=0;counts[t.name]=0;for(;;){const p=await databasePart(adapter,t.name,offset);if(!p.rows)break;assert.ok(Math.max(...p.sql.split('\n').map(s=>s.length))<60_000,'bounded statements');parts.push({name:String(seq++).padStart(5,'0')+'-data.sql',data:new TextEncoder().encode(p.sql)});counts[t.name]+=p.rows;offset=p.nextOffset;}}
 parts.push({name:'99999-indexes-triggers.sql',data:new TextEncoder().encode(restoreSchema(start,true))});
 const restored=new DatabaseSync(':memory:');restored.exec('PRAGMA foreign_keys=ON');parts.forEach(p=>restored.exec(new TextDecoder().decode(p.data)));
 const a=restored.prepare('SELECT body,hex(bytes) bytes,CAST(huge AS TEXT) huge,typeof(empty) emptyType,length(empty) emptySize,nil,nul,generated FROM child').get();
 assert.equal(a.body,body);assert.equal(a.bytes,blob.toString('hex').toUpperCase());assert.equal(a.huge,'9223372036854775807');assert.equal(a.emptyType,'blob');assert.equal(a.emptySize,0);assert.equal(a.nil,null);assert.equal(a.nul,'a\0b😊');assert.equal(a.generated,'row-1-derived');
 assert.equal(restored.prepare('SELECT COUNT(*) n FROM audit').get().n,1,'audit trigger must not replay imported rows');assert.equal(restored.prepare('SELECT seq FROM sqlite_sequence WHERE name=?').get('parent').seq,999);assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
 const end=await inventory(),manifest={format:1,startedAt:start.observedAt,finishedAt:end.observedAt,start,end,exportedRows:counts,changedTables:changedTables(start,end),files:parts.map(p=>({file:p.name,bytes:p.data.length,sha256:digest(p.data)}))};
 parts.push({name:'manifest.json',data:new TextEncoder().encode(JSON.stringify(manifest))},{name:'README.txt',data:new Uint8Array()});const archive=path.join(scratch,'d1.tar');writeFileSync(archive,Buffer.from(await tarFile(parts).arrayBuffer()));
 const result=spawnSync('python',['ops/verify-migration-backup.py','d1',archive,'--out',path.join(scratch,'verified-d1')],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).verified,true);
 restored.close();
 assert.ok(schemaSQL(start,'tables').includes('CREATE TABLE'));assert.ok(schemaSQL(start,'final').includes('CREATE TRIGGER'));
 await assert.rejects(()=>databasePart(adapter,'parent"; DROP TABLE parent; --',0));await assert.rejects(()=>databasePart(adapter,'parent',-1));
});

const objects=[{key:'folder/../한글.bin',data:Buffer.from([0,255,1,2])},{key:'zero',data:Buffer.alloc(0)}].map((o,i)=>({...o,size:o.data.length,etag:'etag'+i,version:'version'+i,uploaded:new Date('2026-10-31T10:00:00Z'),httpMetadata:{contentType:'application/octet-stream'},customMetadata:{fixture:'test'}}));
const bucket={async list(options){assert.deepEqual(options.include,['httpMetadata','customMetadata']);return {objects,truncated:false}},async get(key,options){const o=objects.find(o=>o.key===key);assert.equal(options.onlyIf.etagMatches,o.etag);return {...o,body:new ReadableStream({start(c){c.enqueue(o.data);c.close()}})}}};
test('R2 streaming archive preserves metadata, safe file mapping, all bytes and original SHA-256; verifier detects missing data',async()=>{
 const page=await r2Page(bucket),tar=await new Response(r2Archive(bucket,page)).arrayBuffer();assert.equal(page.objects[0].file.includes('..'),false);
 const bundles=path.join(scratch,'r2-bundles');mkdirSync(bundles);writeFileSync(path.join(bundles,'bundle.tar'),Buffer.from(tar));const inventoryPath=path.join(scratch,'r2-inventory.json');writeFileSync(inventoryPath,JSON.stringify({objects:page.objects,objectCount:2,totalBytes:4}));
 const result=spawnSync('python',['ops/verify-migration-backup.py','r2',inventoryPath,bundles,'--out',path.join(scratch,'verified-r2')],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);const manifest=JSON.parse(readFileSync(path.join(scratch,'verified-r2/r2-complete-manifest.private.json'),'utf8'));assert.equal(manifest.objects[0].sha256,digest(objects[0].data));assert.equal(manifest.verification.totalBytes,4);
 const empty=path.join(scratch,'empty');mkdirSync(empty);const missing=spawnSync('python',['ops/verify-migration-backup.py','r2',inventoryPath,empty,'--out',path.join(scratch,'missing-r2')],{encoding:'utf8'});assert.equal(missing.status,2);
 await assert.rejects(()=>new Response(r2Archive({...bucket,get:async()=>null},page)).arrayBuffer(),/interrupted/);
 await assert.rejects(()=>new Response(r2Archive({...bucket,get:async()=>({...objects[0],version:'changed',body:new ReadableStream()})},page)).arrayBuffer(),/interrupted/);
});

globalThis.__migrationEnv={DB:adapter,BUCKET:bucket};globalThis.__migrationActor=null;
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return{url:'migration-test:env',shortCircuit:true};if(s==='@/lib/editor-access')return{url:'migration-test:identity',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='migration-test:env')return{format:'module',source:'export const env=globalThis.__migrationEnv',shortCircuit:true};if(u==='migration-test:identity')return{format:'module',source:'export async function editorIdentity(){return globalThis.__migrationActor}',shortCircuit:true};return n(u,c)}});
const route=await import('../app/api/owner/migration-export/route.ts');
test('export requires editorIdentity, rejects all mutation and cross-site methods, never logs payloads, disables caching',async()=>{
 const request=(kind,headers={})=>new Request('https://gagether.wiki/api/owner/migration-export?kind='+kind,{headers});
 assert.equal((await route.GET(request('d1-inventory',{'authorization':'Bearer updater-not-owner'}))).status,404);
 globalThis.__migrationActor={userId:'fixture-owner'};assert.equal((await route.GET(request('d1-inventory',{'sec-fetch-site':'cross-site'}))).status,404);
 for(const method of ['POST','PUT','PATCH','DELETE','HEAD','OPTIONS'])assert.equal((await route[method]()).status,404);
 const messages=[],old=console.info;console.info=(s)=>messages.push(JSON.parse(s));let response;try{response=await route.GET(request('d1-inventory'));}finally{console.info=old;}
 assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.deepEqual(Object.keys(messages[0]).sort(),['actor','at','event']);assert.equal(messages[0].actor,'fixture-owner');
 globalThis.__migrationActor=null;
});
