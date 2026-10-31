import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createElement,act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const name of ['0006_sudden_dark_phoenix.sql','0007_cute_guardian.sql','0008_certain_moon_knight.sql'])db.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
const legacyId=createHash('sha256').update('google:legacy-user').digest('hex'),legacyToken='a'.repeat(64),legacyHash=createHash('sha256').update(legacyToken).digest('hex');
db.prepare('INSERT INTO visitor_accounts VALUES (?,?,?,?,?,?)').run(legacyId,'legacy-user','Legacy','legacy@example.test',1,1);
db.prepare('INSERT INTO visitor_sessions VALUES (?,?,?)').run(legacyHash,legacyId,Date.now()+1000000);
db.prepare('INSERT INTO visitor_profiles VALUES (?,1,?,1)').run(legacyId,JSON.stringify({version:1,favorites:['wuwa'],saved:[],order:[],notes:[]}));
db.exec(readFileSync(new URL('../drizzle/0014_quick_daredevil.sql',import.meta.url),'utf8'));
let failSessions=false;
class Statement{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Statement(this.sql,args)}async run(){if(failSessions&&this.sql.startsWith('INSERT INTO visitor_sessions'))throw Error('private storage diagnostic');const r=db.prepare(this.sql).run(...this.args);return {meta:{changes:Number(r.changes)}}}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return {results:db.prepare(this.sql).all(...this.args)}}}
const credentials={DISCORD_SIGN_IN_CLIENT_ID:'123456789012345678',DISCORD_SIGN_IN_CLIENT_SECRET:'test-only-discord-secret-not-real'};
globalThis.discordTestEnv={...credentials,DB:{prepare:sql=>new Statement(sql),batch:async ss=>{db.exec('BEGIN');try{const rows=[];for(const s of ss)rows.push(await s.run());db.exec('COMMIT');return rows}catch(e){db.exec('ROLLBACK');throw e}}}};
registerHooks({resolve(s,c,next){if(s==='cloudflare:workers')return {url:'test:discord-workers',shortCircuit:true};return next(s,c)},load(url,c,next){if(url==='test:discord-workers')return {format:'module',source:'export const env=globalThis.discordTestEnv',shortCircuit:true};return next(url,c)}});
const auth=await import('../lib/google-login.ts'),discord=await import('../lib/discord-login.ts'),store=await import('../lib/visitor-auth-store.ts');
const start=await import('../app/api/auth/discord/route.ts'),callback=await import('../app/api/auth/discord/callback/route.ts'),session=await import('../app/api/auth/session/route.ts'),sync=await import('../app/api/account/sync/route.ts');
const {emptyProfile}=await import('../lib/account-profile.ts'),{default:Account}=await import('../components/google-account.tsx'),{default:DiscordSignIn}=await import('../components/discord-sign-in.tsx'),{discordAccountUi}=await import('../lib/discord-account-ui.ts');
const origin='https://gagether.wiki';
function request(path,{cookie='',body,method=body?'POST':'GET',host=origin,from=host,header='1'}={}){return new Request(host+path,{method,headers:{origin:from,cookie,'Content-Type':'application/json','X-Gagether-Auth':header},...(body?{body:JSON.stringify(body)}:{})});}
async function begin(options={}){const r=await start.POST(request('/api/auth/discord',{body:{locale:'ko',returnTo:'/mobile'},...options}));assert.equal(r.status,200);const url=new URL((await r.json()).url);return {r,url,state:url.searchParams.get('state'),cookie:r.headers.get('set-cookie').split(';')[0]};}
function callbackRequest(c,params={},cookie=c.cookie){const p=new URLSearchParams({state:c.state,iss:'https://discord.com',code:'test-one-use-code',...params});return request(discord.discordCallbackPath+'?'+p,{cookie});}
const user={id:'987654321098765432',username:'discord-user',global_name:'<Discord Visitor>',email:'must-not-be-read@example.test'};
let calls=[],mode='success';
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
 calls.push({url:String(url),options});
 assert.equal(options.headers['User-Agent'],'DiscordBot (https://gagether.wiki, 1.0)');assert.equal(options.headers.Accept,'application/json');
 if(String(url).endsWith('/token/revoke'))return new Response(null,{status:200});
 if(String(url).endsWith('/oauth2/token')){
  assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');assert.equal(options.headers['Content-Type'],'application/x-www-form-urlencoded');
  assert.equal(options.body.get('grant_type'),'authorization_code');assert.equal(options.body.get('client_id'),credentials.DISCORD_SIGN_IN_CLIENT_ID);assert.equal(options.body.get('redirect_uri'),origin+discord.discordCallbackPath);
  if(mode==='token-redirect')return new Response(null,{status:302,headers:{Location:'https://untrusted.example/steal'}});
  if(mode==='token-error')return Response.json({error:'secret-provider-response'},{status:500});
  if(mode==='invalid-client')return Response.json({error:'invalid_client',error_description:'must-never-log-this-private-detail'},{status:401});
  return Response.json({access_token:'test-disposable-access-token',refresh_token:'never-stored-refresh-token',token_type:mode==='bad-token'?'Basic':mode==='lowercase-token'?'bearer':'Bearer',...(mode==='scope-omitted'?{}:{scope:'identify'}),expires_in:604800});
 }
 assert.equal(String(url),'https://discord.com/api/v10/users/@me');assert.equal(options.headers.Authorization,'Bearer test-disposable-access-token');
 if(mode==='oversized')return Response.json({...user,noise:'x'.repeat(40000)});
 if(mode==='bot')return Response.json({...user,bot:true});
 return Response.json(user);
};
const resetCalls=()=>{calls=[];mode='success';};

test('Discord configuration is server-only, exact callback HTTPS, with RFC S256 PKCE',async()=>{
 assert.equal(discord.discordConfig({}),null);assert.equal(discord.discordConfig({...credentials,DISCORD_SIGN_IN_CLIENT_ID:'not-an-id'}),null);
 for(const secret of ['', 'short', 'contains a space in secret', 'contains-a-newline-secret\n', '한글로된가짜비밀키값입니다'])assert.equal(discord.discordConfig({...credentials,DISCORD_SIGN_IN_CLIENT_SECRET:secret}),null);
 for(const url of ['http://gagether.wiki'+discord.discordCallbackPath,origin+'/owner','https://name:secret@gagether.wiki'+discord.discordCallbackPath,origin+discord.discordCallbackPath+'?next=evil'])assert.equal(discord.discordConfig({...credentials,DISCORD_SIGN_IN_REDIRECT_URI:url}),null);
 assert.equal(discord.discordConfig(credentials).redirectUri,origin+discord.discordCallbackPath);
 assert.equal(await discord.pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
 for(const value of ['https://evil.example','//evil.example','/owner','/%2f%2fevil','/account?returnTo=https://evil'])assert.equal(discord.accountReturnTo(value),'/');
});
test('additive migration retains Google IDs, sessions, profiles, legacy query compatibility and foreign keys',async()=>{
 const legacy=await store.visitorSession(new Headers({cookie:auth.sessionCookie+'='+legacyToken}));assert.equal(legacy.id,legacyId);assert.equal(legacy.provider,'google');
 assert.equal(db.prepare('SELECT google_subject FROM visitor_accounts WHERE id=?').get(legacyId).google_subject,'legacy-user');
 assert.equal(db.prepare('SELECT revision FROM visitor_profiles WHERE account_id=?').get(legacyId).revision,1);
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 const again=await store.createVisitorSession({subject:'legacy-user',name:'Renamed',email:'legacy@example.test'},null);assert.equal((await store.visitorSession(new Headers({cookie:auth.sessionCookie+'='+again}))).id,legacyId);
});
test('full real-route Discord flow uses identify only and an opaque provider-isolated account and private sync',async()=>{
 resetCalls();const c=await begin();assert.match(c.r.headers.get('set-cookie'),/Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
 assert.equal(c.url.origin,'https://discord.com');assert.equal(c.url.searchParams.get('scope'),'identify');assert.equal(c.url.searchParams.get('code_challenge_method'),'S256');assert.equal(c.url.searchParams.get('response_type'),'code');assert.equal(c.url.searchParams.get('client_secret'),null);
 const pending=db.prepare('SELECT * FROM visitor_oauth_challenges WHERE token_hash=?').get(await auth.hashToken(c.state));assert.notEqual(pending.token_hash,c.state);assert.equal(c.url.searchParams.get('code_challenge'),await discord.pkceChallenge(pending.code_verifier));
 const r=await callback.GET(callbackRequest(c));assert.equal(r.status,303);assert.equal(r.headers.get('location'),origin+'/account?locale=ko&returnTo=%2Fmobile');assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(r.headers.get('referrer-policy'),'no-referrer');
 const cookie=r.headers.getSetCookie().find(s=>s.startsWith(auth.sessionCookie+'=')).split(';')[0];assert.match(r.headers.getSetCookie().find(s=>s.startsWith(auth.sessionCookie+'=')),/HttpOnly; Secure; SameSite=Lax/);
 const me=await (await session.GET(request('/api/auth/session',{cookie}))).json();assert.deepEqual(me,{user:{name:'<Discord Visitor>',email:'',provider:'discord'}});
 const row=db.prepare('SELECT * FROM visitor_accounts WHERE provider=?').get('discord');assert.equal(row.id,await auth.hashToken('discord:'+user.id));assert.equal(row.google_subject,'discord:'+user.id);assert.equal(row.email,'');
 assert.equal(calls.length,3);assert.equal(calls[0].options.body.get('code_verifier'),pending.code_verifier);assert.equal(calls[2].options.body.get('token'),'test-disposable-access-token');
 const snapshot=JSON.stringify({accounts:db.prepare('SELECT * FROM visitor_accounts').all(),sessions:db.prepare('SELECT * FROM visitor_sessions').all(),challenges:db.prepare('SELECT * FROM visitor_oauth_challenges').all()});assert.doesNotMatch(snapshot,/test-disposable-access-token|never-stored-refresh-token|test-only-discord-secret|must-not-be-read/);
 const a=await (await sync.GET(request('/api/account/sync',{cookie}))).json();assert.equal(a.accountId,row.id);assert.equal(a.revision,0);
 const saved=await sync.POST(request('/api/account/sync',{cookie,body:{...a,profile:{...emptyProfile(),favorites:['wuwa']}}}));assert.equal(saved.status,200);
 const old=await (await sync.GET(request('/api/account/sync',{cookie:auth.sessionCookie+'='+legacyToken}))).json();assert.equal(old.accountId,legacyId);assert.notEqual(old.accountId,a.accountId);
 const replay=await callback.GET(callbackRequest(c));assert.match(replay.headers.get('location'),/discord=restart/);assert.equal(calls.length,3);
 const logout=await session.POST(request('/api/auth/session',{cookie,body:{action:'logout'}}));assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);assert.equal((await (await session.GET(request('/api/auth/session',{cookie}))).json()).user,null);
 assert.equal((await store.visitorSession(new Headers({cookie:auth.sessionCookie+'='+legacyToken}))).id,legacyId);
});
test('start rejects missing config, cross-origin, missing custom header, signed-in sessions and malformed input',async()=>{
 resetCalls();const saved=globalThis.discordTestEnv.DISCORD_SIGN_IN_CLIENT_SECRET;delete globalThis.discordTestEnv.DISCORD_SIGN_IN_CLIENT_SECRET;
 assert.equal((await start.POST(request('/api/auth/discord',{body:{locale:'ko'}}))).status,503);globalThis.discordTestEnv.DISCORD_SIGN_IN_CLIENT_SECRET=saved;
 assert.equal((await start.POST(request('/api/auth/discord',{body:{locale:'ko'},from:'https://evil.example'}))).status,403);
 assert.equal((await start.POST(request('/api/auth/discord',{body:{locale:'ko'},header:''}))).status,403);
 assert.equal((await start.POST(request('/api/auth/discord',{body:{locale:'invalid'}}))).status,400);
 assert.equal((await start.POST(request('/api/auth/discord',{body:{locale:'ko'},host:'https://gagether.tomochelly.chatgpt.site'}))).status,409);
 assert.equal((await start.POST(request('/api/auth/discord',{body:{locale:'ko'},cookie:auth.sessionCookie+'='+legacyToken}))).status,409);assert.equal(calls.length,0);
});
test('callback state, cookie, issuer, duplicate parameters, expiry and changed-session checks fail before provider access',async()=>{
 resetCalls();
 const c=await begin();for(const [params,cookie] of [[{state:auth.randomToken()},c.cookie],[{},''],[{iss:'https://evil.example'},c.cookie],[{iss:''},c.cookie]]){const r=await callback.GET(callbackRequest(c,params,cookie));assert.match(r.headers.get('location'),/discord=restart/);assert.ok(!r.headers.getSetCookie().some(s=>s.startsWith(auth.sessionCookie+'=')));}
 const dup=new URL(callbackRequest(c).url);dup.searchParams.append('code','different-code');assert.match((await callback.GET(new Request(dup,{headers:{cookie:c.cookie}}))).headers.get('location'),/discord=restart/);
 db.prepare('UPDATE visitor_oauth_challenges SET expires_at=0 WHERE token_hash=?').run(await auth.hashToken(c.state));assert.match((await callback.GET(callbackRequest(c))).headers.get('location'),/discord=restart/);
 const d=await begin();assert.match((await callback.GET(callbackRequest(d,{},d.cookie+'; '+auth.sessionCookie+'='+legacyToken))).headers.get('location'),/discord=restart/);assert.equal(calls.length,0);
 assert.equal((await store.visitorSession(new Headers({cookie:auth.sessionCookie+'='+legacyToken}))).id,legacyId);
});
test('cancel and provider failures return bounded localized errors without destroying other accounts or leaking tokens',async()=>{
 resetCalls();const c=await begin({body:{locale:'ja',returnTo:'https://evil.example'}});const r=await callback.GET(callbackRequest(c,{error:'access_denied',error_description:'secret-provider-message'}));assert.equal(r.headers.get('location'),origin+'/account?locale=ja&discord=cancelled');assert.equal(calls.length,0);assert.doesNotMatch(r.headers.get('location'),/evil|secret/);
 const before=db.prepare('SELECT COUNT(*) n FROM visitor_accounts').get().n;
 for(const failure of ['token-error','bad-token','oversized','bot']){const attempt=await begin();mode=failure;const response=await callback.GET(callbackRequest(attempt));assert.match(response.headers.get('location'),/discord=failed/);assert.ok(!response.headers.getSetCookie().some(s=>s.startsWith(auth.sessionCookie+'=')));assert.equal(db.prepare('SELECT COUNT(*) n FROM visitor_accounts').get().n,before);assert.equal(db.prepare('SELECT COUNT(*) n FROM visitor_oauth_challenges WHERE token_hash=?').get(await auth.hashToken(attempt.state)).n,0);}
 resetCalls();
});
test('OAuth type casing and omitted unchanged scope are accepted with documented API identification headers',async()=>{
 for(const variant of ['lowercase-token','scope-omitted']){resetCalls();mode=variant;const identity=await discord.exchangeDiscordIdentity(discord.discordConfig(credentials),'test-code',auth.randomToken());assert.equal(identity.subject,user.id);assert.equal(calls.length,3);}
 resetCalls();
});
test('callback diagnostics distinguish provider rejection and session storage without logging codes, tokens, identities or raw errors',async()=>{
 const original=console.error,reported=[];console.error=(...args)=>reported.push(args.join(' '));
 try{
  for(const variant of ['invalid-client','bot','session']){resetCalls();const c=await begin();mode=variant;failSessions=variant==='session';const result=await callback.GET(callbackRequest(c));assert.match(result.headers.get('location'),/discord=failed/);failSessions=false;}
  assert.equal(reported.length,3);const errors=reported.map(s=>JSON.parse(s.slice('Discord sign-in failed '.length)));
  assert.deepEqual(errors[0],{stage:'token',reason:'http',httpStatus:401,providerError:'invalid_client'});assert.deepEqual(errors[1],{stage:'profile',reason:'identity'});assert.deepEqual(errors[2],{stage:'session',reason:'internal'});
  assert.doesNotMatch(reported.join(' '),/test-one-use-code|test-disposable-access-token|must-never-log|Discord Visitor|private storage diagnostic|test-only-discord-secret/);
 }finally{console.error=original;failSessions=false;resetCalls();}
});
test('transport and non-JSON provider errors are bounded safe diagnostics with no raw response text',async()=>{
 const config=discord.discordConfig(credentials);
 for(const response of [new Response('PRIVATE UPSTREAM CONTENT',{status:403}),Response.json({error:'UNKNOWN_PRIVATE_ERROR',error_description:'SECRET',code:1010},{status:403})]){
  try{await discord.exchangeDiscordIdentity(config,'test-code',auth.randomToken(),async()=>response);assert.fail('expected failure');}catch(error){const details=discord.discordFailureDetails(error,'exchange');assert.equal(details.stage,'token');assert.equal(details.httpStatus,403);assert.ok(!JSON.stringify(details).includes('PRIVATE'));assert.ok(!JSON.stringify(details).includes('SECRET'));}
 }
 try{await discord.exchangeDiscordIdentity(config,'test-code',auth.randomToken(),async()=>{throw Error('SECRET NETWORK DIAGNOSTIC');});assert.fail('expected failure');}catch(error){assert.deepEqual(discord.discordFailureDetails(error,'exchange'),{stage:'token',reason:'transport',httpStatus:undefined,providerError:undefined,providerCode:undefined});}
});
test('same subject/email across providers never merges accounts and Discord deletion cascades only its private data and participation',async()=>{
 const discordToken=await store.createVisitorSession({subject:'123456789012345678',name:'Discord',email:'same@example.test'},null,'discord');
 const googleToken=await store.createVisitorSession({subject:'123456789012345678',name:'Google',email:'same@example.test'},null);
 const dh=new Headers({cookie:auth.sessionCookie+'='+discordToken}),gh=new Headers({cookie:auth.sessionCookie+'='+googleToken}),d=await store.visitorSession(dh),g=await store.visitorSession(gh);assert.notEqual(d.id,g.id);
 const second=await store.createVisitorSession({subject:'123456789012345678',name:'Discord',email:''},null,'discord');
 db.prepare('INSERT INTO visitor_profiles VALUES (?,1,?,1)').run(d.id,JSON.stringify(emptyProfile()));
 db.prepare('INSERT INTO community_reviews VALUES (?,?,?,?,?,?,?,?,1,0,1,1)').run('discord-review','target','entry','member',d.id,'Participant',5,'opinion');
 db.prepare('INSERT INTO community_likes VALUES (?,?,?)').run('like','discord-review',g.id);db.prepare('INSERT INTO community_reports VALUES (?,?,?)').run('report','discord-review',g.id);
 await store.deleteVisitorAccount(dh);assert.equal(await store.visitorSession(new Headers({cookie:auth.sessionCookie+'='+second})),null);assert.equal((await store.visitorSession(gh)).id,g.id);
 for(const table of ['visitor_profiles','community_reviews','community_likes','community_reports'])assert.equal(db.prepare('SELECT COUNT(*) n FROM '+table).get().n,table==='visitor_profiles'?2:0);
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('four-language account UI gates unavailable Discord, names providers honestly and never exposes identity IDs or an empty email row',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const props={locale,user:null},off=renderToStaticMarkup(createElement(Account,props));assert.doesNotMatch(off,/discord-signin-button/);
  const on=renderToStaticMarkup(createElement(Account,{...props,discordOrigin:origin}));assert.ok(on.includes(discordAccountUi[locale].signIn));assert.ok(on.includes(discordAccountUi[locale].separate));assert.doesNotMatch(on,/client_secret|test-only-discord-secret|owner\/analytics/);
  const signed=renderToStaticMarkup(createElement(Account,{locale,user:{name:'<Discord User>',email:'',provider:'discord'}}));assert.ok(signed.includes(discordAccountUi[locale].signedIn));assert.match(signed,/&lt;Discord User&gt;/);assert.doesNotMatch(signed,/class="account-email"|discord-signin-button/);
  if(locale!=='ko')assert.doesNotMatch(on,/[가-힣]/);
 }
});
test('mounted Discord control is idle until clicked and safely recovers from provider and malformed redirect responses',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:origin+'/account'}),previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});const root=createRoot(document.getElementById('root'));let posts=0;
 const network=globalThis.fetch;globalThis.fetch=async(path,options)=>{assert.equal(path,'/api/auth/discord');assert.equal(options.method,'POST');assert.equal(options.headers['X-Gagether-Auth'],'1');assert.deepEqual(JSON.parse(options.body),{locale:'ko',returnTo:'/mobile'});posts++;return posts===1?Response.json({error:'Unavailable'},{status:503}):Response.json({url:'https://evil.example/steal'});};
 try{await act(()=>root.render(createElement(DiscordSignIn,{locale:'ko',returnTo:'/mobile',origin})));assert.equal(posts,0);const button=document.querySelector('button');
  await act(async()=>{button.click();await new Promise(resolve=>setTimeout(resolve,0));});assert.equal(posts,1);assert.ok(document.querySelector('[role=alert]'));assert.equal(button.disabled,false);
  await act(async()=>{button.click();await new Promise(resolve=>setTimeout(resolve,0));});assert.equal(posts,2);assert.equal(button.disabled,false);assert.equal(dom.window.location.origin,origin);
 }finally{await act(()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);globalThis.fetch=network;}
});
test('Google and Discord share a responsive provider group and Google failure leaves Discord available',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:origin+'/account'}),previous={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 let notify,disconnected=false,initializations=0;const renders=[],requests=[];
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true,ResizeObserver:class{constructor(callback){notify=callback}observe(){}disconnect(){disconnected=true}}});
 dom.window.google={accounts:{id:{initialize(options){initializations++;assert.equal(options.nonce,'test-nonce');assert.equal(options.auto_select,false);assert.equal(options.use_fedcm_for_button,true)},renderButton(slot,options){renders.push(options);const button=document.createElement('button');button.textContent='Google';slot.append(button)},disableAutoSelect(){}}}};
 const root=createRoot(document.getElementById('root')),network=globalThis.fetch;let failGoogle=false;
 globalThis.fetch=async(path)=>{requests.push(path);assert.equal(path,'/api/auth/google');return failGoogle?new Response(null,{status:503}):Response.json({clientId:'test-client',nonce:'test-nonce'})};
 try{
  await act(async()=>{root.render(createElement(Account,{locale:'ko',user:null,discordOrigin:origin}));await new Promise(resolve=>setTimeout(resolve,0));});
  const group=document.querySelector('.account-providers'),slot=group.querySelector('.google-signin-slot');assert.equal(group.querySelectorAll('button').length,2);assert.equal(slot.getAttribute('aria-busy'),'false');assert.equal(initializations,1);
  assert.deepEqual(renders[0],{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'rectangular',logo_alignment:'left',locale:'ko',width:260});
  let width=232;Object.defineProperty(slot,'clientWidth',{get:()=>width});await act(()=>notify());assert.equal(renders.at(-1).width,232);width=500;await act(()=>notify());assert.equal(renders.at(-1).width,320);await act(()=>notify());assert.equal(renders.length,3);assert.equal(initializations,1);assert.equal(requests.length,1);
  failGoogle=true;await act(async()=>{root.render(createElement(Account,{locale:'en',user:null,discordOrigin:origin}));await new Promise(resolve=>setTimeout(resolve,0));});
  assert.ok(disconnected);assert.ok(document.querySelector('[role=alert]'));assert.equal(document.querySelector('.discord-signin-button').disabled,false);assert.deepEqual(requests,['/api/auth/google','/api/auth/google']);
 }finally{await act(()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);globalThis.fetch=network;}
});
test('Workers-compatible manual redirect mode fails closed on OAuth redirects without forwarding credentials',async()=>{
 resetCalls();mode='token-redirect';const c=await begin(),r=await callback.GET(callbackRequest(c));assert.match(r.headers.get('location'),/discord=failed/);assert.equal(calls.length,1);assert.equal(calls[0].options.redirect,'manual');assert.ok(!calls.some(c=>c.url.includes('untrusted.example')));assert.ok(!r.headers.getSetCookie().some(s=>s.startsWith(auth.sessionCookie+'=')));
});
test.after(()=>{globalThis.fetch=realFetch;db.close();});
