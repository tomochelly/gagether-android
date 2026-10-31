import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {generateKeyPair,exportJWK,SignJWT,createLocalJWKSet} from 'jose';
import {renderToStaticMarkup} from 'react-dom/server';
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0006_sudden_dark_phoenix.sql',import.meta.url),'utf8'));db.exec(readFileSync(new URL('../drizzle/0014_quick_daredevil.sql',import.meta.url),'utf8'));
class Statement{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Statement(this.sql,args)}async run(){const result=db.prepare(this.sql).run(...this.args);return {meta:{changes:Number(result.changes)}}}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return {results:db.prepare(this.sql).all(...this.args)}}}
const clientId='123456-test.apps.googleusercontent.com';
globalThis.testVisitorEnv={GOOGLE_SIGN_IN_CLIENT_ID:clientId,DB:{prepare:sql=>new Statement(sql),batch:async statements=>{db.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}}};
globalThis.testVisitorHeaders=new Headers();
registerHooks({resolve(specifier,context,next){if(specifier==='cloudflare:workers')return {url:'test:workers',shortCircuit:true};if(specifier==='next/headers')return {url:'test:headers',shortCircuit:true};return next(specifier,context)},load(url,context,next){if(url==='test:workers')return {format:'module',source:'export const env=globalThis.testVisitorEnv',shortCircuit:true};if(url==='test:headers')return {format:'module',source:'export async function headers(){return globalThis.testVisitorHeaders} export async function cookies(){return new Map()}',shortCircuit:true};return next(url,context)}});
const {privateKey,publicKey}=await generateKeyPair('RS256');const jwk={...await exportJWK(publicKey),kid:'test-key',alg:'RS256',use:'sig'};
const originalFetch=globalThis.fetch;globalThis.fetch=async url=>{assert.equal(String(url),'https://www.googleapis.com/oauth2/v3/certs');return Response.json({keys:[jwk]})};
const auth=await import('../lib/google-login.ts');
const google=await import('../app/api/auth/google/route.ts');
const session=await import('../app/api/auth/session/route.ts');
const {default:Account}=await import('../app/account/page.tsx');
const token=async(nonce,extra={},key=privateKey)=>new SignJWT({nonce,email:'visitor@example.test',email_verified:true,name:'<Visitor>',...extra}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer('https://accounts.google.com').setAudience(clientId).setSubject('google-subject-1').setIssuedAt().setExpirationTime('5m').sign(key);
const req=(path,{cookie='',body,origin='https://gagether.wiki',method='GET'}={})=>new Request('https://gagether.wiki'+path,{method,headers:{'Origin':origin,'Cookie':cookie,'X-Gagether-Auth':'1','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
const challenge=async()=>{const r=await google.GET(req('/api/auth/google'));assert.equal(r.status,200);return {data:await r.json(),cookie:r.headers.get('set-cookie').split(';')[0]}};
const signIn=async()=>{const c=await challenge();const r=await google.POST(req('/api/auth/google',{method:'POST',cookie:c.cookie,body:{nonce:c.data.nonce,credential:await token(c.data.nonce)}}));assert.equal(r.status,200);return {cookie:r.headers.getSetCookie().find(s=>s.startsWith(auth.sessionCookie+'=')).split(';')[0],response:r,c}};
test('real route flow creates an opaque Google session, rejects replay, and logs out',async()=>{
 const {cookie,response,c}=await signIn();
 assert.match(response.headers.getSetCookie()[0],/HttpOnly; Secure; SameSite=Lax/);
 assert.match(response.headers.get('cache-control'),/no-store/);
 const row=db.prepare('SELECT * FROM visitor_sessions').get();assert.notEqual(row.token_hash,cookie.split('=')[1]);
 const me=await session.GET(req('/api/auth/session',{cookie}));assert.deepEqual(await me.json(),{user:{name:'<Visitor>',email:'visitor@example.test',provider:'google'}});
 const replay=await google.POST(req('/api/auth/google',{method:'POST',cookie:c.cookie,body:{nonce:c.data.nonce,credential:await token(c.data.nonce)}}));assert.equal(replay.status,401);
 const attack=await session.POST(req('/api/auth/session',{cookie,method:'POST',origin:'https://evil.example',body:{action:'logout'}}));assert.equal(attack.status,403);
 const logout=await session.POST(req('/api/auth/session',{cookie,method:'POST',body:{action:'logout'}}));assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 assert.deepEqual(await (await session.GET(req('/api/auth/session',{cookie}))).json(),{user:null});
});
test('expired/forged sessions and absent/different challenge cookies fail closed',async()=>{
 const c=await challenge(),credential=await token(c.data.nonce);
 for(const cookie of ['',auth.loginCookie+'='+auth.randomToken()])assert.equal((await google.POST(req('/api/auth/google',{method:'POST',cookie,body:{nonce:c.data.nonce,credential}}))).status,401);
 assert.equal((await google.POST(req('/api/auth/google',{method:'POST',cookie:c.cookie,origin:'https://evil.example',body:{nonce:c.data.nonce,credential}}))).status,403);
 const signed=await signIn();db.prepare('UPDATE visitor_sessions SET expires_at=0').run();assert.deepEqual(await (await session.GET(req('/api/auth/session',{cookie:signed.cookie}))).json(),{user:null});
});
test('signature, audience, issuer, nonce, expiry and email verification are enforced',async()=>{
 const key=createLocalJWKSet({keys:[jwk]}),nonce=auth.randomToken();
 assert.equal((await auth.verifyGoogleCredential(await token(nonce),clientId,nonce,key)).subject,'google-subject-1');
 await assert.rejects(()=>auth.verifyGoogleCredential(tokenValue,clientId,nonce,key));
 async function signed(claims){return new SignJWT({sub:'subject',iss:'https://accounts.google.com',aud:clientId,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+300,email:'a@example.test',email_verified:true,nonce,...claims}).setProtectedHeader({alg:'RS256',kid:'test-key'}).sign(privateKey)}
 const bad=[{aud:'another-client'},{iss:'https://evil.example'},{nonce:'wrong'},{exp:1},{email_verified:false},{iat:Math.floor(Date.now()/1000)+600}];
 for(const claims of bad){const value=await signed(claims);await assert.rejects(()=>auth.verifyGoogleCredential(value,clientId,nonce,key));}
 const wrong=await generateKeyPair('RS256');await assert.rejects(async()=>auth.verifyGoogleCredential(await token(nonce,{},wrong.privateKey),clientId,nonce,key));
});
const tokenValue='forged.jwt.token';
test('visitor pages use Google without ChatGPT and escape only their own profile',async()=>{
 globalThis.testVisitorHeaders=new Headers();
 let html=renderToStaticMarkup(await Account({searchParams:Promise.resolve({locale:'ko',returnTo:'/mobile'})}));
 assert.match(html,/Google 계정으로/);assert.match(html,/href="\/mobile"/);assert.doesNotMatch(html,/signin-with-chatgpt|owner\/analytics/);
 const {cookie}=await signIn();globalThis.testVisitorHeaders=new Headers({cookie});
 html=renderToStaticMarkup(await Account({searchParams:Promise.resolve({locale:'en',returnTo:'https://evil.example'})}));
 assert.match(html,/&lt;Visitor&gt;/);assert.match(html,/Signed in with Google/);assert.doesNotMatch(html,/google-subject-1|evil.example|signin-with-chatgpt/);
 const removed=await session.POST(req('/api/auth/session',{cookie,method:'POST',body:{action:'delete-account'}}));assert.equal(removed.status,200);assert.equal(db.prepare('SELECT COUNT(*) n FROM visitor_accounts').get().n,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM visitor_sessions').get().n,0);
 globalThis.fetch=originalFetch;
});
