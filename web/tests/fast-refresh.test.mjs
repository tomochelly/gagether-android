import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {readBroadcast,channelVideos}=await import('../lib/broadcast-metadata.ts');
const {parseEndfield,parseNte,parseSteam,noticeEntry,noticeText}=await import('../lib/fast-notices.ts');
const {verifyRefreshIdentity,refreshAudience,refreshWorkflow}=await import('../lib/refresh-identity.ts');
const at='2026-10-17T12:00:00Z';
function page(overrides={}){return 'var ytInitialPlayerResponse = '+JSON.stringify({playabilityStatus:{status:'LIVE_STREAM_OFFLINE'},videoDetails:{videoId:'abcdefghijk',channelId:'trusted',author:'Official',title:'Official program',isLiveContent:true,isUpcoming:true},microformat:{playerMicroformatRenderer:{liveBroadcastDetails:{startTimestamp:'2026-10-24T09:30:00Z',isLiveNow:false}}},...overrides})+';';}
test('future reservation and old reservation clock never imply LIVE',()=>{const b=readBroadcast(page(),'abcdefghijk','trusted','ko',at);assert.equal(b.status,'scheduled');assert.equal(readBroadcast(page(),'abcdefghijk','trusted','ko','2026-10-25T12:00:00Z').status,'scheduled');assert.equal(b.actualStartAt,null);});
test('wrong channel, login wall, missing metadata and premiere fail closed',()=>{assert.equal(readBroadcast(page(),'abcdefghijk','other','ko',at),null);for(const overrides of [{playabilityStatus:{status:'LOGIN_REQUIRED'}},{microformat:null},{videoDetails:{videoId:'abcdefghijk',channelId:'trusted',isLiveContent:false}}])assert.equal(readBroadcast(page(overrides),'abcdefghijk','trusted','ko',at),null);});
test('status-only checks preserve content verification and main program time',()=>{const old=readBroadcast(page(),'abcdefghijk','trusted','ko',at);old.programStartAt='2026-10-24T10:00:00Z';const next=readBroadcast(page(),'abcdefghijk','trusted','ko','2026-10-17T12:10:00Z',old);assert.equal(next.verifiedAt,old.verifiedAt);assert.equal(next.statusCheckedAt,'2026-10-17T12:10:00Z');assert.equal(next.programStartAt,old.programStartAt);});
test('explicit end metadata ends a stream; planned end is not synthesized',()=>{const s=page({playabilityStatus:{status:'OK'},microformat:{playerMicroformatRenderer:{liveBroadcastDetails:{startTimestamp:at,endTimestamp:'2026-10-17T13:00:00Z',isLiveNow:false}}}});assert.equal(readBroadcast(s,'abcdefghijk','trusted','ko','2026-10-17T13:10:00Z').status,'ended');});
test('minimal notices do not create gameplay dates or foreign official localization',()=>{const e=noticeEntry({id:'123',gameId:'nte',region:'global',locale:'ko',title:'공식 공지',url:'https://nte.perfectworld.com/kr/article/news/gamenews/20261017/123.html',publishedAt:'2026-10-17'},at);assert.equal(e.startAt,null);assert.equal(e.endAt,null);assert.equal(e.image,undefined);assert.deepEqual(e.officialLocales,['ko']);assert.notEqual(e.title.en,e.title.ko);});
test('plain API headlines retain angle-bracket work names and normalize encoded emoji',()=>{
 const n={id:'123',gameId:'trickcal',region:'kr',locale:'ko',title:'테마극장 <작품의 이름> 안내 &#128226;',url:'https://game.naver.com/lounge/Trickcal/board/detail/123',publishedAt:'2026-10-20'};
 const e=noticeEntry(n,at);assert.equal(e.sourceTitle,'테마극장 <작품의 이름> 안내 📢');assert.equal(e.title.ko,e.sourceTitle);
 assert.equal(noticeText(e.sourceTitle),noticeText(n.title));assert.notEqual(noticeText(e.sourceTitle),noticeText(n.title.replace('안내','변경 안내')));
});
test('HTML and RSS parsing retain escaped or CDATA work names without double stripping',()=>{
 const [html]=parseNte('<a href="/kr/article/news/gamenews/20261020/123.html"><h2><span>이벤트</span> &lt;작품명&gt;</h2>2026-10-20</a>');
 assert.equal(html.title,'이벤트 <작품명>');assert.equal(noticeEntry(html,at).sourceTitle,html.title);
 const [rss]=parseSteam('<item><title><![CDATA[콜라보 <파트너> 안내]]></title><link>https://steamcommunity.com/games/3308670/announcements/detail/123</link><pubDate>Tue, 20 Oct 2026 12:00:00 GMT</pubDate></item>','kr','ko');
 assert.equal(rss.title,'콜라보 <파트너> 안내');assert.equal(rss.publishedAt,'2026-10-20T12:00:00.000Z');
});
const b64=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
test('OIDC requires trusted signature, repository identity, workflow, audience and unexpired claims',async()=>{
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'test'};const now=Date.now(),sec=Math.floor(now/1000);
 const claims={iss:'https://token.actions.githubusercontent.com',aud:refreshAudience,repository_id:'1422741334',repository_owner_id:'343730239',repository:'tomochelly/gagether-android',ref:'refs/heads/main',workflow_ref:refreshWorkflow,event_name:'schedule',iat:sec,nbf:sec,exp:sec+300};
 const token=async c=>{const s=b64({alg:'RS256',typ:'JWT',kid:'test'})+'.'+b64(c);return s+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(s))).toString('base64url');};
 const fetcher=async()=>Response.json({keys:[jwk]});assert.equal(await verifyRefreshIdentity(await token(claims),fetcher,now),true);
 for(const patch of [{repository_id:'attacker'},{repository_owner_id:'attacker'},{aud:'other'},{ref:'refs/pull/1/merge'},{workflow_ref:'other'},{event_name:'pull_request'},{exp:sec-1}])assert.equal(await verifyRefreshIdentity(await token({...claims,...patch}),fetcher,now),false);
 const valid=await token(claims);assert.equal(await verifyRefreshIdentity(valid.slice(0,-12)+'invalid',fetcher,now),false);
});
