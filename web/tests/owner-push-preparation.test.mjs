import './load-typescript.mjs';
import{test}from'node:test';import assert from'node:assert/strict';import{DatabaseSync}from'node:sqlite';import{registerHooks}from'node:module';import{readFileSync}from'node:fs';
const db=new DatabaseSync(':memory:');db.exec(readFileSync('drizzle/0021_ambiguous_supreme_intelligence.sql','utf8'));
class S{constructor(s,a=[]){this.s=s;this.a=a}bind(...a){return new S(this.s,a)}async run(){return{meta:{changes:Number(db.prepare(this.s).run(...this.a).changes)}}}async all(){return{results:db.prepare(this.s).all(...this.a)}}async first(){return db.prepare(this.s).get(...this.a)||null}}
globalThis.pushEnv={DB:{prepare:s=>new S(s)}};globalThis.pushOwner=false;
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return{url:'test:push-env',shortCircuit:true};if(s==='@/lib/editor-access')return{url:'test:push-owner',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:push-env')return{format:'module',source:'export const env=globalThis.pushEnv',shortCircuit:true};if(u==='test:push-owner')return{format:'module',source:'export async function editorIdentity(){return globalThis.pushOwner?{userId:"owner"}:null}',shortCircuit:true};return n(u,c)}});
const api=await import('../app/api/owner/push/route.ts'),model=await import('../lib/owner-push.ts'),origin='https://gagether.wiki';
const draft=()=>({id:crypto.randomUUID(),revision:0,gameId:'wuwa',locale:'ko',title:'명조 방송 안내',body:'공식 방송이 시작합니다.'}),req=(d,headers={})=>new Request(origin+'/api/owner/push',{method:'POST',headers:{Origin:origin,'X-Gagether-Auth':'1','Content-Type':'application/json',...headers},body:JSON.stringify(d)});
test('owner-only preparation stores synchronized drafts with CAS/readback and never enables or sends push',async()=>{
 assert.equal((await api.GET()).status,403);assert.equal((await api.POST(req(draft()))).status,403);globalThis.pushOwner=true;
 const d=draft();assert.equal((await api.POST(req(d,{Origin:'https://foreign.test'}))).status,403);assert.equal((await api.POST(req(d,{'X-Gagether-Auth':''}))).status,403);
 const first=await api.POST(req(d));assert.equal(first.status,200);const b=await first.json();assert.equal(b.draft.revision,1);assert.equal(b.readiness.ready,false);assert.deepEqual(b.audience.requires,['app-push-opt-in','my-games-membership','locale-match','android-notification-permission']);
 assert.equal((await api.POST(req(d))).status,409);const second=await api.POST(req({...d,revision:1,body:'수정한 알림 초안'}));assert.equal(second.status,200);
 const list=await(await api.GET()).json();assert.equal(list.recipientCount,null);assert.equal(list.drafts[0].body,'수정한 알림 초안');assert.equal(list.drafts[0].revision,2);assert.equal(list.readiness.ready,false);
 assert.equal((await api.POST(req({action:'send',...draft()}))).status,400);assert.equal((await api.POST(req({...draft(),gameId:'foreign'}))).status,400);assert.equal((await api.POST(req({...draft(),locale:'all'}))).status,400);assert.equal((await api.POST(req({...draft(),body:'x'.repeat(501)}))).status,400);assert.equal((await api.POST(req({...draft(),url:'https://foreign.test'}))).status,400);
 assert.equal(model.pushAudience('wuwa','en').path,'/en/games/wuwa');assert.throws(()=>model.pushAudience('wuwa','all'));
});
