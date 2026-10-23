import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';

// Exercise the actual route/store modules against an isolated SQLite database.
const sql=new DatabaseSync(':memory:');
for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync('drizzle/'+file,'utf8'));
function prepare(query){let args=[];const statement=sql.prepare(query);return {bind(...values){args=values;return this;},async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){const before=Number(sql.prepare('SELECT total_changes() AS n').get().n);statement.run(...args);return {meta:{changes:Number(sql.prepare('SELECT total_changes() AS n').get().n)-before}};}};}
const media=new Map();
globalThis.__patchworkTest={identity:null,env:{PATCHWORK_EDITOR_EMAILS:'owner@example.test',DB:{prepare,async batch(queries){return Promise.all(queries.map(q=>q.run()));}},BUCKET:{async put(key,body,options){media.set(key,{body,options});},async head(key){const v=media.get(key);return v?{size:v.body.byteLength,customMetadata:v.options.customMetadata}:null;},async get(key){const value=media.get(key);return value?{body:value.body,size:value.body.byteLength,customMetadata:value.options.customMetadata,httpEtag:'"fixture"',writeHttpMetadata(headers){headers.set('Content-Type',value.options.httpMetadata.contentType);}}:null;}}}};
const dataUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const modules=new Map();
function loadUrl(file){
 file=path.resolve(file);if(modules.has(file))return modules.get(file);
 if(file.endsWith('.json.ts'))return dataUrl('export default '+(file.endsWith('/ops/assets-manifest.json.ts')&&globalThis.__patchworkTest.assetManifest?JSON.stringify(globalThis.__patchworkTest.assetManifest):fs.readFileSync(file.slice(0,-3),'utf8'))+';');
 let output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 output=output.replace(/with\s*\{\s*type:\s*["']json["']\s*\}/g,'');
 output=output.replace(/from\s+(['"])([^'"]+)\1/g,(_all,_quote,spec)=>{
  if(spec.startsWith('node:'))return 'from '+JSON.stringify(spec);
  if(spec==='vinext/server/fetch-handler')return 'from '+JSON.stringify(dataUrl('export default {fetch(){throw Error("Static framework handler must not receive catalog assets")}};'));
  if(spec==='cloudflare:workers')return 'from '+JSON.stringify(dataUrl('export const env=globalThis.__patchworkTest.env;'));
  if(spec==='@/app/chatgpt-auth')return 'from '+JSON.stringify(dataUrl('export async function getChatGPTUser(){return globalThis.__patchworkTest.identity;}'));
  const target=spec.startsWith('@/')?path.resolve(spec.slice(2)+'.ts'):spec.startsWith('.')?path.resolve(path.dirname(file),spec+'.ts'):null;
  return 'from '+JSON.stringify(target?loadUrl(target):pathToFileURL(import.meta.resolve(spec).replace('file://','')).href);
 });
 const url=dataUrl(output);modules.set(file,url);return url;
}
const mod=file=>import(loadUrl(file));
const {seedEntries}=await mod('lib/seed.ts');const {games}=await mod('lib/games.ts');
const store=await mod('lib/store.ts');const editorial=await mod('lib/editorial.ts');const presentation=await mod('lib/presentation.ts');const {spotlightSlides}=await mod('lib/spotlight.ts');
const editor=await mod('app/api/editor/route.ts');const session=await mod('app/api/editor/session/route.ts');const upload=await mod('app/api/editor/upload/route.ts');const image=await mod('app/api/media/[file]/route.ts');
const {editRequest,settingsSchema}=await mod('lib/editor-schema.ts');const {safeImage}=await mod('lib/content-schema.ts');
const origin='https://patchwork.example.test';
const request=(body,method='POST',extra={})=>new Request(origin+'/api/editor',{method,headers:{Origin:origin,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
const save=body=>editor.POST(request(body));
const fixture=seedEntries.find(e=>e.id==='wuwa-hsin');
assert.equal((await session.GET()).status,200);assert.equal((await (await session.GET()).json()).canEdit,false);
assert.equal((await save({})).status,403);
globalThis.__patchworkTest.identity={userId:'viewer-fixture',email:'viewer@example.test'};
assert.equal((await save({})).status,403);
globalThis.__patchworkTest.identity={userId:'owner-fixture',email:'OWNER@example.test'};
assert.equal((await (await session.GET()).json()).canEdit,true);
assert.equal(editorial.isEditorIdentity(null,'owner@example.test'),false);
assert.equal(editorial.isEditorIdentity({userId:'x',email:'owner@example.test.evil'},'owner@example.test'),false);
assert.equal((await editor.POST(request({},'POST',{Origin:'https://other.example.test'}))).status,403);
assert.equal((await editor.POST(request({},'POST',{'Sec-Fetch-Site':'cross-site'}))).status,403);

const title={...fixture.title,ko:'직접 편집한 픽업'};
let response=await save({target:'entry',id:fixture.id,revision:0,changes:{title}});assert.equal(response.status,200);
let data=await response.json();let entry=data.entries.find(e=>e.id===fixture.id);assert.equal(entry.title.ko,title.ko);assert.equal(entry.title.ja,fixture.title.ja);assert.equal(entry.editor.revision,1);
assert.equal((await save({target:'entry',id:fixture.id,revision:0,changes:{title:fixture.title}})).status,409);
const incoming={...fixture,title:{...fixture.title,ko:'자동 수집 이름'},summary:{...fixture.summary,ko:'새로 확인한 공식 설명'},verifiedAt:new Date().toISOString()};
await store.saveEntries([incoming]);entry=(await store.readData()).entries.find(e=>e.id===fixture.id);assert.equal(entry.title.ko,title.ko);assert.equal(entry.summary.ko,incoming.summary.ko);
assert.equal((await store.readData({automatic:true})).entries.find(e=>e.id===fixture.id).title.ko,fixture.title.ko);
response=await save({target:'entry',id:fixture.id,revision:1,changes:{price:{amount:1000,currency:'KRW',platform:'Test store'},marketRegion:'kr'}});assert.equal(response.status,200);
response=await save({target:'entry',id:fixture.id,revision:2,changes:{},removeFields:['price','marketRegion']});assert.equal(response.status,200);entry=(await response.json()).entries.find(e=>e.id===fixture.id);assert.equal(entry.price,undefined);assert.equal(entry.marketRegion,undefined);
assert.equal(editRequest.safeParse({target:'entry',id:fixture.id,revision:3,changes:{},removeFields:['title']}).success,false);
assert.equal((await save({target:'entry',id:fixture.id,revision:3,changes:{region:'cn'}})).status,400);
assert.equal((await save({target:'entry',id:fixture.id,revision:3,changes:{image:'javascript:alert(1)'}})).status,400);
assert.equal((await save({target:'entry',id:fixture.id,revision:3,changes:{sourceUrl:'https://name:password@example.test/'}})).status,400);
assert.equal((await save({target:'entry',id:fixture.id,revision:3,changes:{startAt:'2026-10-01T00:00:00Z',endAt:'2020-01-01T00:00:00Z'}})).status,400);
assert.equal((await save({target:'entry',id:fixture.id,revision:3,changes:{price:{amount:100,currency:'KRW',platform:''}}})).status,400);
response=await save({target:'entry',id:fixture.id,revision:3,changes:{hidden:true}});assert.equal(response.status,200);assert.ok(!(await store.readData()).entries.some(e=>e.id===fixture.id));assert.ok((await store.readData({includeHidden:true})).entries.some(e=>e.id===fixture.id));
response=await editor.DELETE(request({target:'entry',id:fixture.id,revision:4},'DELETE'));assert.equal(response.status,200);entry=(await store.readData()).entries.find(e=>e.id===fixture.id);assert.equal(entry.title.ko,fixture.title.ko);assert.equal(entry.editor,undefined);

const custom={...fixture,id:'custom-fixture',title:{...fixture.title,ko:'수동 항목'}};delete custom.verifiedAt;
response=await save({target:'entry',id:custom.id,revision:0,changes:Object.fromEntries(Object.entries(custom).filter(([key])=>key!=='id')),create:true});assert.equal(response.status,200);
await store.saveEntries([{...fixture,id:custom.id}]);assert.equal((await store.readData()).entries.find(e=>e.id===custom.id).title.ko,'수동 항목');
response=await editor.DELETE(request({target:'entry',id:custom.id,revision:1},'DELETE'));assert.equal(response.status,200);assert.ok(!(await store.readData()).entries.some(e=>e.id===custom.id));

response=await save({target:'site',revision:0,changes:{brand:{name:'PATCHWORK TEST'},carouselSeconds:8,ui:{ko:{pickup:'모집'}},games:{wuwa:{name:{...games[0].name,ko:'게임 표시명'}}}}});assert.equal(response.status,200);data=await response.json();assert.equal(editorial.catalogUi('ko',data.settings).pickup,'모집');assert.equal(editorial.catalogGames(data.settings)[0].name.ko,'게임 표시명');assert.equal(data.settingsRevision,1);
assert.equal((await save({target:'site',revision:0,changes:{}})).status,409);
assert.equal(settingsSchema.safeParse({ui:{ko:{unknownKey:'invalid'}}}).success,false);
assert.equal(settingsSchema.safeParse({games:{wuwa:{official:'javascript:alert(1)'}}}).success,false);
assert.equal((await editor.DELETE(request({target:'site',revision:1},'DELETE'))).status,200);assert.deepEqual((await store.readData()).settings,{});
const siteNotices=[{id:'reviewed-notice',title:{ko:'공지',en:'Notice',ja:'お知らせ',zh:'公告'},body:{ko:'본문',en:'Body',ja:'本文',zh:'正文'},publishedDate:'2026-10-23',href:'/download'}];
response=await save({target:'site',revision:0,changes:{announcements:siteNotices,announcementSeconds:7}});assert.equal(response.status,200);data=await response.json();assert.deepEqual(data.settings.announcements,siteNotices);assert.equal(data.settings.announcementSeconds,7);assert.equal((await save({target:'site',revision:0,changes:{announcements:[]}})).status,409);assert.equal((await editor.DELETE(request({target:'site',revision:1},'DELETE'))).status,200);
// Owner studio: real schema, persisted placement/rewards, scoped settings CAS and history.
const studioFixture=seedEntries.find(e=>e.gameId==='wuwa'&&e.kind==='event');
assert.ok(studioFixture);
assert.ok(seedEntries.filter(e=>['pickup','weapon'].includes(e.kind)).every(e=>!e.rewards?.length&&!Object.values(e.rewardNote||{}).some(Boolean)));
const studioPrevious=await store.readEntry(studioFixture.id);
assert.equal((await save({target:'entry',id:fixture.id,revision:0,changes:{rewards:[{name:fixture.title,sourceKind:'official',sourceUrl:fixture.sourceUrl}]}})).status,400);
const studioFrame={x:72,y:44,zoom:.35,fit:'contain'};
const studioReward={rewardId:'wuwa-astrite',category:'gacha-currency',name:{ko:'별의 소리',en:'Astrite',ja:'星声',zh:'星声'},quantity:'1600',acquisition:'conditional',note:{ko:'로그인 7일',en:'Log in 7 days',ja:'7日ログイン',zh:'登录7天'},sourceUrl:studioFixture.sourceUrl,sourceKind:'official'};
response=await editor.POST(new Request(origin+'/api/editor?view=entry',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({target:'entry',id:studioFixture.id,revision:0,changes:{imageFraming:{banner:studioFrame,card:{...studioFrame,x:50}},rewards:[studioReward]}})}));assert.equal(response.status,200);const studioSaved=(await response.json()).entry;assert.deepEqual(studioSaved.imageFraming.banner,studioFrame);assert.equal(studioSaved.image,studioFixture.image);assert.equal(studioSaved.verifiedAt,studioPrevious.verifiedAt);assert.equal(studioSaved.rewards[0].quantity,'1600');
assert.deepEqual((await (await editor.GET(new Request(origin+'/api/editor?id='+studioFixture.id))).json()).entry.imageFraming.banner,studioFrame);
await store.saveEntries([{...studioFixture,summary:{...studioFixture.summary,ko:'New source text'}}]);assert.deepEqual((await store.readEntry(studioFixture.id,{requirePersistent:true})).imageFraming.banner,studioFrame);assert.equal((await store.readEntry(studioFixture.id)).rewards[0].quantity,'1600');
assert.equal((await save({target:'entry',id:studioFixture.id,revision:1,changes:{imageFraming:{card:{...studioFrame,zoom:-1}}}})).status,400);
assert.equal((await editor.DELETE(request({target:'entry',id:studioFixture.id,revision:1},'DELETE'))).status,200);
response=await editor.GET(new Request(origin+'/api/editor?view=settings'));assert.equal(response.status,200);assert.equal((await response.json()).entries,undefined);
const layoutSettings={brand:{name:'Preserved brand'},announcements:siteNotices,layout:{game:['events','calendar','content'],overview:['news','calendar']}};
response=await editor.POST(new Request(origin+'/api/editor?view=settings',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({target:'site',revision:0,changes:layoutSettings})}));assert.equal(response.status,200);data=await response.json();assert.deepEqual(data.settings,layoutSettings);assert.equal(data.entries,undefined);assert.equal(data.settingsRevision,1);
assert.equal((await save({target:'site',revision:0,changes:{}})).status,409);assert.equal((await save({target:'site',revision:1,changes:{layout:{game:['calendar','calendar']}}})).status,400);
const studioHistory=await mod('app/api/editor/history/route.ts');const historyBefore=(await (await studioHistory.GET(new Request(origin+'/api/editor/history?target=site'))).json()).history;assert.ok(historyBefore.length);assert.ok(historyBefore.every(row=>row.key==='site'));
response=await studioHistory.POST(request({seq:historyBefore[0].seq,side:'before',revision:1}));assert.equal(response.status,200);assert.deepEqual((await store.readSiteSettings()).settings,{});
console.log(JSON.stringify({ownerStudio:{imageFramingSaved:true,nativeOriginalUnchanged:true,rewardQuantitySaved:true,automaticRefreshPreservesOwner:true,scopedSettingsReadback:true,layoutRevisionConflict:true,layoutHistoryRestore:true}}));
assert.equal(safeImage('/api/media/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp'),true);assert.equal(safeImage('/assets/../../bad.svg'),false);assert.equal(safeImage('data:image/svg+xml,x'),false);
const badForm=new FormData();badForm.append('image',new File(['<svg/>'],'bad.png',{type:'image/png'}));assert.equal((await upload.POST(new Request(origin+'/api/editor/upload',{method:'POST',headers:{Origin:origin},body:badForm}))).status,400);
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=','base64');const form=new FormData();form.append('image',new File([bytes],'fixture.png',{type:'image/png'}));
response=await upload.POST(new Request(origin+'/api/editor/upload',{method:'POST',headers:{Origin:origin},body:form}));assert.equal(response.status,200);const uploaded=await response.json();assert.ok(safeImage(uploaded.url));
response=await image.GET(new Request(origin+uploaded.url),{params:Promise.resolve({file:uploaded.url.split('/').at(-1)})});assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/png');assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);

// Exact catalog asset migration is isolated from private editor media.
globalThis.__patchworkTest.assetManifest=[{path:'public/assets/test-original.png',url:origin+'/assets/test-original.png',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}];
const assetStore=await mod('app/api/asset-storage/route.ts'),assetRead=await mod('app/assets/[...file]/route.ts');
const {catalogAssets}=await mod('lib/catalog-assets.ts');const a=catalogAssets[0],assetBytes=bytes;
const assetRequest=(path,body,originHeader=origin)=>new Request(origin+'/api/asset-storage?path='+encodeURIComponent(path),{method:'POST',headers:{Origin:originHeader},body});
globalThis.__patchworkTest.identity=null;assert.equal((await assetStore.POST(assetRequest(a.path,assetBytes))).status,403);
globalThis.__patchworkTest.identity={userId:'owner-fixture',email:'owner@example.test'};
assert.equal((await assetStore.POST(assetRequest(a.path,assetBytes,'https://other.example.test'))).status,403);
assert.equal((await assetStore.POST(assetRequest('assets/../../editor/private.png',assetBytes))).status,400);
assert.equal((await assetStore.POST(assetRequest(a.path,new Uint8Array([1,2])))).status,400);
assert.equal((await assetStore.POST(assetRequest(a.path,assetBytes))).status,200);
const assetParams={params:Promise.resolve({file:a.path.replace(/^assets\//,'').split('/')})};
response=await assetRead.GET(new Request(origin+'/'+a.path),assetParams);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),assetBytes);
response=await assetRead.GET(new Request(origin+'/'+a.path,{headers:{'If-None-Match':'"'+a.sha256+'"'}}),assetParams);assert.equal(response.status,304);
assert.equal((await assetStore.GET(new Request(origin+'/api/asset-storage?offset=-1'))).status,400);
assert.equal((await (await assetStore.GET(new Request(origin+'/api/asset-storage'))).json()).assets[0].ready,true);
const worker=await mod('build/sites-worker.ts');
const workerAsset=await worker.default.fetch(new Request(origin+'/'+a.path),globalThis.__patchworkTest.env,{props:{}});assert.equal(workerAsset.status,200);assert.deepEqual(new Uint8Array(await workerAsset.arrayBuffer()),new Uint8Array(bytes));
assert.equal((await worker.default.fetch(new Request(origin+'/'+a.path,{method:'HEAD'}),globalThis.__patchworkTest.env,{props:{}})).headers.get('Content-Length'),String(bytes.byteLength));
console.log(JSON.stringify({catalogAssetOriginalHash:true,unchangedURLs:true,privateMediaIsolation:true}));

// Persisted collection review cannot publish a title as completed detail or acknowledge stale evidence.
const {captureDocument,reviewQueue}=await mod('lib/collection-store.ts');const reviewRoute=await mod('app/api/collection/route.ts');
const notice={id:'fixture',gameId:fixture.gameId,region:fixture.region,locale:'ko',url:fixture.sourceUrl,title:'공식 픽업 본문',publishedAt:null};
const html='<p>'+('공식 안내 본문과 참여 조건. '.repeat(25))+'</p><img src="https://publisher.example.test/exact.png">';
const doc=await captureDocument(notice,html,'2026-10-23T00:00:00Z');assert.equal(doc.status,'pending');assert.equal(doc.sourceAccess,'body');
globalThis.__patchworkTest.identity=null;assert.equal((await reviewRoute.GET(new Request(origin+'/api/collection'))).status,403);
globalThis.__patchworkTest.identity={userId:'owner-fixture',email:'owner@example.test'};
const receipt={action:'reviewed',id:doc.id,bodyHash:doc.bodyHash,entryIds:[fixture.id]};
assert.equal((await reviewRoute.POST(request({...receipt,bodyHash:'0'.repeat(64)}))).status,409);
assert.equal((await reviewRoute.POST(request({...receipt,entryIds:['missing-entry']}))).status,400);
assert.equal((await reviewRoute.POST(request(receipt))).status,200);
const reviewed=(await reviewQueue()).find(d=>d.id===doc.id),beforeStamp=reviewed.verifiedAt;
assert.equal((await (await reviewRoute.POST(request(receipt))).json()).unchanged,true);
await captureDocument(notice,html,'2026-10-24T00:00:00Z');assert.equal((await reviewQueue()).find(d=>d.id===doc.id).verifiedAt,beforeStamp);
await captureDocument(notice,html+'<p>Changed official condition</p>','2026-10-25T00:00:00Z');assert.equal((await reviewQueue()).find(d=>d.id===doc.id).status,'pending');
assert.equal((await reviewRoute.POST(request(receipt))).status,409);
await captureDocument(notice,undefined,'2026-10-26T00:00:00Z','HTTP 403');const failedDoc=(await reviewQueue()).find(d=>d.id===doc.id);assert.equal(failedDoc.sourceAccess,'blocked');assert.equal(failedDoc.images.length,1);assert.equal(failedDoc.verifiedAt,beforeStamp);
assert.equal((await reviewRoute.POST(request({...receipt,bodyHash:failedDoc.bodyHash}))).status,400);
console.log(JSON.stringify({reviewQueuePersists:true,staleEvidenceRejected:true,originalAccessSeparate:true,unchangedVerificationPreserved:true}));

const now=Date.parse('2026-10-16T12:00:00Z');const wuwa=spotlightSlides(seedEntries,now,'wuwa');assert.equal(wuwa.length,3);assert.deepEqual(new Set(wuwa.map(s=>s.entry.id)),new Set(['wuwa-hsin','wuwa-chisa','wuwa-iuno']));assert.ok(wuwa.every(s=>s.art.imageKind==='splash'));
assert.equal(spotlightSlides(seedEntries,now,'zzz').length,2);
const gfl=spotlightSlides(seedEntries.filter(e=>e.region==='kr'),now,'gfl2');assert.equal(gfl.length,3);assert.ok(gfl.every(s=>s.art.pickupMembers.every(m=>m.role!=='rate-up')));
const ark=spotlightSlides(seedEntries.filter(e=>e.region==='global'),now,'arknights');assert.ok(ark.length>=2);assert.ok(ark.every(s=>s.art.pickupMembers.every(m=>m.role!=='rate-up'))); // Include distinct standard/kernel pools; secondary rate-ups are not headliners.
assert.equal(spotlightSlides([{...fixture,featured:false}],now,'wuwa').length,1);
assert.equal(presentation.entrySource({...fixture,localizationSources:{ko:'https://example.test/old-naming-proof'}},'ko'),fixture.sourceUrl);
assert.ok(!editorial.applyEditorial([{...fixture,region:'cn'}],[]).length);
assert.deepEqual(games.filter(g=>g.regions.includes('cn')).map(g=>g.id).sort(),['arknights','gfl2','reverse1999']);assert.ok(editorial.catalogUi('zh',{}).pickup);
// New media survives automatic refresh and rejects forged video/icon references.
const {entrySchema,safeExtras}=await mod('lib/content-schema.ts');
const {collectVideos,youtubeIdFrom}=await mod('lib/videos.ts');
const clip={youtubeId:'aBcDeFgHiJk',kind:'character',format:'pv',title:fixture.title,locale:'ko',channel:'Test fixture',sourceUrl:'https://www.youtube.com/watch?v=aBcDeFgHiJk',verifiedAt:new Date().toISOString(),official:true,metadataVerified:true,watched:false};
const enriched={...fixture,videos:[clip],rewards:[{name:fixture.title,sourceUrl:fixture.sourceUrl,sourceKind:'official'}],rewardNote:fixture.summary};
assert.equal(entrySchema.safeParse(enriched).success,true);assert.equal(safeExtras(enriched),true);
assert.equal(safeExtras({...enriched,videos:[{...clip,sourceUrl:'https://youtube.com.evil.test/watch?v=aBcDeFgHiJk'}]}),false);
assert.equal(safeExtras({...enriched,videos:[{...clip,sourceUrl:'https://www.youtube.com/watch?v=differentID'}]}),false);
assert.equal(safeExtras({...enriched,rewards:[{...enriched.rewards[0],icon:{image:'javascript:alert(1)',imageSource:fixture.sourceUrl,width:30,height:30,verifiedAt:clip.verifiedAt}}]}),false);
assert.deepEqual(presentation.retainEntityDetails(fixture,enriched).videos,enriched.videos);
assert.deepEqual(presentation.retainEntityDetails(fixture,enriched).rewards,enriched.rewards);
assert.deepEqual(presentation.retainEntityDetails({...fixture,videos:[]},enriched).videos,[]);
assert.equal(collectVideos([enriched,{...enriched,id:'same-character-other-region',region:'jp'}],'ko').length,1);
assert.equal(collectVideos([{...enriched,videos:[{...clip,metadataVerified:false}]}],'ko').length,0);
assert.equal(youtubeIdFrom(clip.sourceUrl),clip.youtubeId);assert.equal(youtubeIdFrom('https://evil.test/watch?v=aBcDeFgHiJk'),undefined);
response=await save({target:'entry',id:fixture.id,revision:0,changes:{videos:[clip]}});assert.equal(response.status,200);
await store.saveEntries([{...fixture,videos:[],verifiedAt:new Date().toISOString()}]);assert.deepEqual((await store.readData()).entries.find(e=>e.id===fixture.id).videos,[clip]);
assert.equal((await editor.DELETE(request({target:'entry',id:fixture.id,revision:1},'DELETE'))).status,200);
// History dates and retention are data integrity checks, not presentation snapshots.
const syncHistory=await mod('app/api/sync/route.ts');
const favoriteUpdates=await mod('lib/favorite-updates.ts');
const history=await mod('lib/pickup-history.ts');
const testNow=Date.now();
const broadcast={status:'scheduled',youtubeId:clip.youtubeId,channel:'Official fixture',locale:'ko',sourceUrl:clip.sourceUrl,announcementUrl:fixture.sourceUrl,originalTitle:'Fixture livestream',announcedAt:null,scheduledAt:new Date(testNow+86400000).toISOString(),endedAt:null,official:true,metadataVerified:true,watched:false,verifiedAt:new Date(testNow).toISOString()};
const broadcastEntry={...fixture,id:'broadcast-fixture',kind:'update',startAt:null,endAt:null,sourceKind:'video',sourceUrl:clip.sourceUrl,broadcast};
assert.equal(favoriteUpdates.broadcastState(broadcast,testNow),'scheduled');
assert.equal(favoriteUpdates.broadcastState({...broadcast,scheduledAt:new Date(testNow-60000).toISOString()},testNow),'scheduled','Passing the reservation is not proof of LIVE');
assert.equal(favoriteUpdates.broadcastState({...broadcast,status:'live'},testNow),'live');
assert.equal(favoriteUpdates.broadcastState({...broadcast,status:'live',verifiedAt:new Date(testNow-3*3600000).toISOString()},testNow),'inactive');
assert.equal(favoriteUpdates.broadcastState({...broadcast,status:'live',verifiedAt:new Date(testNow-3*3600000).toISOString(),statusCheckedAt:new Date(testNow).toISOString()},testNow),'live');
for(const status of ['ended','cancelled'])assert.equal(favoriteUpdates.broadcastState({...broadcast,status},testNow),'inactive');
assert.equal(favoriteUpdates.favoriteBroadcasts([broadcastEntry],games,[],'kr',{},'ko',testNow).length,0);
assert.equal(favoriteUpdates.favoriteBroadcasts([broadcastEntry,enriched],games,['wuwa'],'kr',{},'ko',testNow).length,1,'PV does not activate a broadcast');
assert.equal(favoriteUpdates.favoriteBroadcasts([{...broadcastEntry,gameId:'umamusume',region:'jp'}],games,['umamusume'],'kr',{},'ko',testNow).length,0);
assert.equal(favoriteUpdates.favoriteBroadcasts([{...broadcastEntry,gameId:'umamusume',region:'jp',broadcast:{...broadcastEntry.broadcast,locale:'ja'}}],games,['umamusume'],'kr',{umamusume:'jp'},'ko',testNow).length,1);
const notices=[{...fixture,id:'old-notice',kind:'update',publishedAt:'2026-10-01',verifiedAt:new Date(testNow).toISOString()},{...fixture,id:'new-notice',kind:'update',sourceUrl:fixture.sourceUrl+'?article=2',publishedAt:'2026-10-15'},{...fixture,id:'duplicate-detail',sourceUrl:fixture.sourceUrl+'?article=2',publishedAt:'2026-10-15'},{...fixture,id:'not-favorited',gameId:'zzz'},{...fixture,id:'community',sourceKind:'community'}];
const noticeGroups=favoriteUpdates.favoriteNoticeGroups(notices,games,['wuwa'],'kr',{},'ko');
assert.equal(noticeGroups.length,1);assert.deepEqual(noticeGroups[0].notices.map(e=>e.id),['new-notice','old-notice']);
const cnNotices=favoriteUpdates.favoriteNoticeGroups([{...fixture,gameId:'gfl2',region:'cn'}],games,['gfl2'],'kr',{gfl2:'cn'},'ko');assert.equal(cnNotices[0].notices[0].region,'cn');
assert.equal(history.isPickup({...fixture,kind:'weapon',poolType:'weapon'}),false);
assert.equal(history.isPickup({...fixture,kind:'weapon',poolType:'support'}),true);
assert.equal(history.pickupPeriod({...fixture,startAt:null,endAt:null,pickupArchive:{status:'forecast',startDate:'2026-11-01'}},testNow),'upcoming');
assert.equal((await syncHistory.POST(request({entries:[broadcastEntry]}))).status,200);
await store.saveEntries([{...broadcastEntry,broadcast:undefined}]);assert.deepEqual((await store.readBaseData()).entries.find(e=>e.id===broadcastEntry.id).broadcast,broadcast,'Routine omitted broadcast metadata is retained');
assert.equal((await syncHistory.POST(request({entries:[{...broadcastEntry,broadcast:{...broadcast,sourceUrl:'https://example.invalid/broadcast'}}]}))).status,400);
assert.equal((await syncHistory.POST(request({entries:[{...broadcastEntry,startAt:broadcast.scheduledAt}]}))).status,400,'Broadcast time is not a gameplay schedule');
assert.equal(safeExtras({...broadcastEntry,broadcast:{...broadcast,thumbnailUrl:'https://i.ytimg.com/vi/another-id0/maxresdefault.jpg'}}),false);
sql.exec("DELETE FROM entries WHERE id='broadcast-fixture'");
const historyFixture={...fixture,id:'history-fixture',startAt:null,endAt:null,pickupArchive:{status:'past',startDate:'2026-01-01',endDate:'2026-01-20'},verifiedAt:new Date().toISOString()};
assert.equal((await syncHistory.POST(request({entries:[{...historyFixture,pickupArchive:{status:'forecast'},startAt:'2026-11-01T00:00:00Z'}]}))).status,400);
assert.equal((await syncHistory.POST(request({entries:[{...historyFixture,pickupArchive:{status:'announced'},sourceKind:'community'}]}))).status,400);
assert.equal((await syncHistory.POST(request({entries:[{...historyFixture,pickupArchive:{status:'past',startDate:'2026-02-01',endDate:'2026-01-01'}}]}))).status,400);
assert.equal((await syncHistory.POST(request({entries:[historyFixture]}))).status,200);
const many=Array.from({length:650},(_,i)=>({...historyFixture,id:'retention-fixture-'+i}));
await store.saveEntries(many);assert.equal((await store.readBaseData()).entries.filter(e=>e.id.startsWith('retention-fixture-')).length,650,'Archive must retain more than 600 records');
sql.exec("DELETE FROM entries WHERE id LIKE 'retention-fixture-%' OR id='history-fixture'");
if(process.argv[2]){
 const payload=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const sync=await mod('app/api/sync/route.ts');
 for(let i=0;i<payload.entries.length;i+=80){const batch=payload.entries.slice(i,i+80);const synced=await sync.POST(request({entries:batch}));const result=await synced.json();assert.equal(synced.status,200,JSON.stringify(result));assert.equal(result.saved,batch.length);}
 const automatic=await store.readData({automatic:true}),effective=await store.readData();
 for(const wanted of payload.entries){
  for(const view of [automatic,effective]){
   const actual=view.entries.find(e=>e.id===wanted.id);assert.ok(actual,wanted.id);
   for(const key of ['region','versionHero','selectionCount','image'])assert.equal(actual[key],wanted[key],wanted.id+':'+key);
   for(const key of ['videos','broadcast','rewards','rewardNote','entityDetails','pickupArchive'])if(wanted[key])assert.deepEqual(actual[key],wanted[key],wanted.id+':'+key);
   if(wanted.pickupMembers)assert.deepEqual(actual.pickupMembers.map(m=>[m.name,m.role,m.image]),wanted.pickupMembers.map(m=>[m.name,m.role,m.image]),wanted.id+':members');
  }
 }
 const {currentVersion}=await mod('lib/version-hero.ts');
 const coverage=games.map(g=>[g.id,currentVersion(effective.entries,g,presentation.effectiveRegion(g,'kr'),Date.now())?.id]);
 assert.ok(coverage.every(([,id])=>id),'Every game needs a current update header');
 for(const id of ['arknights','gfl2'])assert.equal(currentVersion(effective.entries,games.find(g=>g.id===id),'cn',Date.now()).region,'cn');
 console.log(JSON.stringify({syncPayloadRoundtrip:true,records:payload.entries.length,versionCoverage:coverage}));
}
// Owner canvas drafts never mutate the saved data; all surfaces share one favorite scope.
const preview=await mod('lib/editor-preview.ts');
const original=structuredClone(fixture),draft={...original,title:{...original.title,ko:'Unsaved draft'}};
const staged=preview.previewEntries([original],{entry:draft});
assert.equal(staged[0].title.ko,'Unsaved draft');assert.deepEqual(original,fixture);
assert.equal(preview.previewEntries([original],null)[0].title.ko,fixture.title.ko);
assert.equal(preview.previewEntries([original],{entry:{...draft,id:'new-preview'}}).length,2);
assert.deepEqual(preview.myGameEntries([fixture,{...fixture,gameId:'zzz'}],['zzz'],true).map(e=>e.gameId),['zzz']);
assert.equal(preview.myGameEntries([fixture],[],true).length,0);
assert.equal(preview.myGameEntries([fixture],[],false).length,1);
const replacement=preview.replacementArtwork(uploaded.url,origin,'neutral');
assert.equal(replacement.image,uploaded.url);assert.equal(replacement.imageSource,origin+uploaded.url);
assert.equal(replacement.previewBounds,undefined);assert.equal(replacement.localizedArtwork,undefined);assert.equal(replacement.imageFit,'contain');
const newArt={...fixture,...replacement};const {artworkForLocale}=await mod('lib/artwork.ts');
assert.equal(artworkForLocale(newArt,'ko').image,uploaded.url);assert.equal(artworkForLocale(newArt,'ja').image,uploaded.url);
// Saved-content polling must not download the archive again when only the clock changes.
const publicData=await mod('app/api/data/route.ts');
let initial=await publicData.GET(new Request(origin+'/api/data'));assert.equal(initial.status,200);let tag=initial.headers.get('ETag');assert.ok(tag);
assert.equal((await publicData.GET(new Request(origin+'/api/data',{headers:{'If-None-Match':tag}}))).status,304);
await store.saveCheck({gameId:'wuwa',checkedAt:new Date().toISOString(),status:'error',count:0,error:'fixture'});
assert.equal((await publicData.GET(new Request(origin+'/api/data',{headers:{'If-None-Match':tag}}))).status,200);
// Exercise the actual updater authorization and partial-error behavior without external requests.
const refresh=await mod('app/api/refresh/route.ts');
globalThis.__patchworkTest.identity=null;
assert.equal((await refresh.POST(request({}))).status,403);
assert.equal((await publicData.GET(new Request(origin+'/api/data?view=automatic'))).status,403);
globalThis.__patchworkTest.identity={userId:'viewer-fixture',email:'viewer@example.test'};
assert.equal((await refresh.POST(request({}))).status,403);
globalThis.__patchworkTest.identity={userId:'owner-fixture',email:'owner@example.test'};
assert.equal((await refresh.POST(request({},'POST',{Origin:'https://evil.example.test'}))).status,403);
const actualFetch=globalThis.fetch;
globalThis.fetch=async url=>{
 const href=String(url);
 if(href.includes('hoyoverse.com/content'))return Response.json({retcode:0,data:{list:[{iInfoId:123456789,sTitle:'Official fixture',dtStartTime:'2026-10-16',sExt:'{}'}]}});
 if(href.includes('kurogame.com/akiwebsite'))return Response.json([{articleId:'fixture-news',articleTitle:'Official fixture',startTime:'2026-10-16'}]);
 if(href.includes('arknights.global/api'))return Response.json({code:0,data:{rows:[{id:'fixture-news',title:'Official fixture',publishTime:Date.now()}]}});
 if(href.includes('api-web.bluearchive.jp'))return Response.json({data:{rows:[{id:'fixture-news',title:'Official fixture'}]}});
 if(href.includes('umamusume.com'))return new Response('Forbidden',{status:403});
 throw new Error('Unexpected test URL');
};
try{
 sql.exec('DELETE FROM source_checks');
 let r=await refresh.POST(request({}));assert.equal(r.status,200);let d=await r.json();
 assert.equal(d.ok,false);assert.equal(d.checks.length,7);assert.equal(d.checks.filter(c=>c.status==='ok').length,6);
 assert.equal(d.checks.find(c=>c.gameId==='umamusume').error,'HTTP 403');assert.ok(d.added>0);
 const feedRecord=d.entries.find(e=>e.id==='feed-wuwa-fixture-news');assert.ok(feedRecord);
 const reviewed={...feedRecord,summary:{...feedRecord.summary,ko:'Reviewed detailed explanation'},verifiedAt:'2026-10-15T01:00:00Z'};
 await store.saveEntries([reviewed]);sql.exec('DELETE FROM source_checks');
 d=await (await refresh.POST(request({}))).json();assert.equal(d.added,0);assert.equal(d.changed,0);
 const retained=d.entries.find(e=>e.id===reviewed.id);assert.equal(retained.summary.ko,reviewed.summary.ko);assert.equal(retained.verifiedAt,reviewed.verifiedAt);
 d=await (await refresh.POST(request({}))).json();assert.equal(d.cached,true);assert.equal(d.ok,false);
}finally{globalThis.fetch=actualFetch;}
console.log(JSON.stringify({canvasPreviewIsolation:true,favoriteScope:true,replacementArtwork:true,conditionalReadback:true,partialFeedFailure:true,reviewedNoticePreservation:true}));

// Emergency path uses a cryptographically signed identity and the exact committed plan.
const emergency=await mod('app/api/emergency/route.ts');const historyRoute=await mod('app/api/editor/history/route.ts');
const keypair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',keypair.publicKey);jwk.kid='fixture-key';
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const seconds=Math.floor(Date.now()/1000);
const encoded=b64({alg:'RS256',typ:'JWT',kid:jwk.kid})+'.'+b64({iss:'https://token.actions.githubusercontent.com',aud:'https://gagether.wiki/api/emergency',repository_id:'1422741334',repository_owner_id:'343730239',repository:'tomochelly/gagether-android',ref:'refs/heads/main',workflow_ref:'tomochelly/gagether-android/.github/workflows/gagether-emergency.yml@refs/heads/main',event_name:'push',sha:'a'.repeat(40),actor:'fixture-owner',run_id:'123',iat:seconds,nbf:seconds-1,exp:seconds+300});
const token=encoded+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keypair.privateKey,new TextEncoder().encode(encoded))).toString('base64url');
let plan={version:1,requestId:'drill-create-0001',reason:'Isolated recovery rehearsal',action:'edit',dryRun:true,edit:{target:'entry',id:'reliability-drill',revision:0,create:true,changes:{...Object.fromEntries(Object.entries(custom).filter(([k])=>!['id','verifiedAt'].includes(k))),hidden:true}}};
const realFetch=globalThis.fetch;globalThis.fetch=async (url,options)=>{
 if(options?.redirect==='error')throw Error('Workers supports only follow/manual redirect modes');
 if(String(url).includes('/.well-known/jwks'))return Response.json({keys:[jwk]});
 if(String(url)===`https://raw.githubusercontent.com/tomochelly/gagether-android/${'a'.repeat(40)}/.gagether/emergency.json`){assert.equal(options?.redirect,'manual');return new Response(JSON.stringify(plan));}
 return realFetch(url,options);
};
const emergencyRequest=identity=>new Request(origin+'/api/emergency',{method:'POST',headers:{'X-Gagether-Emergency-Identity':identity},body:''});
try{
 assert.equal((await emergency.POST(emergencyRequest('forged'))).status,403);
 let r=await emergency.POST(emergencyRequest(token));assert.equal(r.status,200);assert.equal((await r.json()).dryRun,true);assert.ok(!(await store.readData({includeHidden:true})).entries.some(e=>e.id==='reliability-drill'));
 plan.dryRun=false;r=await emergency.POST(emergencyRequest(token));assert.equal(r.status,200);assert.equal((await r.json()).revision,1);assert.ok(!(await store.readData()).entries.some(e=>e.id==='reliability-drill'));
 r=await emergency.POST(emergencyRequest(token));assert.equal((await r.json()).replayed,true);
 plan={...plan,requestId:'drill-conflict-0002'};assert.equal((await emergency.POST(emergencyRequest(token))).status,409);
 const history=await (await historyRoute.GET(new Request(origin+'/api/editor/history?id=reliability-drill'))).json();assert.ok(history.history.length);
 for(let i=0;i<105;i++)sql.prepare("INSERT INTO editorial_history(key,action,actor,at) VALUES('entry:unrelated','fixture','fixture','now')").run();
 r=await historyRoute.POST(request({seq:history.history[0].seq,side:'before',revision:1}));assert.equal(r.status,200);assert.ok(!(await store.readData({includeHidden:true})).entries.some(e=>e.id==='reliability-drill'));
}finally{globalThis.fetch=realFetch;}
console.log(JSON.stringify({emergencySignedOIDC:true,dryRun:true,createHidden:true,replayDeduplication:true,revisionConflict:true,historyRollback:true}));
globalThis.__patchworkTest.identity={userId:'owner-fixture',email:'owner@example.test'};
// Owner in-place details use scoped reads, all locales and immutable original bytes.
const inlineBody={ko:'직접 쓴 상세\n두 번째 줄 '.repeat(1500),en:'Owner English details',ja:'自分で書いた詳細',zh:'直接输入详情'};
for(const game of games){
 const id='custom-inline-'+game.id,changes={gameId:game.id,kind:'event',region:game.regions[0],server:game.publisher,title:{ko:'비공개 검증',en:'Private fixture',ja:'非公開検証',zh:'非公开验证'},summary:inlineBody,sourceUrl:game.official,sourceTitle:'Owner fixture',publishedAt:null,startAt:null,endAt:null,hidden:true,contentBlocks:[{id:'text',type:'text',body:inlineBody},{id:'image',type:'image',asset:{image:'/assets/fixture.png',imageSource:game.official,imageVerified:true,imageLocale:'neutral',width:2560,height:1440,verifiedAt:new Date().toISOString()}}]};
 const req=new Request(origin+'/api/editor?view=entry',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({target:'entry',id,revision:0,create:true,changes})});
 const created=await editor.POST(req);assert.equal(created.status,200,game.id);const value=await created.json();assert.equal(value.entry.hidden,true);assert.deepEqual(value.entry.contentBlocks,changes.contentBlocks);assert.deepEqual(value.entry.summary,inlineBody);assert.equal(value.entries,undefined);
 const read=await editor.GET(new Request(origin+'/api/editor?id='+id));assert.equal(read.status,200);assert.deepEqual((await read.json()).entry.contentBlocks,changes.contentBlocks);
 assert.equal((await store.readEntry(id)),undefined,'public detail must hide owner test');
 const duplicate=await editor.POST(new Request(req.url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({target:'entry',id,revision:0,create:true,changes})}));assert.equal(duplicate.status,409);
 const reset=await editor.DELETE(new Request(origin+'/api/editor',{method:'DELETE',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({target:'entry',id,revision:1})}));assert.equal(reset.status,200);
}
globalThis.__patchworkTest.identity=null;assert.equal((await editor.GET(new Request(origin+'/api/editor?id=custom-inline-wuwa'))).status,403);
console.log(JSON.stringify({inlineScopedOwnerReadback:true,all15Games:true,fourLocaleLongDetails:true,photosPreserved:true,duplicateCreateBlocked:true,privateAndReversible:true}));

sql.close();delete globalThis.__patchworkTest;
console.log(JSON.stringify({ok:true,checks:['owner authorization','cross-origin rejection','editor SQLite roundtrip','optimistic conflicts','manual field preservation','optional field removal','hidden/manual item lifecycle','localized site settings','invalid URLs and dates','R2 upload/readback','exact multi-pickup slides','lower rarity exclusion','CN restricted to three reviewed services','Chinese locale retained']}));

// A successful fetch with a malformed persisted snapshot must fail validation.
const health=await mod('lib/service-health.ts');
const invalidWindow={...custom,id:'invalid-clock-fixture',startAt:'2026-10-23T12:00:00+09:00',endAt:'2026-10-23T11:00:00+09:00'};
const issues=health.readbackIssues([invalidWindow],[invalidWindow]);
assert.ok(issues.some(i=>i.code==='invalid-window'));
assert.equal(health.refreshHealth([{status:'ok'}],!issues.length).outcome,'validation-failed');
assert.equal(health.refreshHealth([{status:'ok'},{status:'error'}]).outcome,'partial');
assert.equal(health.refreshHealth([{status:'error'}]).outcome,'failed');
assert.equal(health.refreshHealth([{status:'ok'}]).outcome,'complete');
console.log(JSON.stringify({malformedReadbackRejected:true,refreshOutcomes:true}));
