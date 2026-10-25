import './load-typescript.mjs';import{test}from'node:test';import assert from'node:assert/strict';import{DatabaseSync}from'node:sqlite';
import{catalogContentRevision}from'../lib/catalog-revision.ts';
test('game revisions ignore unrelated games, framing and heartbeat clocks, while real facts, own status, global site edits and bounded status refresh invalidate',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE entries(id TEXT,game_id TEXT,payload TEXT,updated_at TEXT);CREATE TABLE editorial(key TEXT,payload TEXT,revision INTEGER,updated_at TEXT);CREATE TABLE source_checks(game_id TEXT,checked_at TEXT,status TEXT,count INTEGER,error TEXT);');
 const db={prepare(q){let a=[];return{bind(...args){a=args;return this},async all(){return{results:sql.prepare(q).all(...a)}}}}};
 sql.prepare('INSERT INTO entries VALUES(?,?,?,?)').run('gfl','gfl2','{}','one');sql.prepare('INSERT INTO entries VALUES(?,?,?,?)').run('hsr','hsr','{}','one');sql.prepare('INSERT INTO source_checks VALUES(?,?,?,?,?)').run('gfl2','one','ok',1,null);const now=1800000,read=()=>catalogContentRevision(db,'gfl2',now),initial=await read();
 sql.prepare('UPDATE entries SET updated_at=? WHERE game_id=?').run('two','hsr');assert.equal(await read(),initial);sql.prepare('UPDATE source_checks SET checked_at=?').run('heartbeat');assert.equal(await read(),initial);
 sql.prepare('INSERT INTO editorial VALUES(?,?,?,?)').run('roster-art:gfl2:Groza','{}',1,'now');assert.equal(await read(),initial);sql.prepare('UPDATE entries SET updated_at=? WHERE game_id=?').run('two','gfl2');const own=await read();assert.notEqual(own,initial);
 sql.prepare('INSERT INTO editorial VALUES(?,?,?,?)').run('site','{}',1,'now');assert.notEqual(await read(),own);const settings=await read();sql.prepare('UPDATE source_checks SET status=?').run('failed');assert.notEqual(await read(),settings);assert.notEqual(await catalogContentRevision(db,'gfl2',now+60000),await read());
 sql.prepare('INSERT INTO editorial VALUES(?,?,?,?)').run('entry:manual','{"gameId":"gfl2"}',1,'now');assert.notEqual(await read(),settings);
});
