import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const f of ['0006_sudden_dark_phoenix.sql','0007_cute_guardian.sql','0008_certain_moon_knight.sql','0014_quick_daredevil.sql'])db.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
db.exec('ALTER TABLE community_reviews ADD ip_prefix text; CREATE TABLE forum_limits(id TEXT PRIMARY KEY,window INTEGER NOT NULL,count INTEGER NOT NULL)');
class S{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...a){return new S(this.sql,a)}async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return {results:db.prepare(this.sql).all(...this.args)}}}
globalThis.communityTestEnv={DB:{prepare:sql=>new S(sql),batch:async ss=>{db.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}}};
const name=s=>({ko:s,en:s,ja:s,zh:s});
globalThis.communityEntries={first:{id:'first',gameId:'wuwa',kind:'pickup',region:'global',pickupMembers:[{name:name('Alice')},{name:name('Beth')}]},rerun:{id:'rerun',gameId:'wuwa',kind:'pickup',region:'global',pickupMembers:[{name:name('Alice')}]},weapon:{id:'weapon',gameId:'wuwa',kind:'weapon',region:'global',title:name('Sword')}};
globalThis.communityEditor=false;
registerHooks({resolve(s,c,next){if(s==='cloudflare:workers')return {url:'test:community-env',shortCircuit:true};if(s==='@/lib/store')return {url:'test:community-entry',shortCircuit:true};if(s==='@/lib/editor-access')return {url:'test:community-editor',shortCircuit:true};return next(s,c)},load(url,c,next){const sources={'test:community-env':'export const env=globalThis.communityTestEnv','test:community-entry':'export async function readEntry(id){return globalThis.communityEntries[id]}','test:community-editor':'export async function editorIdentity(){return globalThis.communityEditor?{id:"owner"}:null}'};return sources[url]?{format:'module',source:sources[url],shortCircuit:true}:next(url,c)}});
const {createVisitorSession,deleteVisitorAccount}=await import('../lib/visitor-auth-store.ts');
const {sessionCookie}=await import('../lib/google-login.ts');
const api=await import('../app/api/community/route.ts');
const moderation=await import('../app/api/owner/community/route.ts');
const login=async s=>sessionCookie+'='+await createVisitorSession({subject:s,name:'Private Real Name',email:'private@example.test'},null);
const request=(cookie='',body=null,origin='https://gagether.wiki',entry='first',member='Alice',extra='')=>new Request(`https://gagether.wiki/api/community?entry=${entry}&member=${member}${extra}`,{method:body?'POST':'GET',headers:{cookie,origin,'X-Gagether-Auth':'1','Content-Type':'application/json'},...(body?{body:JSON.stringify({entry,member,...body})}:{})});
const get=async(cookie='',entry='first',member='Alice')=>(await api.GET(request(cookie,null,undefined,entry,member))).json();
const post=async(cookie,body,entry='first',member='Alice')=>api.POST(request(cookie,body,undefined,entry,member));
test('anonymous reads; verified accounts deduplicate and edit per character/rotation without identity leakage',async()=>{
 const a=await login('one'),a2=await login('one');assert.equal((await get()).count,0);assert.equal((await post('',{action:'review',stars:5,text:'hello',revision:0})).status,401);
 assert.equal((await post(a,{action:'review',stars:5,text:'<img src=x onerror=alert(1)>',revision:0})).status,200);
 assert.equal((await post(a2,{action:'review',stars:1,text:'duplicate',revision:0})).status,409);
 let data=await get(a2);assert.equal(data.count,1);assert.equal(data.average,5);assert.equal(data.mine.revision,1);assert.ok(data.mine.mine);
 assert.equal((await post(a,{action:'review',stars:4,text:'edited',revision:1})).status,200);
 assert.equal((await post(a2,{action:'review',stars:1,text:'stale',revision:1})).status,409);
 assert.equal((await get('', 'first','Beth')).count,0);assert.equal((await get('','rerun','Alice')).count,0);
 const publicData=JSON.stringify(await get());for(const value of ['Private Real Name','private@example.test','google_subject','account_id',sessionCookie])assert.ok(!publicData.includes(value));
 assert.equal((await api.GET(request('',null,undefined,'weapon','Sword'))).status,404);
});
test('like/report idempotency, own-like rejection, protected moderation and removing hidden scores',async()=>{
 const a=await login('one'),b=await login('two'),review=(await get(a)).mine;
 assert.equal((await post(a,{action:'like',id:review.id,liked:true})).status,400);
 for(let i=0;i<2;i++)assert.equal((await post(b,{action:'like',id:review.id,liked:true})).status,200);
 assert.equal((await get(b)).reviews[0].likes,1);
 assert.equal((await post(b,{action:'like',id:review.id,liked:false})).status,200);assert.equal((await get()).reviews[0].likes,0);
 assert.equal((await post(b,{action:'report',id:review.id})).status,200);
 assert.equal((await moderation.GET()).status,403);assert.equal((await post(b,{action:'moderate',id:review.id})).status,403);
 globalThis.communityEditor=true;const reports=await (await moderation.GET()).json();assert.equal(reports.reviews.length,1);assert.equal(reports.reviews[0].entry,'first');
 assert.equal((await post('',{action:'moderate',id:review.id})).status,200);globalThis.communityEditor=false;
 assert.equal((await get()).count,0);assert.equal((await get()).reviews.length,0);
 assert.equal((await post(a,{action:'review',stars:5,text:'unhide attempt',revision:2})).status,409);
});
test('validation and cross-origin protection; account deletion cascades reviews/likes/reports',async()=>{
 const c=await login('three'),d=await login('four');
 assert.equal((await api.POST(request(c,{action:'review',stars:5,text:'x',revision:0},'https://evil.test'))).status,403);
 for(const patch of [{stars:0},{stars:6},{stars:1.5},{text:'x'.repeat(401)},{revision:-1}])assert.equal((await post(c,{action:'review',stars:3,text:'valid',revision:0,...patch})).status,400);
 assert.equal((await post(c,{action:'review',stars:3,text:'valid',revision:0})).status,200);const r=(await get(c)).mine;
 await post(d,{action:'like',id:r.id,liked:true});await post(d,{action:'report',id:r.id});
 await deleteVisitorAccount(new Headers({cookie:c}));assert.equal((await get()).count,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM community_likes WHERE review_id=?').get(r.id).n,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM community_reports WHERE review_id=?').get(r.id).n,0);
});
test('own deletion uses server identity, and per-account write throttling bounds spam',async()=>{
 const a=await login('delete-me'),b=await login('not-owner');await post(a,{action:'review',stars:2,text:'mine',revision:0});const r=(await get(a)).mine;
 assert.equal((await post(b,{action:'delete',id:r.id,revision:1})).status,409);assert.equal((await get()).count,1);
 assert.equal((await post(a,{action:'delete',revision:1})).status,200);assert.equal((await get()).count,0);
 const spam=await login('throttle');for(let n=0;n<30;n++)await post(spam,{action:'nope'});assert.equal((await post(spam,{action:'review',stars:5,text:'',revision:0})).status,429);
});
test('public summary batches bounded indexed targets without mixing characters or leaking private fields',async()=>{
 const summaries=await import('../app/api/community/summary/route.ts');
 const {hashToken}=await import('../lib/google-login.ts');
 const alice=await hashToken(JSON.stringify(['wuwa','global','first','Alice'])),beth=await hashToken(JSON.stringify(['wuwa','global','first','Beth'])),rerun=await hashToken(JSON.stringify(['wuwa','global','rerun','Alice']));
 const a=await login('summary-one'),b=await login('summary-two');
 await post(a,{action:'review',stars:5,text:'Latest opinion',revision:0});await post(b,{action:'review',stars:3,text:'',revision:0});await post(a,{action:'review',stars:1,text:'Beth only',revision:0},'first','Beth');
 const url='https://gagether.wiki/api/community/summary?'+new URLSearchParams([['target',alice],['target',beth],['target',rerun]]);
 const response=await summaries.GET(new Request(url));assert.equal(response.status,200);const data=await response.json();
 assert.deepEqual(data.summaries[alice],{average:4,count:2,comments:1,excerpt:'Latest opinion'});assert.equal(data.summaries[beth].average,1);assert.equal(data.summaries[rerun].count,0);
 assert.deepEqual(Object.keys(data.summaries[alice]).sort(),['average','comments','count','excerpt']);assert.ok(!JSON.stringify(data).includes('account_id'));assert.ok(!response.headers.has('set-cookie'));
 const id=(await get(a)).mine.id;globalThis.communityEditor=true;await post('',{action:'moderate',id});globalThis.communityEditor=false;
 const hidden=await (await summaries.GET(new Request(url))).json();assert.equal(hidden.summaries[alice].count,1);assert.equal(hidden.summaries[alice].excerpt,null);
 for(const query of ['target=bad',new URLSearchParams(Array.from({length:31},(_,i)=>['target',i.toString(16).padStart(64,'0')])).toString()])assert.equal((await summaries.GET(new Request('https://gagether.wiki/api/community/summary?'+query))).status,400);
});


test('anonymous ratings need no login, expose only the edge IP prefix, retain browser ownership and cannot become an account session',async()=>{
 const {anonymousCookie,maskedCommunityIp}=await import('../lib/anonymous-community.ts'),{visitorSession}=await import('../lib/visitor-auth-store.ts');
 const req=(cookie='',body)=>new Request('https://gagether.wiki/api/community?entry=first&member=Alice&anonymous=1',{method:body?'POST':'GET',headers:{cookie,origin:'https://gagether.wiki','Content-Type':'application/json','X-Gagether-Auth':'1','CF-Connecting-IP':'192.0.2.55','X-Forwarded-For':'1.2.3.4'},...body?{body:JSON.stringify({entry:'first',member:'Alice',anonymous:true,...body})}:{}});
 const before=db.prepare('SELECT COUNT(*) n FROM visitor_accounts').get().n,r=await api.GET(req()),data=await r.json(),cookie=r.headers.get('set-cookie').split(';')[0];assert.match(cookie,new RegExp('^'+anonymousCookie));assert.equal(data.canWrite,true);assert.equal(data.signedIn,false);assert.equal(data.anonymous,true);assert.equal(data.ipPrefix,'192.0');assert.equal(db.prepare('SELECT COUNT(*) n FROM visitor_accounts').get().n,before);
 const body={action:'review',stars:4,text:'Guest experience',revision:0,accountScope:data.draftScope};assert.equal((await api.POST(req(cookie,body))).status,200);assert.equal((await api.POST(req(cookie,body))).status,409);
 const mine=await(await api.GET(req(cookie))).json();assert.equal(mine.mine.ipPrefix,'192.0');assert.equal(mine.mine.anonymous,true);assert.equal(mine.mine.stars,4);assert.equal(await visitorSession(new Headers({cookie})),null);assert.ok(!JSON.stringify(mine).includes('192.0.2.55'));
 const otherResponse=await api.GET(req()),other=await otherResponse.json(),otherCookie=otherResponse.headers.get('set-cookie').split(';')[0];assert.equal((await api.POST(req(otherCookie,{action:'delete',revision:1,accountScope:other.draftScope}))).status,409);
 assert.equal((await api.POST(req(cookie,{action:'review',stars:3,text:'Updated guest experience',revision:1,accountScope:data.draftScope}))).status,200);assert.equal((await api.POST(req(cookie,{action:'delete',revision:2,accountScope:data.draftScope}))).status,200);
 assert.equal(maskedCommunityIp(new Headers({'CF-Connecting-IP':'2001:db8:abcd:1234::1'})),'2001:db8');assert.equal(maskedCommunityIp(new Headers({'CF-Connecting-IP':'::ffff:192.0.2.55'})),'192.0');assert.equal(maskedCommunityIp(new Headers({'X-Forwarded-For':'192.0.2.55'})),null);assert.equal(maskedCommunityIp(new Headers({'CF-Connecting-IP':'999.1.2.3'})),null);
});
test('logged-in users may select a separate anonymous rating without changing their existing account review',async()=>{
 const logged=await login('anon-opt-in'),requestWith=(cookie,body,anon=false)=>new Request('https://gagether.wiki/api/community?entry=first&member=Beth'+(anon?'&anonymous=1':''),{method:body?'POST':'GET',headers:{cookie,origin:'https://gagether.wiki','Content-Type':'application/json','X-Gagether-Auth':'1','CF-Connecting-IP':'198.51.100.9'},...body?{body:JSON.stringify({entry:'first',member:'Beth',...body})}:{}});
 assert.equal((await api.POST(requestWith(logged,{action:'review',stars:5,text:'Account opinion',revision:0}))).status,200);
 const r=await api.GET(requestWith(logged,null,true)),d=await r.json(),cookie=logged+'; '+r.headers.get('set-cookie').split(';')[0];assert.equal(d.signedIn,true);assert.equal(d.anonymous,true);
 assert.equal((await api.POST(requestWith(cookie,{action:'review',anonymous:true,accountScope:d.draftScope,stars:2,text:'Anonymous opinion',revision:0}))).status,200);
 const normal=await(await api.GET(requestWith(cookie))).json();assert.equal(normal.mine.stars,5);assert.equal(normal.mine.anonymous,false);assert.equal(normal.mine.ipPrefix,undefined);
});

test('anonymous IP rate limit survives guest-cookie resets without storing or returning the complete address',async()=>{
 const make=(cookie='',body)=>new Request('https://gagether.wiki/api/community?entry=first&member=Alice&anonymous=1',{method:body?'POST':'GET',headers:{cookie,origin:'https://gagether.wiki','Content-Type':'application/json','X-Gagether-Auth':'1','CF-Connecting-IP':'198.51.100.77'},...body?{body:JSON.stringify({entry:'first',member:'Alice',anonymous:true,...body})}:{}});
 for(let i=0;i<21;i++){const r=await api.GET(make()),data=await r.json(),cookie=r.headers.get('set-cookie').split(';')[0];const result=await api.POST(make(cookie,{action:'review',stars:3,text:'',revision:0,accountScope:data.draftScope}));assert.equal(result.status,i<20?200:429);}
 assert.ok(!JSON.stringify(db.prepare('SELECT * FROM forum_limits').all()).includes('198.51.100.77'));
});
