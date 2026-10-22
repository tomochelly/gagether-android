import './load-typescript.mjs';
import {registerHooks} from 'node:module';import {test} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0009_fearless_the_stranger.sql',import.meta.url),'utf8'));
class S{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...a){return new S(this.sql,a)}async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return {results:db.prepare(this.sql).all(...this.args)}}}
const objects=new Map();globalThis.feedbackTestEnv={DB:{prepare:sql=>new S(sql)},BUCKET:{put:async(k,b,meta)=>objects.set(k,{bytes:b,meta}),delete:async k=>objects.delete(k),get:async k=>objects.has(k)?{body:objects.get(k).bytes,writeHttpMetadata:h=>h.set('Content-Type',objects.get(k).meta.httpMetadata.contentType)}:null}};globalThis.feedbackOwner=false;
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:feedback-env',shortCircuit:true};if(s==='@/lib/write-access')return {url:'test:feedback-auth',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:feedback-env')return {format:'module',source:'export const env=globalThis.feedbackTestEnv',shortCircuit:true};if(u==='test:feedback-auth')return {format:'module',source:'export const canWriteData=async()=>globalThis.feedbackOwner',shortCircuit:true};return n(u,c)}});
const api=await import('../app/api/feedback/route.ts'),delivery=await import('../app/api/feedback/delivery/route.ts'),media=await import('../app/api/feedback/media/[report]/[file]/route.ts');
const origin='https://gagether.wiki';const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jO2kAAAAASUVORK5CYII=','base64'));
async function cookie(){const r=await api.GET(new Request(origin+'/api/feedback'));return r.headers.get('set-cookie').split(';')[0];}
function req(c,key,patch={},file=true){const f=new FormData();for(const [k,v] of Object.entries({requestKey:key,category:'update',gameId:'wuwa',region:'global',locale:'ko',message:'날짜 수정 확인 제보입니다',sourceUrl:'https://example.com/source',replyTo:'reporter@example.com',...patch}))f.set(k,v);if(file)f.append('photos',new File([png],'proof.png',{type:'image/png'}));return new Request(origin+'/api/feedback',{method:'POST',headers:{cookie:c,origin,'X-Gagether-Auth':'1','cf-connecting-ip':'192.0.2.1'},body:f});}
const action=b=>new Request(origin+'/api/feedback/delivery',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(b)});
test('anonymous report with image is durable and idempotent; inbox and images are private',async()=>{
 const c=await cookie(),key=crypto.randomUUID(),first=await api.POST(req(c,key));assert.equal(first.status,200);const receipt=await first.json();assert.equal(receipt.delivery,'queued');assert.equal((await api.POST(req(c,key))).status,200);assert.equal(db.prepare('SELECT COUNT(*) n FROM feedback_requests').get().n,1);assert.equal(objects.size,1);
 assert.equal((await api.GET(new Request(origin+'/api/feedback?manage=1'))).status,403);const row=db.prepare('SELECT * FROM feedback_requests').get();const f=JSON.parse(row.attachments)[0];assert.equal((await media.GET(new Request(origin),{params:Promise.resolve({report:row.id,file:f.id})})).status,403);
 globalThis.feedbackOwner=true;const inbox=await (await api.GET(new Request(origin+'/api/feedback?manage=1'))).json();assert.equal(inbox.reports[0].attachments[0].name,'proof.png');assert.equal((await media.GET(new Request(origin),{params:Promise.resolve({report:row.id,file:f.id})})).status,200);globalThis.feedbackOwner=false;
});
test('fixed-recipient outbox claims once and requires a matching claim and actual mail ID',async()=>{
 assert.equal((await delivery.POST(action({action:'claim'}))).status,403);globalThis.feedbackOwner=true;
 const d=await (await delivery.POST(action({action:'claim'}))).json();assert.equal(d.recipient,'tomochelly@gmail.com');assert.equal(d.reports.length,1);assert.equal((await (await delivery.POST(action({action:'claim'}))).json()).reports.length,0);
 const row=d.reports[0];assert.equal((await delivery.POST(action({action:'uncertain',id:row.id,token:row.mail_token}))).status,200);assert.equal((await delivery.POST(action({action:'retry',id:row.id,token:row.mail_token}))).status,400);assert.equal((await delivery.POST(action({action:'retry',id:row.id,token:row.mail_token,sentChecked:true}))).status,409);assert.equal((await delivery.POST(action({action:'sent',id:row.id,token:row.mail_token}))).status,400);assert.equal((await delivery.POST(action({action:'sent',id:row.id,token:'a'.repeat(64),messageId:'mail1'}))).status,409);assert.equal((await delivery.POST(action({action:'sent',id:row.id,token:row.mail_token,messageId:'mail1'}))).status,200);assert.equal(db.prepare('SELECT mail_state FROM feedback_requests').get().mail_state,'sent');globalThis.feedbackOwner=false;
});
test('cross-origin requests, unsupported regional data and disguised image files are rejected',async()=>{
 const c=await cookie();let r=req(c,crypto.randomUUID());r=new Request(r,{headers:{cookie:c,origin:'https://evil.test','X-Gagether-Auth':'1'}});assert.equal((await api.POST(r)).status,403);
 assert.equal((await api.POST(req(c,crypto.randomUUID(),{region:'cn'},false))).status,400);
 const f=new FormData();for(const [k,v]of Object.entries({requestKey:crypto.randomUUID(),category:'bug',gameId:'',region:'kr',locale:'en',message:'bad image test'}))f.set(k,v);f.append('photos',new File(['<svg onload=alert(1)>'],'bad.png',{type:'image/png'}));assert.equal((await api.POST(new Request(origin+'/api/feedback',{method:'POST',headers:{cookie:c,origin,'X-Gagether-Auth':'1'},body:f}))).status,400);
 assert.equal(objects.size,1);
});

test('definite failures and checked uncertain sends can recover without reusing a claim',async()=>{
 const c=await cookie();assert.equal((await api.POST(req(c,crypto.randomUUID(),{},false))).status,200);globalThis.feedbackOwner=true;
 const first=(await (await delivery.POST(action({action:'claim'}))).json()).reports[0];
 assert.equal((await delivery.POST(action({action:'failed',id:first.id,token:first.mail_token}))).status,200);
 assert.equal((await delivery.POST(action({action:'retry',id:first.id,token:first.mail_token,sentChecked:true}))).status,200);
 const second=(await (await delivery.POST(action({action:'claim'}))).json()).reports[0];assert.notEqual(first.mail_token,second.mail_token);
 assert.equal((await delivery.POST(action({action:'sent',id:first.id,token:first.mail_token,messageId:'stale-id'}))).status,409);
 assert.equal((await delivery.POST(action({action:'uncertain',id:second.id,token:second.mail_token}))).status,200);
 db.prepare('UPDATE feedback_requests SET updated_at=? WHERE id=?').run(Date.now()-16*60000,second.id);
 assert.equal((await delivery.POST(action({action:'retry',id:second.id,token:second.mail_token,sentChecked:true}))).status,200);
 const third=(await (await delivery.POST(action({action:'claim'}))).json()).reports[0];assert.equal((await delivery.POST(action({action:'sent',id:third.id,token:third.mail_token,messageId:'recovered-mail'}))).status,200);
 globalThis.feedbackOwner=false;
});
