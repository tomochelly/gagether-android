import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const file of ['0006_sudden_dark_phoenix.sql','0007_cute_guardian.sql','0014_quick_daredevil.sql'])db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
class Statement{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Statement(this.sql,args)}async run(){const r=db.prepare(this.sql).run(...this.args);return {meta:{changes:Number(r.changes)}}}async first(){return db.prepare(this.sql).get(...this.args)||null}}
globalThis.syncTestEnv={DB:{prepare:sql=>new Statement(sql),batch:async ss=>{db.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}}};
registerHooks({resolve(s,c,next){if(s==='cloudflare:workers')return {url:'test:sync-workers',shortCircuit:true};return next(s,c)},load(url,c,next){if(url==='test:sync-workers')return {format:'module',source:'export const env=globalThis.syncTestEnv',shortCircuit:true};return next(url,c)}});
const {createVisitorSession,deleteVisitorAccount}=await import('../lib/visitor-auth-store.ts');
const {sessionCookie}=await import('../lib/google-login.ts');
const api=await import('../app/api/account/sync/route.ts');
const {emptyProfile,mergeProfile}=await import('../lib/account-profile.ts');
const login=async subject=>sessionCookie+'='+await createVisitorSession({subject,name:subject,email:subject+'@example.test'},null);
const request=(cookie,body,origin='https://gagether.wiki')=>new Request('https://gagether.wiki/api/account/sync',{method:body?'POST':'GET',headers:{cookie,origin,'X-Gagether-Auth':'1','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
test('two independently authenticated device sessions converge with revision conflicts and deletion protection',async()=>{
 const phone=await login('same-user'),desktop=await login('same-user');assert.notEqual(phone,desktop);
 const first=await api.GET(request(phone));assert.equal(first.status,200);assert.match(first.headers.get('cache-control'),/no-store/);
 const a=await first.json(),b=await (await api.GET(request(desktop))).json();assert.equal(a.accountId,b.accountId);assert.equal(a.revision,0);
 const phoneProfile={...emptyProfile(),favorites:['wuwa'],saved:['event-1'],order:['wuwa','zzz'],notes:[{id:'n1',date:'2026-10-21',kind:'plan',title:'phone plan',body:'private note',createdAt:'2026-10-21T00:00:00Z',updatedAt:'2026-10-21T00:00:00Z'}]};
 const saved=await api.POST(request(phone,{...a,profile:phoneProfile}));assert.equal(saved.status,200);
 const desktopLocal={...emptyProfile(),favorites:['zzz']};
 assert.equal((await api.POST(request(desktop,{...b,profile:desktopLocal}))).status,409);
 const latest=await (await api.GET(request(desktop))).json();
 const combined=mergeProfile(b.profile,desktopLocal,latest.profile);
 assert.equal((await api.POST(request(desktop,{...latest,profile:combined}))).status,200);
 const now=await (await api.GET(request(phone))).json();assert.deepEqual(now.profile.favorites,['wuwa','zzz']);assert.equal(now.profile.notes[0].title,'phone plan');assert.deepEqual(now.profile.order,['wuwa','zzz']);
 assert.equal((await api.POST(request(phone,{...now,profile:{...now.profile,favorites:['zzz'],notes:[]}}))).status,200);
 const afterDelete=await (await api.GET(request(desktop))).json();assert.deepEqual(mergeProfile(now.profile,now.profile,afterDelete.profile),afterDelete.profile);
});
test('anonymous, cross-origin, switched-account and malformed requests cannot alter profiles',async()=>{
 assert.equal((await api.GET(request(''))).status,401);
 const cookie=await login('other-user'),r=await (await api.GET(request(cookie))).json();assert.deepEqual(r.profile,emptyProfile());
 assert.equal((await api.POST(request('',r))).status,401);
 assert.equal((await api.POST(request(cookie,r,'https://evil.example'))).status,403);
 assert.equal((await api.POST(request(cookie,{...r,accountId:'a'.repeat(64)}))).status,409);
 assert.equal((await api.POST(request(cookie,{...r,profile:{...r.profile,notes:[{title:'bad'}]}}))).status,400);
 const oversized={...r,profile:{...r.profile,notes:['x'.repeat(1_520_000)]}};assert.equal((await api.POST(request(cookie,oversized))).status,413);
 assert.equal((await (await api.GET(request(cookie))).json()).revision,0);
});
test('account deletion removes private profile and invalidates every device session',async()=>{
 const cookie=await login('delete-user'),second=await login('delete-user');const current=await (await api.GET(request(cookie))).json();
 assert.equal((await api.POST(request(cookie,{...current,profile:{...emptyProfile(),favorites:['wuwa']}}))).status,200);
 await deleteVisitorAccount(new Headers({cookie}));
 assert.equal(db.prepare('SELECT COUNT(*) n FROM visitor_profiles WHERE account_id=?').get(current.accountId).n,0);
 assert.equal((await api.GET(request(second))).status,401);
});
test('private layouts round trip through SQLite CAS and survive an older tab without the optional field',async()=>{
 const cookie=await login('layout-user'),a=await (await api.GET(request(cookie))).json(),layouts={overview:{order:['calendar','events'],canvas:{width:1040},sections:{calendar:{width:6,height:420,frame:{x:117,y:233,width:637},layer:3}}}},profile={...a.profile,layouts};
 assert.equal((await api.POST(request(cookie,{...a,profile}))).status,200);const b=await (await api.GET(request(cookie))).json();assert.deepEqual(b.profile.layouts,layouts);
 const legacy={...b.profile};delete legacy.layouts;legacy.favorites=['wuwa'];assert.equal((await api.POST(request(cookie,{...b,profile:legacy}))).status,200);const c=await (await api.GET(request(cookie))).json();assert.deepEqual(c.profile.layouts,layouts);assert.deepEqual(c.profile.favorites,['wuwa']);
 assert.equal((await api.POST(request(cookie,{...c,profile:{...c.profile,layouts:{overview:{order:[],sections:{calendar:{width:100}}}}}}))).status,400);
 assert.equal((await api.POST(request(cookie,{...c,profile:{...c.profile,layouts:{overview:{order:[],sections:{}}}}}))).status,200);
});
