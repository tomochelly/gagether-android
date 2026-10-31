import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0023_majestic_boomerang.sql',import.meta.url),'utf8'));
globalThis.__orbitDB={DB:{prepare(sql){let args=[];return{bind(...a){args=a;return this},async run(){return db.prepare(sql).run(...args)},async all(){return{results:db.prepare(sql).all(...args)}},async first(){return db.prepare(sql).get(...args)||null}}}}};
registerHooks({resolve(s,c,n){return s==='cloudflare:workers'?{url:'orbit-test:env',shortCircuit:true}:n(s,c)},load(u,c,n){return u==='orbit-test:env'?{format:'module',source:'export const env=globalThis.__orbitDB',shortCircuit:true}:n(u,c)}});
const {GET,POST}=await import('../app/api/orbit-poll/route.ts');
const {orbitPollClosesAt,orbitPollResult}=await import('../lib/orbit-poll.ts');
const url='https://gagether.wiki/api/orbit-poll';
const vote=(cookie,choice,headers={})=>new Request(url,{method:'POST',headers:{cookie,origin:'https://gagether.wiki','Content-Type':'application/json','X-Gagether-Orbit-Poll':'1',...headers},body:JSON.stringify({choice})});
test('durable campaign counts one ballot per browser, changes choices and starts empty',async()=>{
 const zero=await(await GET(new Request(url))).json();assert.equal(zero.total,0);assert.equal(zero.percent,null);
 const session=await GET(new Request(url+'?session=1',{headers:{'X-Gagether-Orbit-Poll':'1'}})),cookie=session.headers.get('set-cookie').split(';')[0];assert.match(session.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);assert.equal(db.prepare('SELECT COUNT(*) n FROM orbit_beta_votes').get().n,0);
 let r=await POST(vote(cookie,'orbit'));assert.equal(r.status,200);assert.equal((await r.json()).percent.orbit,100);
 assert.equal((await POST(vote(cookie,'orbit'))).status,200);assert.equal(db.prepare('SELECT COUNT(*) n FROM orbit_beta_votes').get().n,1);
 assert.equal((await POST(vote(cookie,'classic'))).status,429);
 db.exec('UPDATE orbit_beta_votes SET updated_at=updated_at-3000');r=await POST(vote(cookie,'classic'));const changed=await r.json();assert.equal(changed.total,1);assert.equal(changed.classic,1);assert.equal(changed.orbit,0);assert.equal(changed.choice,'classic');
 const restored=await(await GET(new Request(url+'?session=1',{headers:{cookie,'X-Gagether-Orbit-Poll':'1'}}))).json();assert.equal(restored.choice,'classic');assert.equal(restored.total,1);
 const publicResult=await(await GET(new Request(url))).json();assert.equal('choice' in publicResult,false);assert.equal(JSON.stringify(publicResult).includes(cookie.split('=')[1]),false);
});
test('rejects cross-site writes, invalid ballots, missing sessions, oversized bodies and votes after close',async()=>{
 const cookie='__Host-gagether-orbit-poll='+'a'.repeat(64);
 assert.equal((await POST(vote(cookie,'orbit',{origin:'https://evil.test'}))).status,403);
 assert.equal((await POST(vote(cookie,'orbit',{'sec-fetch-site':'cross-site'}))).status,403);
 assert.equal((await POST(vote(cookie,'orbit',{'X-Gagether-Orbit-Poll':''}))).status,403);
 assert.equal((await POST(vote('','orbit'))).status,428);
 assert.equal((await POST(vote(cookie,'other'))).status,400);
 assert.equal((await POST(vote(cookie,'a'.repeat(200)))).status,413);
 assert.equal((await GET(new Request(url+'?session=1'))).status,403);
 const clock=Date.now;Date.now=()=>orbitPollClosesAt+1;try{assert.equal((await POST(vote(cookie,'orbit'))).status,410);assert.equal((await(await GET(new Request(url))).json()).open,false);}finally{Date.now=clock;}
 assert.deepEqual(orbitPollResult(1,2).percent,{classic:33.3,orbit:66.7});assert.throws(()=>orbitPollResult(-1,2));
});
