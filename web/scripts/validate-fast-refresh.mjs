import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';

// Exercise the actual route/store modules against an isolated SQLite database.
const sql=new DatabaseSync(':memory:');
for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function prepare(query){let args=[];const statement=sql.prepare(query);return {bind(...values){args=values;return this;},async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){return {meta:{changes:Number(statement.run(...args).changes)}};}};}
const media=new Map();
globalThis.__patchworkTest={identity:null,env:{PATCHWORK_EDITOR_EMAILS:'owner@example.test',DB:{prepare,async batch(queries){return Promise.all(queries.map(q=>q.run()));}},BUCKET:{async put(key,body,options){media.set(key,{body,options});},async get(key){const value=media.get(key);return value?{body:value.body,httpEtag:'"fixture"',writeHttpMetadata(headers){headers.set('Content-Type',value.options.httpMetadata.contentType);}}:null;}}}};
const dataUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const modules=new Map();
function loadUrl(file){
 file=path.resolve(file);if(modules.has(file))return modules.get(file);
 let output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 output=output.replace(/from\s+(['"])([^'"]+)\1/g,(_all,_quote,spec)=>{
  if(spec==='./feeds')return 'from '+JSON.stringify(dataUrl('export async function refreshFeeds(){return []}'));
  if(spec==='./fast-notices')return 'from '+JSON.stringify(dataUrl('export const koreanFastSources=[]; export function noticeText(x){return x} export function noticeEntry(){throw Error("unused")}'));
  if(spec==='cloudflare:workers')return 'from '+JSON.stringify(dataUrl('export const env=globalThis.__patchworkTest.env;'));
  if(spec==='@/app/chatgpt-auth')return 'from '+JSON.stringify(dataUrl('export async function getChatGPTUser(){return globalThis.__patchworkTest.identity;}'));
  const target=spec.startsWith('@/')?path.resolve(spec.slice(2)+'.ts'):spec.startsWith('.')?path.resolve(path.dirname(file),spec+'.ts'):null;
  return 'from '+JSON.stringify(target?loadUrl(target):pathToFileURL(import.meta.resolve(spec).replace('file://','')).href);
 });
 const url=dataUrl(output);modules.set(file,url);return url;
}
const mod=file=>import(loadUrl(file));

const {seedEntries}=await mod('lib/seed.ts');
const store=await mod('lib/store.ts');
const fast=await mod('lib/fast-refresh.ts');
const route=await mod('app/api/fast-refresh/route.ts');
assert.equal((await route.POST(new Request('https://gagether.wiki/api/fast-refresh',{method:'POST'}))).status,403);
const base=seedEntries.find(e=>e.gameId==='wuwa');
const at='2026-10-01T00:00:00Z',id='abcdefghijk';
const broadcast={status:'scheduled',youtubeId:id,channel:'Official',locale:'ko',sourceUrl:'https://www.youtube.com/watch?v='+id,announcementUrl:'https://www.youtube.com/watch?v='+id,originalTitle:'Test',announcedAt:null,scheduledAt:'2026-10-18T00:00:00Z',actualStartAt:null,endedAt:null,official:true,metadataVerified:true,watched:false,verifiedAt:at};
await store.saveEntries([{...base,id:'fast-fixture',kind:'update',sourceUrl:broadcast.sourceUrl,verifiedAt:at,broadcast,videos:[{official:true,locale:'ko',evidenceUrls:['https://www.youtube.com/@fixture']}]}]);
const snapshot=sql.prepare("SELECT payload FROM entries WHERE id='fast-fixture'").get().payload;
globalThis.fetch=async (url,options)=>{
 assert.notEqual(options?.redirect,'error','Cloudflare only supports manual/follow redirects');
 if(String(url)==='https://www.youtube.com/@fixture/streams')return new Response('var ytInitialData='+JSON.stringify({metadata:{channelMetadataRenderer:{externalId:'UCfixture'}},videoRenderer:{videoId:id}})+';');
 if(String(url)==='https://www.youtube.com/watch?v='+id)return new Response('var ytInitialPlayerResponse='+JSON.stringify({videoDetails:{videoId:id,channelId:'UCfixture',isLiveContent:true,isUpcoming:true,author:'Official',title:'Test'},playabilityStatus:{status:'LIVE_STREAM_OFFLINE'},microformat:{playerMicroformatRenderer:{liveBroadcastDetails:{startTimestamp:broadcast.scheduledAt}}}})+';');
 throw Error('Fixture blocked source');
};
const first=await fast.runFastRefresh();assert.equal(first.ok,true);
const after=JSON.parse(sql.prepare("SELECT payload FROM entries WHERE id='fast-fixture'").get().payload);
assert.equal(after.verifiedAt,at);assert.equal(after.broadcast.verifiedAt,at);assert.ok(after.broadcast.statusCheckedAt);
const original=JSON.parse(snapshot);delete after.broadcast.statusCheckedAt;assert.deepEqual(after,original);
const status=await (await route.GET()).json();assert.ok(status.lastFinishedAt);
assert.equal((await fast.runFastRefresh()).skipped,true);
// Registry-only discovery, normal redirects, second-slot reservations, and failed listings.
const social=await mod('lib/official-social-store.ts');
const freshId='newstream01',firstId='regularvid1';
await social.saveOfficialChannels([{id:'fixture-channel',gameId:'wuwa',locale:'ko',region:'global',platform:'youtube',official:true,url:'https://www.youtube.com/channel/UCfixture'}]);
sql.prepare("UPDATE refresh_jobs SET last_started_at=NULL,lease_until=0").run();
globalThis.fetch=async(url)=>{
 if(url==='https://www.youtube.com/channel/UCfixture/streams')return new Response(null,{status:302,headers:{location:'https://consent.youtube.com/redirect?continue=https%3A%2F%2Fwww.youtube.com%2F%40official%2Fstreams'}});
 if(String(url).startsWith('https://consent.youtube.com/redirect'))return new Response(null,{status:302,headers:{location:'https://www.youtube.com/@official/streams'}});
 if(url==='https://www.youtube.com/@official/streams')return new Response('var ytInitialData='+JSON.stringify({metadata:{channelMetadataRenderer:{externalId:'UCfixture'}},contents:[{videoRenderer:{videoId:firstId}},{videoRenderer:{videoId:freshId}}]})+';');
 const videoId=new URL(url).searchParams.get('v');
 if([id,freshId].includes(videoId))return new Response('var ytInitialPlayerResponse='+JSON.stringify({videoDetails:{videoId,channelId:'UCfixture',isLiveContent:true,isUpcoming:true,author:'Official',title:videoId===id?'Test':'New broadcast'},playabilityStatus:{status:'LIVE_STREAM_OFFLINE'},microformat:{playerMicroformatRenderer:{liveBroadcastDetails:{startTimestamp:'2026-10-24T00:00:00Z'}}}})+';');
 return new Response('var ytInitialPlayerResponse={"playabilityStatus":{"status":"OK"}};');
};
const second=await fast.runFastRefresh();assert.ok(second.broadcastChecks.some(c=>c.added==='broadcast-wuwa-ko-'+freshId));
const safeFetch=globalThis.fetch;
sql.prepare("UPDATE refresh_jobs SET last_started_at=NULL,lease_until=0").run();
globalThis.fetch=async()=>new Response(null,{status:302,headers:{location:'https://youtube.com.evil.example/steal'}});
const unsafe=await fast.runFastRefresh();assert.ok(unsafe.channelChecks.every(c=>c.status==='error'&&c.error==='Unsupported channel redirect'));
globalThis.fetch=safeFetch;
sql.prepare("UPDATE refresh_jobs SET last_started_at=NULL,lease_until=0").run();
const fetchWatch=globalThis.fetch;globalThis.fetch=async(url)=>String(url).includes('/streams')?new Response('blocked',{status:403}):fetchWatch(url);
const third=await fast.runFastRefresh();assert.ok(third.channelChecks.some(c=>c.status==='error'));assert.ok(third.broadcastChecks.some(c=>c.url.endsWith(id)&&c.persisted));
const visibility=await mod('lib/broadcast-visibility.ts'),{games}=await mod('lib/games.ts');
const now=Date.parse('2026-10-21T10:00:00Z'),future={...broadcast,scheduledAt:'2026-10-24T10:00:00Z',verifiedAt:'2026-10-19T10:00:00Z'};
assert.equal(visibility.broadcastState(future,now),'scheduled','Future confirmed reservations survive a delayed status check');
assert.equal(visibility.broadcastState({...future,status:'live'},now),'inactive','A stale LIVE is not promoted');
assert.equal(visibility.broadcastState({...future,scheduledAt:'2026-10-21T09:00:00Z'},now),'inactive','Past stale reservations are hidden');
assert.equal(visibility.broadcastState({...future,status:'cancelled'},now),'inactive');
const jp={...base,id:'jp-broadcast',gameId:'umamusume',region:'jp',broadcast:{...future,locale:'ja'}};
const game=games.find(g=>g.id==='umamusume');
for(const locale of ['ko','en','ja','zh'])assert.equal(visibility.gameBroadcasts([jp],game,'jp',locale,now).length,1,'Selected JP service keeps its Japanese broadcast');
assert.equal(visibility.gameBroadcasts([jp],game,'kr','ko',now).length,0);
const wuwa=games.find(g=>g.id==='wuwa'),shared={...base,region:'global',broadcast:future};
assert.equal(visibility.gameBroadcasts([shared],wuwa,'global','ko',now).length,1);
for(const locale of ['en','ja','zh'])assert.equal(visibility.gameBroadcasts([shared],wuwa,'global',locale,now).length,0,'Shared service does not fall back to another language');
console.log('PASS: unauthenticated trigger rejected, real SQLite broadcast CAS preserves content/verification, status persisted, overlapping repeat skipped');
console.log('PASS: registry-only second candidate, same-site redirect, status check despite failed listing, reservation freshness, four-language/service isolation');
