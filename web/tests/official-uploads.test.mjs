import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {registerHooks} from 'node:module';
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+f,'utf8'));
class Statement{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Statement(this.sql,args)}async all(){return {results:db.prepare(this.sql).all(...this.args)}}async first(){return db.prepare(this.sql).get(...this.args)||null}async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}}
globalThis.uploadEnv={DB:{prepare:s=>new Statement(s),batch:async rows=>{const out=[];for(const r of rows)out.push(await r.run());return out;}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'data:text/javascript,export const env=globalThis.uploadEnv',shortCircuit:true};return n(s,c)}});
const {channelUploads,rssUploads,uploadEntry,uploadKind,recentUploadLabel}=await import('../lib/official-uploads.ts'),{refreshOfficialUploadsStep}=await import('../lib/official-upload-store.ts'),{readBaseData,readData,writeEditorial}=await import('../lib/store.ts'),{recentPVClips}=await import('../components/pv-banner.tsx'),{entrySchema,safeExtras}=await import('../lib/content-schema.ts');
const fixtures=JSON.parse(fs.readFileSync('tests/fixtures/official-upload-listings.json','utf8')),releases=JSON.parse(fs.readFileSync('content/release-additions-20261025.json','utf8')),at='2026-10-25T03:40:00Z';
function html(locale){const f=fixtures[locale];return f.syntax==='json-script'?'<script type="application/json" id="yt-initial-data">'+JSON.stringify(f.data)+'</script>':'var ytInitialData='+JSON.stringify(f.data)+';';}
const channel={platform:'youtube',id:'wuwa-ko-youtube',gameId:'wuwa',locale:'ko',region:'global',name:'명조:워더링 웨이브',url:'https://www.youtube.com/channel/UCKuq0c-RXYaulECSuu5hFug',evidenceUrls:['https://wutheringwaves.kurogames.com/kr/main/news/detail/5572'],official:true,verifiedAt:at,checkedAt:at,status:'ok',posts:[]};
test('actual three-language official listings support both JSON script syntaxes without inventing upload clocks or watched content',()=>{
 for(const l of ['ko','en','ja']){const e=releases.find(e=>e.sourceLocale===l),id=/channel\/(.+)/.exec(e.videos[0].evidenceUrls[0])[1],rows=channelUploads(html(l),id);assert.equal(rows[0].youtubeId,e.videos[0].youtubeId);assert.equal(rows[0].title,e.sourceTitle);assert.equal(rows[0].recent,true);assert.equal(rows[0].publishedAt,undefined);assert.throws(()=>channelUploads(html(l),'UCwrong'),/identity/);}
 const u=channelUploads(html('ko'),'UCKuq0c-RXYaulECSuu5hFug')[0],e=uploadEntry(channel,u,at);assert.equal(e.videos[0].kind,'version');assert.equal(e.videos[0].watched,false);assert.equal(e.videos[0].publishedAt,null);assert.equal(e.videos[0].discoveredAt,at);assert.equal(e.startAt,null);assert.equal(e.endAt,null);assert.equal(uploadKind('신규 코스튬 트레일러 PV'),undefined);assert.equal(uploadKind('캐릭터 PV | 새 인물').kind,'character');assert.equal(uploadKind('공명자 전투 모션 | 쇄명').format,'demo');
 assert.equal(recentUploadLabel('200 hours ago'),false);assert.equal(recentUploadLabel('25 分前'),true);assert.equal(recentUploadLabel('8 days ago'),false);
 assert.equal(uploadEntry(channel,u,'2026-10-26T03:40:00Z',e).verifiedAt,e.verifiedAt);assert.equal(uploadEntry(channel,u,'2026-10-26T03:40:00Z',e).videos[0].discoveredAt,at);
});
test('official RSS binds exact channel/id and preserves its clock; PV cards expire and never create pickup times',()=>{
 const xml='<feed><yt:channelId>UCtrusted</yt:channelId><entry><yt:videoId>abcdefghijk</yt:videoId><yt:channelId>UCtrusted</yt:channelId><title>캐릭터 PV &amp; 소개</title><published>2026-10-25T03:00:00+00:00</published><media:thumbnail url="https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg"/></entry></feed>',rows=rssUploads(xml,'UCtrusted',Date.parse(at));assert.equal(rows[0].title,'캐릭터 PV & 소개');assert.equal(rows[0].publishedAt,'2026-10-25T03:00:00+00:00');assert.throws(()=>rssUploads(xml,'UCwrong'),/identity/);
 const e=uploadEntry(channel,rows[0],at);assert.equal(recentPVClips([e],'ko',Date.parse(at)).length,1);assert.equal(recentPVClips([e],'ko',Date.parse(at)+8*86400000).length,0);assert.equal(recentPVClips([{...e,videos:[{...e.videos[0],publishedAt:null,discoveredAt:undefined}]}],'ko',Date.parse(at)).length,0);
 assert.equal(safeExtras({...e,videos:[{...e.videos[0],thumbnailUrl:'https://evil.test/tracker.png'}]}),false);
 for(const e of releases){assert.equal(entrySchema.safeParse(e).success,true,e.id);assert.equal(safeExtras(e),true,e.id)}
 const cn=releases.find(e=>e.gameId==='arknights');assert.equal(cn.region,'cn');assert.equal(cn.kind,'pickup');assert.equal(cn.startAt,'2026-11-01T12:00:00+08:00');assert.equal(cn.imageKind,'banner');
});
test('bounded automatic upload stage saves and re-reads real SQLite, falls back from RSS, stays idempotent and preserves owner edits and last-good posts on failure',async()=>{
 db.prepare('INSERT INTO official_channels(id,payload,updated_at) VALUES(?,?,?)').run(channel.id,JSON.stringify(channel),at);
 const requests=[],fetcher=async url=>{requests.push(url);if(url.includes('/feeds/'))throw Error('HTTP 500');return html('ko')};
 let r=await refreshOfficialUploadsStep(0,fetcher);assert.equal(r.done,true);assert.equal(r.checks[0].status,'ok');assert.equal(r.checks[0].feedFallback,'HTTP 500');assert.ok(requests.every(u=>u.startsWith('https://www.youtube.com/')));
 const id='official-video-wuwa-ko-3DK6XYB7icE',base=(await readBaseData({id})).entries[0];assert.equal(base.videos[0].publishedAt,null);assert.ok(base.videos[0].discoveredAt);assert.equal(base.startAt,null);
 await writeEditorial('entry:'+id,{title:{ko:'운영자 제목',en:'',ja:'',zh:''}},0,'owner');
 r=await refreshOfficialUploadsStep(0,fetcher);assert.equal(r.checks[0].added,0);assert.equal((await readData()).entries.find(e=>e.id===id).title.ko,'운영자 제목');
 const posts=JSON.parse(db.prepare('SELECT payload FROM official_channels WHERE id=?').get(channel.id).payload).posts;
 r=await refreshOfficialUploadsStep(0,async()=>{throw Error('Source unavailable')});assert.equal(r.checks[0].status,'error');assert.deepEqual(JSON.parse(db.prepare('SELECT payload FROM official_channels WHERE id=?').get(channel.id).payload).posts,posts);assert.equal((await readBaseData({id})).entries[0].videos[0].youtubeId,'3DK6XYB7icE');
});
