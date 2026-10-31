import './load-typescript.mjs';
import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const db=new DatabaseSync(':memory:');
for(const file of ['0000_fixed_ares.sql','0001_futuristic_preak.sql','0010_overjoyed_nitro.sql'])db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
class Statement{
 constructor(sql,args=[]){this.sql=sql;this.args=args}
 bind(...args){return new Statement(this.sql,args)}
 async all(){return {results:db.prepare(this.sql).all(...this.args)}}
 async first(){return db.prepare(this.sql).get(...this.args)||null}
 async run(){const r=db.prepare(this.sql).run(...this.args);return {meta:{changes:Number(r.changes)}}}
}
globalThis.editorApiEnv={PATCHWORK_EDITOR_EMAILS:'owner@example.test',DB:{prepare:sql=>new Statement(sql),batch:async rows=>{db.exec('BEGIN');try{const out=[];for(const row of rows)out.push(await row.run());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}}};
globalThis.editorApiUser={userId:'verified-owner',email:'owner@example.test'};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:editor-env',shortCircuit:true};if(s==='@/app/chatgpt-auth')return {url:'test:editor-identity',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:editor-env')return {format:'module',source:'export const env=globalThis.editorApiEnv',shortCircuit:true};if(u==='test:editor-identity')return {format:'module',source:'export const getChatGPTUser=async()=>globalThis.editorApiUser',shortCircuit:true};return n(u,c)}});
const api=await import('../app/api/editor/route.ts'),history=await import('../app/api/editor/history/route.ts');
const {saveInlineEntry,fetchOwnerEntry}=await import('../lib/inline-edit.ts');
const {saveEntries,readData}=await import('../lib/store.ts');
const {games}=await import('../lib/games.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {changeBroadcastStatus}=await import('../lib/broadcast-archive.ts');
const local=s=>({ko:s,en:s,ja:s,zh:s}),stamp=new Date().toISOString();
const fixture=(game,id)=>({id,gameId:game.id,kind:'event',title:local('Owner item'),summary:local('Details\nSecond line'),region:effectiveRegion(game,'kr'),server:game.publisher,startAt:null,endAt:null,publishedAt:null,verifiedAt:stamp,sourceUrl:game.official,sourceTitle:'Owner'});
const request=(path,body,method='POST',origin='https://gagether.wiki')=>new Request('https://gagether.wiki'+path,{method,headers:{Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
const nativeFetch=globalThis.fetch;
test('real editor API and SQLite: create/update/readback/delete/restore for all 15 games, with CAS and audit',async()=>{
 globalThis.fetch=async(path,options)=>options?.method==='POST'?api.POST(request(path,JSON.parse(options.body))):api.GET(request(path,null,'GET'));
 try{
  for(const game of games){
   const base=fixture(game,'custom-api-'+game.id),draft={...base,title:local(game.name.ko+' new'),detailSections:[{title:local('Details'),body:local('Typed content')}]};
   const saved=await saveInlineEntry(base,draft,true);assert.equal(saved.editor.revision,1);assert.equal(saved.title.ko,draft.title.ko);
   await assert.rejects(()=>saveInlineEntry(base,draft,true),e=>e.status===409);
   const changed=await saveInlineEntry(saved,{...saved,summary:local('Changed body')});assert.equal(changed.editor.revision,2);assert.equal((await fetchOwnerEntry(base.id)).summary.ko,'Changed body');
   await assert.rejects(()=>saveInlineEntry(saved,{...saved,title:local('Concurrent edit')}),e=>e.status===409);
   const rows=(await (await history.GET(request('/api/editor/history?id='+base.id,null,'GET'))).json()).history;assert.equal(rows.length,2);assert.ok(rows.every(r=>r.actor==='verified-owner'));
   assert.equal((await history.POST(request('/api/editor/history',{seq:rows[0].seq,revision:2,side:'before'}))).status,200);
   const restored=await fetchOwnerEntry(base.id);assert.equal(restored.editor.revision,3);assert.equal(restored.summary.ko,draft.summary.ko);
   assert.equal((await api.DELETE(request('/api/editor',{target:'entry',id:base.id,revision:3},'DELETE'))).status,200);
   assert.equal((await api.GET(request('/api/editor?id='+base.id,null,'GET'))).status,404);
   const removed=(await (await history.GET(request('/api/editor/history?id='+base.id,null,'GET'))).json()).history[0];
   assert.equal((await history.POST(request('/api/editor/history',{seq:removed.seq,revision:0,side:'before'}))).status,200);
   assert.equal((await fetchOwnerEntry(base.id)).title.ko,draft.title.ko);
  }
 }finally{globalThis.fetch=nativeFetch;}
});
test('real settings API preserves library text, game images and other settings; stale/malformed/unauthorized writes fail',async()=>{
 const settings={brand:{name:'GAGETHER'},ui:{ko:{library:'내 라이브러리'}},games:{stellasora:{name:local('Stella Sora'),icon:'/assets/stella.png',logo:'/assets/stella-logo.png'}},layout:{overview:['news','calendar']}};
 const save=await api.POST(request('/api/editor?view=settings',{target:'site',revision:0,changes:settings}));assert.equal(save.status,200);
 assert.deepEqual((await (await api.GET(request('/api/editor?view=settings',null,'GET'))).json()).settings,settings);
 assert.equal((await api.POST(request('/api/editor?view=settings',{target:'site',revision:0,changes:{}}))).status,409);
 assert.equal((await api.POST(request('/api/editor',{target:'entry',id:'custom-invalid',revision:0,create:true,changes:{title:local('Only a title')}}))).status,400);
 assert.equal((await api.POST(request('/api/editor',{target:'site',revision:1,changes:settings},'POST','https://evil.example'))).status,403);
 globalThis.editorApiUser=null;
 try{assert.equal((await api.GET(request('/api/editor',null,'GET'))).status,403);assert.equal((await api.POST(request('/api/editor',{target:'site',revision:1,changes:settings}))).status,403);}finally{globalThis.editorApiUser={userId:'verified-owner',email:'owner@example.test'};}
});
test('rich typography remains plain text and survives real owner saves, source refresh, locale isolation and history',async()=>{
 const game=games.find(g=>g.id==='nikke'),base=fixture(game,'custom-rich-typography'),appearance={ko:{titleSize:36,bodySize:24,lineHeight:1.8,titleFormat:{bold:true,align:'center'},bodyFormat:{italic:true,underline:true,color:'#234567'}},ja:{bodySize:18,bodyFormat:{bold:false}}};
 const nativeFetch=globalThis.fetch;globalThis.fetch=async(path,options)=>options?.method==='POST'?api.POST(request(path,JSON.parse(options.body))):api.GET(request(path,null,'GET'));
 try{
  const first=await saveInlineEntry(base,{...base,summary:local('First line\n\n  Indented line'),textStyle:appearance,detailSections:[{title:local('Section'),body:local('Native plain text'),textStyle:appearance}],contentBlocks:[{id:'rich-block',type:'text',title:local('Block'),body:local('<img src=x onerror=alert(1)>'),textStyle:appearance}],entityDetails:[{id:'profile-rich',name:local('Profile'),category:local('Category'),basis:local('Base'),textStyle:appearance,stats:[],statSourceKind:'official',groups:[{title:local('Skill'),body:local('Description'),sourceKind:'official',textStyle:appearance}],sources:[{kind:'official',url:game.official,title:'Official'}],verifiedAt:stamp}],rewards:[{name:local('Reward'),note:local('Condition'),textStyle:appearance,sourceUrl:game.official,sourceKind:'official'}]},true);
  assert.deepEqual(first.textStyle,appearance);assert.deepEqual(first.detailSections[0].textStyle,appearance);assert.deepEqual(first.entityDetails[0].groups[0].textStyle,appearance);assert.deepEqual(first.rewards[0].textStyle,appearance);assert.equal(first.summary.ko,'First line\n\n  Indented line');
  const edited=await saveInlineEntry(first,{...first,textStyle:{...appearance,ko:{...appearance.ko,bodySize:30}}});await saveEntries([{...base,title:local('Updated source')}]);const effective=(await readData()).entries.find(e=>e.id===base.id);assert.equal(effective.textStyle.ko.bodySize,30);assert.deepEqual(effective.textStyle.ja,appearance.ja);
  const rows=(await (await history.GET(request('/api/editor/history?id='+base.id,null,'GET'))).json()).history;assert.equal((await history.POST(request('/api/editor/history',{seq:rows[0].seq,revision:edited.editor.revision,side:'before'}))).status,200);assert.deepEqual((await fetchOwnerEntry(base.id)).textStyle,appearance);
  const current=await (await api.GET(request('/api/editor?view=settings',null,'GET'))).json(),settings={...current.settings,uiTextStyle:{ko:{headline:{bodySize:32,bodyFormat:{bold:true,italic:true}}},ja:{headline:{bodySize:20}}},brand:{...current.settings.brand,textStyle:appearance},games:{...current.settings.games,nikke:{...current.settings.games?.nikke,textStyle:appearance}},announcements:[{id:'rich-announcement',title:local('Notice'),body:local('Content'),textStyle:appearance}]};
  const response=await api.POST(request('/api/editor?view=settings',{target:'site',revision:current.settingsRevision,changes:settings}));assert.equal(response.status,200);assert.deepEqual((await response.json()).settings,settings);
 }finally{globalThis.fetch=nativeFetch;}
});
test('owner-ended broadcasts survive automatic refresh and can be restored from audited history without fabricated end times',async()=>{
 const game=games.find(g=>g.id==='wuwa'),base={...fixture(game,'broadcast-editor-api'),kind:'update',broadcast:{status:'live',youtubeId:'abcdefghijk',channel:'Official',locale:'ko',sourceUrl:'https://www.youtube.com/watch?v=abcdefghijk',announcementUrl:game.official,originalTitle:'Official stream',announcedAt:null,scheduledAt:null,endedAt:null,official:true,metadataVerified:true,watched:false,verifiedAt:stamp,statusCheckedAt:stamp}};
 await saveEntries([base]);const ended=changeBroadcastStatus(base.broadcast,'ended',new Date().toISOString());
 assert.equal((await api.POST(request('/api/editor?view=entry',{target:'entry',id:base.id,revision:0,changes:{broadcast:ended}}))).status,200);
 await saveEntries([{...base,verifiedAt:new Date().toISOString(),broadcast:{...base.broadcast,status:'live'}}]);
 const effective=(await readData()).entries.find(e=>e.id===base.id);assert.equal(effective.broadcast.status,'ended');assert.equal(effective.broadcast.endedAt,null);assert.equal(effective.broadcast.verifiedAt,stamp);
 const rows=(await (await history.GET(request('/api/editor/history?id='+base.id,null,'GET'))).json()).history;
 assert.equal((await history.POST(request('/api/editor/history',{seq:rows[0].seq,revision:1,side:'before'}))).status,200);
 assert.equal((await readData()).entries.find(e=>e.id===base.id).broadcast.status,'live');
});
test('actual owner SQLite save/reload/automatic-refresh/restore preserves four independent photos and frames across all canonical services',async()=>{
 const {replaceArtworkSlot,patchArtworkSlot}=await import('../lib/editor-artwork.ts'),{artworkForLocale,serviceArtworkLocale}=await import('../lib/artwork.ts');
 globalThis.fetch=async(path,options)=>options?.method==='POST'?api.POST(request(path,JSON.parse(options.body))):api.GET(request(path,null,'GET'));
 try{for(const game of games)for(const region of new Set(game.regions.map(r=>effectiveRegion(game,r)))){
  const base={...fixture(game,'photo-api-'+game.id+'-'+region),region};let current=await saveInlineEntry(base,{...base},true);
  for(const locale of ['ko','ja','en','zh']){
   const next={...current,...replaceArtworkSlot(current,locale,`/assets/fixtures/${game.id}-${region}-${locale}.png`,'https://gagether.wiki',{width:1920,height:1080})};Object.assign(next,patchArtworkSlot(next,locale,{imageFraming:{banner:{x:33,y:47,zoom:.6,fit:'cover'}}}));
   current=await saveInlineEntry(current,next);const reloaded=await fetchOwnerEntry(base.id);assert.deepEqual(reloaded.localizedArtwork,current.localizedArtwork);
   for(const l of Object.keys(current.localizedArtwork)){const display=artworkForLocale(reloaded,l,'preview',l);assert.equal(display.image,current.localizedArtwork[l].image);assert.equal(display.imageLocale,l);assert.equal(display.imageFraming.banner.zoom,.6);}
  }
  const before=structuredClone(current),removed={...current,...replaceArtworkSlot(current,'ja','','https://gagether.wiki',{width:1,height:1})};current=await saveInlineEntry(current,removed);assert.ok(!artworkForLocale(current,'ja','full','ja').image);assert.equal(current.localizedArtwork.ko.image,before.localizedArtwork.ko.image);
  const rows=(await (await history.GET(request('/api/editor/history?id='+base.id,null,'GET'))).json()).history;assert.equal((await history.POST(request('/api/editor/history',{seq:rows[0].seq,revision:current.editor.revision,side:'before'}))).status,200);const restored=await fetchOwnerEntry(base.id);assert.equal(restored.localizedArtwork.ja.image,before.localizedArtwork.ja.image);
  await saveEntries([{...base,title:local('Fresh official headline')}]);const effective=(await readData()).entries.find(e=>e.id===base.id);assert.deepEqual(effective.localizedArtwork,restored.localizedArtwork);
  const service=serviceArtworkLocale(region,game.id);if(service)assert.equal(artworkForLocale(effective,'ko','full',service).image,effective.localizedArtwork[service].image);
 }}finally{globalThis.fetch=nativeFetch;}
});
