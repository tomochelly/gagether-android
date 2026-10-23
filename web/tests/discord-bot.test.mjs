import './load-typescript.mjs';
import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const {games}=await import('../lib/games.ts');
const {BotStore,Conflict}=await import('../discord/src/store.ts');
const {initialResponse,handleInteraction}=await import('../discord/src/interactions.ts');
const {default:worker}=await import('../discord/src/index.ts');
const {verifySignature,hex}=await import('../discord/src/security.ts');
const {planDeliveries,runScheduler}=await import('../discord/src/scheduler.ts');
const {gameView,searchView}=await import('../discord/src/views.ts');
const {loadCatalog}=await import('../discord/src/catalog.ts');

const nativeFetch=globalThis.fetch,nativeNow=Date.now;
let clock=nativeNow();
afterEach(()=>{globalThis.fetch=nativeFetch;Date.now=nativeNow;});
const guild='123456789012345678',user='223456789012345678',channel='323456789012345678',application='423456789012345678';
const timestamp=()=>new Date(clock).toISOString();
function fixture(){
  clock=nativeNow();Date.now=()=>clock;
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../discord/migrations/0001_bot.sql',import.meta.url),'utf8'));
  class Statement{
    constructor(sql,args=[]){this.sql=sql;this.args=args;}
    bind(...args){return new Statement(this.sql,args);}
    async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}
    async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}
    async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}
  }
  const DB={prepare:sql=>new Statement(sql),batch:async statements=>{sqlite.exec('BEGIN');try{const values=[];for(const statement of statements)values.push(await statement.run());sqlite.exec('COMMIT');return values;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
  const catalog={schemaVersion:1,locale:'ko',requestedRegion:'kr',serverTime:timestamp(),revision:'a'.repeat(64),games:games.map(g=>({id:g.id,name:g.name.ko,regions:g.regions,color:g.color,canonicalRegions:{kr:g.regionAliases?.kr||g.regions.includes('kr')?'kr':'global',jp:'jp',cn:'cn',global:'global'}})),entries:[]};
  const env={DB,DISCORD_APPLICATION_ID:application,DISCORD_PUBLIC_KEY:'',DISCORD_BOT_TOKEN:'test-secret-not-a-real-token',GAGETHER_ORIGIN:'https://gagether.wiki',BOT_ENABLED:'true',SCHEDULER_ENABLED:'true'};
  const sent=[],requests=[];let sendMode='ok',recovered=[];
  globalThis.fetch=async(url,options={})=>{
    const u=new URL(url);requests.push({url:u.href,options});
    if(u.hostname==='gagether.wiki'){
      assert.equal(options.headers?.Authorization,undefined);assert.equal(options.redirect,'error');
      return Response.json({...catalog,serverTime:timestamp(),locale:u.searchParams.get('locale'),requestedRegion:u.searchParams.get('region')},{headers:{ETag:'"'+catalog.revision+'"'}});
    }
    assert.equal(u.hostname,'discord.com');
    if(options.method==='POST'){
      const body=JSON.parse(options.body);sent.push(body);
      if(sendMode==='timeout')throw new TypeError('Network disconnected');
      if(sendMode==='429')return Response.json({retry_after:90},{status:429});
      if(sendMode==='403')return Response.json({message:'Missing Permissions'},{status:403});
      return Response.json({id:'523456789012345678',nonce:body.nonce});
    }
    if(u.pathname.endsWith('/messages'))return Response.json(recovered);
    if(u.pathname.includes('/channels/'))return Response.json({id:channel,guild_id:guild,type:0});
    if(options.method==='PATCH')return Response.json({id:'623456789012345678'});
    throw new Error('Unexpected request');
  };
  const store=new BotStore(DB);
  return {sqlite,DB,catalog,env,store,sent,requests,setSendMode:value=>sendMode=value,setRecovered:value=>recovered=value};
}
const item=(overrides={})=>({id:'pickup-one',gameId:'wuwa',region:'global',kind:'pickup',title:'쇄명',summary:'신규 픽업',url:'/ko/games/wuwa?entry=pickup-one',sourceUrl:'https://example.test/source',sourceKind:'official',startAt:new Date(clock-86400000).toISOString(),endAt:new Date(clock+3600000).toISOString(),publishedAt:timestamp(),forecast:false,timed:true,poolType:'character',group:'phase-two',members:[{name:'쇄명',role:'featured',type:'new',image:'/assets/sha.png'}],...overrides});
const sub=(overrides={})=>({id:guild+':'+channel+':kr:ko',guildId:guild,channelId:channel,actorId:user,games:['wuwa'],region:'kr',locale:'ko',topics:['pickup-start','pickup-end','broadcast','notice'],offsets:[60],enabled:true,revision:1,createdAt:clock-86400000,updatedAt:clock-86400000,initialized:true,...overrides});
const interaction=(overrides={})=>({id:'723456789012345678',application_id:application,type:2,token:'interaction-secret',guild_id:guild,channel_id:channel,locale:'ko',member:{user:{id:user},permissions:'32'},data:{name:'명조'},...overrides});
async function saveSubscription(f,s=sub()){
  await f.DB.prepare('INSERT INTO subscriptions(id,guild_id,channel_id,actor_id,settings,enabled,revision,created_at,updated_at,initialized) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(s.id,s.guildId,s.channelId,s.actorId,JSON.stringify(s),s.enabled?1:0,s.revision,s.createdAt,s.updatedAt,s.initialized?1:0).run();return s;
}
const fresh=f=>f.sqlite.prepare('DELETE FROM catalog_cache').run();

test('command registry covers all 15 games with short commands, simple search and private manager setup',()=>{
  const commands=JSON.parse(readFileSync(new URL('../discord/commands.json',import.meta.url),'utf8'));
  assert.equal(commands.length,17);assert.ok(commands.find(c=>c.name==='블아'));assert.ok(commands.find(c=>c.name==='명조'));
  assert.equal(commands.find(c=>c.name==='알림').default_member_permissions,'32');
  assert.ok(commands.every(c=>c.contexts[0]===0));assert.equal(initialResponse(interaction({data:{name:'검색'}})).type,9);
  assert.equal(initialResponse(interaction({data:{name:'알림'}})).data.flags,64);
  assert.equal(initialResponse(interaction({type:3,data:{custom_id:'v:wuwa:kr:ko:pickup:0'}})).type,6);
});

test('all 15 game views, four languages, image/source embeds, buttons and scoped search',()=>{
  const f=fixture();
  for(const locale of ['ko','en','ja','zh'])for(const game of games){
    const catalog={...f.catalog,locale,entries:[item({gameId:game.id,title:game.name[locale]})]};
    const view=gameView(catalog,game.id,'pickup',0,f.env.GAGETHER_ORIGIN,clock);
    assert.equal(view.embeds.length,1);assert.equal(view.components[0].components.length,5);
    assert.ok(view.embeds[0].thumbnail.url.startsWith('https://gagether.wiki/'));
    assert.ok(view.components.flatMap(r=>r.components).every(c=>!c.custom_id||c.custom_id.length<=100));
    assert.equal(searchView(catalog,game.name[locale],0,f.env.GAGETHER_ORIGIN,clock).embeds.length,1);
  }
  const ended=item({broadcast:{status:'ended',scheduledAt:null,checkedAt:timestamp(),url:'https://youtube.com/watch?v=abcdefghijk',identity:'abcdefghijk',locale:'ko',live:false}});
  assert.equal(gameView({...f.catalog,entries:[ended]},'wuwa','broadcast',0,f.env.GAGETHER_ORIGIN,clock).embeds.length,0);
  assert.equal(gameView({...f.catalog,entries:[ended]},'wuwa','archive',0,f.env.GAGETHER_ORIGIN,clock).embeds.length,1);
});

test('real SQLite wizard: six selections, channel permission, atomic save, session replay and foreign actor denial',async()=>{
  const f=fixture();let view=await handleInteraction(f.env,interaction({type:3,data:{custom_id:'a:new'}}));
  const sessionId=view.components[0].components[0].custom_id.split(':')[1];
  await assert.rejects(()=>handleInteraction(f.env,interaction({type:3,member:{user:{id:'923456789012345678'},permissions:'32'},data:{custom_id:`w:${sessionId}:0:games`,values:['wuwa']}})),Conflict);
  const intact=await f.store.session(sessionId,guild,user,0,clock);assert.deepEqual(intact.settings.games,[]);
});

test('wizard save/readback/CAS and disable protect all subscription data',async()=>{
  const f=fixture();let session=await f.store.newSession(guild,user,'ko',clock);
  await assert.rejects(()=>f.store.session(session.id,guild,'999999999999999999',0,clock),Conflict);
  const next=async(step,values,extra={})=>handleInteraction(f.env,interaction({type:3,data:{custom_id:`w:${session.id}:${session.revision}:${step}`,values,...extra}}));
  for(const [name,values] of [['games',['wuwa','bluearchive']],['region',['jp']],['topics',['pickup-end','broadcast','notice']],['offsets',['1440','60','0']],['language',['ja']]]){
    await next(name,values);session={...session,revision:session.revision+1};
  }
  const denied=await next('channel',[channel],{resolved:{channels:{[channel]:{id:channel,type:0,app_permissions:'1024'}}}});assert.match(denied.content,/チャンネル/);
  const preview=await next('channel',[channel],{resolved:{channels:{[channel]:{id:channel,type:0,app_permissions:'19456'}}}});assert.ok(preview.components[0].components[0].custom_id.endsWith(':6:save'));
  session.revision=6;const saved=await next('save',[]);assert.match(saved.content,/保存/);
  let subscriptions=await f.store.subscriptions(guild);assert.equal(subscriptions.length,1);assert.equal(subscriptions[0].locale,'ja');assert.equal(subscriptions[0].region,'jp');assert.deepEqual(subscriptions[0].offsets,[1440,60,0]);
  await assert.rejects(()=>next('save',[]),Conflict);
  const s=subscriptions[0];await f.store.toggle(s.id,guild,user,1,false,clock);assert.equal((await f.store.subscriptions(guild))[0].enabled,false);
  await assert.rejects(()=>f.store.toggle(s.id,guild,user,1,true,clock),Conflict);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM audit').get().n,2);
});

test('ordinary users and cross-guild callers cannot configure subscriptions; invalid CN selection is rejected',async()=>{
  const f=fixture();
  const blocked=await handleInteraction(f.env,interaction({data:{name:'알림'},member:{user:{id:user},permissions:'0'}}));assert.match(blocked.content,/권한/);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM subscriptions').get().n,0);
  let s=await f.store.newSession(guild,user,'ko',clock);s.settings.games=['wuwa'];s=await f.store.advance(s);
  const denied=await handleInteraction(f.env,interaction({type:3,data:{custom_id:`w:${s.id}:1:region`,values:['cn']}}));assert.match(denied.content,/선택/);
  await assert.rejects(()=>f.store.session(s.id,'999999999999999999',user,1,clock),Conflict);
});

test('concurrent subscription saves use the selected channel revision and preserve the conflicting draft',async()=>{
  const f=fixture(),first=await f.store.newSession(guild,user,'ko',clock),second=await f.store.newSession(guild,user,'ko',clock);
  for(const session of [first,second]){session.settings={games:['wuwa'],region:'kr',locale:'ko',topics:['notice'],offsets:[0],channelId:channel,baseRevision:0};await f.DB.prepare('UPDATE sessions SET settings=? WHERE id=?').bind(JSON.stringify(session.settings),session.id).run();}
  await f.store.commit(first,clock);
  await assert.rejects(()=>f.store.commit(second,clock),Conflict);
  assert.equal((await f.store.subscriptions(guild))[0].revision,1);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM audit').get().n,1);
  assert.ok(await f.store.session(second.id,guild,user,0,clock));
});

test('game-specific region preference persists without changing other games',async()=>{
  const f=fixture();
  await handleInteraction(f.env,interaction({type:3,data:{custom_id:'r:bluearchive:ko:overview',values:['jp']}}));
  assert.equal(await f.store.preference(guild,user,'bluearchive'),'jp');assert.equal(await f.store.preference(guild,user,'wuwa'),undefined);
  const view=await handleInteraction(f.env,interaction({data:{name:'블아'}}));assert.match(view.content,/일본/);
});

test('signed raw-body verification: PING, tampering, expired timestamp, wrong app and oversized payload',async()=>{
  const f=fixture(),pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  f.env.DISCORD_PUBLIC_KEY=hex(await crypto.subtle.exportKey('raw',pair.publicKey));
  const sign=async(body,time=String(Math.floor(clock/1000)))=>hex(await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(time+body)));
  const raw=JSON.stringify({type:1,application_id:application}),time=String(Math.floor(clock/1000)),signature=await sign(raw);
  const request=(body=raw,sig=signature,stamp=time)=>new Request('https://bot.test/interactions',{method:'POST',headers:{'X-Signature-Ed25519':sig,'X-Signature-Timestamp':stamp},body});
  assert.equal(await verifySignature(raw,signature,time,f.env.DISCORD_PUBLIC_KEY,clock),true);
  assert.equal((await worker.fetch(request(),f.env,{waitUntil(){}})).status,200);
  assert.equal((await worker.fetch(request(raw+' '),f.env,{waitUntil(){}})).status,401);
  const old=String(Math.floor(clock/1000)-301);assert.equal((await worker.fetch(request(raw,await sign(raw,old),old),f.env,{waitUntil(){}})).status,401);
  const wrong=JSON.stringify({type:1,application_id:'999999999999999999'});assert.equal((await worker.fetch(request(wrong,await sign(wrong)),f.env,{waitUntil(){}})).status,403);
  assert.equal((await worker.fetch(request('x'.repeat(32769)),f.env,{waitUntil(){}})).status,413);
});

test('deferred interaction responds immediately and replay receipt permits only one callback edit',async()=>{
  const f=fixture(),pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);f.env.DISCORD_PUBLIC_KEY=hex(await crypto.subtle.exportKey('raw',pair.publicKey));
  const raw=JSON.stringify(interaction()),time=String(Math.floor(clock/1000)),signature=hex(await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(time+raw)));
  const requests=()=>new Request('https://bot.test/interactions',{method:'POST',body:raw,headers:{'X-Signature-Timestamp':time,'X-Signature-Ed25519':signature}}),work=[];
  const ctx={waitUntil:p=>work.push(p)};
  const responses=await Promise.all([worker.fetch(requests(),f.env,ctx),worker.fetch(requests(),f.env,ctx)]);
  assert.ok((await responses[0].json()).type===5);await Promise.all(work);
  assert.equal(f.requests.filter(r=>r.options.method==='PATCH').length,1);
  const health=await (await worker.fetch(new Request('https://bot.test/health'),f.env,ctx)).json();assert.equal(health.credentialsConfigured,true);assert.ok(!JSON.stringify(health).includes(f.env.DISCORD_BOT_TOKEN));
});

test('timed boundary planning deduplicates simultaneous characters and excludes date-only/forecast clocks',async()=>{
  const f=fixture(),first=item(),second=item({id:'pickup-two',title:'루실라'});
  let jobs=await planDeliveries({...f.catalog,entries:[first,second]},sub(),clock,f.env.GAGETHER_ORIGIN);
  assert.equal(jobs.length,1);assert.equal(jobs[0].payload.embeds.length,2);assert.deepEqual(jobs[0].payload.allowed_mentions,{parse:[]});
  const overlap=await planDeliveries({...f.catalog,entries:[first,second]},sub({id:'other-subscription'}),clock,f.env.GAGETHER_ORIGIN);assert.equal(overlap[0].id,jobs[0].id);
  const date=item({timed:false,startAt:null,endAt:null,startDate:'2026-10-23',endDate:'2026-10-24'}),forecast=item({forecast:true});
  assert.equal((await planDeliveries({...f.catalog,entries:[date,forecast]},sub(),clock,f.env.GAGETHER_ORIGIN)).length,0);
  assert.equal((await planDeliveries({...f.catalog,entries:[item({endAt:new Date(clock-60001).toISOString()})]},sub({offsets:[0]}),clock,f.env.GAGETHER_ORIGIN)).length,0);
});

test('broadcast reminder and confirmed LIVE are distinct; cancelled/ended/stale streams do not send',async()=>{
  const f=fixture(),b={status:'scheduled',scheduledAt:new Date(clock+3600000).toISOString(),checkedAt:timestamp(),url:'https://youtube.com/watch?v=abcdefghijk',identity:'abcdefghijk',locale:'ko',live:false};
  const plan=async broadcast=>planDeliveries({...f.catalog,entries:[item({kind:'update',broadcast})]},sub(),clock,f.env.GAGETHER_ORIGIN);
  assert.equal((await plan(b)).length,1);assert.ok(!(await plan(b))[0].payload.content.includes('LIVE'));
  assert.ok((await plan({...b,status:'live',live:true}))[0].payload.content.includes('LIVE'));
  for(const status of ['ended','cancelled'])assert.equal((await plan({...b,status})).length,0);
  assert.equal((await plan({...b,status:'live',live:true,checkedAt:new Date(clock-7200001).toISOString()})).length,0);
  assert.equal((await plan({...b,scheduledAt:null,scheduledDate:'2026-10-23'})).length,0);
});

test('SQLite outbox and lease prevent duplicate sends across ticks and overlapping cron executions',async()=>{
  const f=fixture();f.catalog.entries=[item()];await saveSubscription(f);
  const results=await Promise.all([runScheduler(f.env,clock),runScheduler(f.env,clock)]);
  assert.ok(results.some(r=>r.status==='busy'));assert.equal(f.sent.length,1);
  await runScheduler(f.env,clock);assert.equal(f.sent.length,1);
  assert.equal(f.sqlite.prepare('SELECT state FROM outbox').get().state,'sent');assert.equal(f.sent[0].enforce_nonce,true);
});

test('initial subscription suppresses historical notices, then publishes only newly observed notices',async()=>{
  const f=fixture();f.catalog.entries=[item({id:'old-notice',kind:'update',timed:false,startAt:null,endAt:null})];await saveSubscription(f,sub({topics:['notice'],initialized:false}));
  await runScheduler(f.env,clock);assert.equal(f.sent.length,0);
  clock+=60000;fresh(f);f.catalog.entries.push(item({id:'new-notice',kind:'update',title:'새 공지',sourceUrl:'https://example.test/new',timed:false,startAt:null,endAt:null}));
  await runScheduler(f.env,clock);assert.equal(f.sent.length,1);
  clock+=60000;fresh(f);await runScheduler(f.env,clock);assert.equal(f.sent.length,1);
});

test('429 retries respect Retry-After; changed deadlines cancel queued reminders',async()=>{
  const f=fixture();f.catalog.entries=[item()];await saveSubscription(f);f.setSendMode('429');
  await runScheduler(f.env,clock);assert.equal(f.sent.length,1);assert.equal(f.sqlite.prepare('SELECT state FROM outbox').get().state,'pending');
  clock+=60000;fresh(f);await runScheduler(f.env,clock);assert.equal(f.sent.length,1);
  clock+=60000;fresh(f);f.setSendMode('ok');f.catalog.entries=[item({endAt:new Date(clock+86400000).toISOString()})];
  await runScheduler(f.env,clock);assert.equal(f.sent.length,1);assert.equal(f.sqlite.prepare('SELECT state FROM outbox').get().state,'cancelled');
});

test('ambiguous sends are held and recovered by actual message ID, never blindly retried',async()=>{
  const f=fixture();f.catalog.entries=[item()];await saveSubscription(f);f.setSendMode('timeout');
  await runScheduler(f.env,clock);assert.equal(f.sent.length,1);const nonce=f.sent[0].nonce;assert.equal(f.sqlite.prepare('SELECT state FROM outbox').get().state,'uncertain');
  clock+=60000;fresh(f);f.setSendMode('ok');await runScheduler(f.env,clock);assert.equal(f.sent.length,1);
  f.setRecovered([{id:'823456789012345678',nonce}]);clock+=60000;fresh(f);await runScheduler(f.env,clock);
  const row=f.sqlite.prepare('SELECT state,message_id FROM outbox').get();assert.equal(row.state,'sent');assert.equal(row.message_id,'823456789012345678');assert.equal(f.sent.length,1);
});

test('a rate-limited current reminder is retried after its actual delay and acknowledged by message ID',async()=>{
  const f=fixture();const current=item();f.catalog.entries=[current];await saveSubscription(f);f.setSendMode('429');
  await runScheduler(f.env,clock);clock+=60000;fresh(f);f.setSendMode('ok');await runScheduler(f.env,clock);assert.equal(f.sent.length,1);
  clock+=60000;fresh(f);await runScheduler(f.env,clock);assert.equal(f.sent.length,2);
  assert.equal(f.sqlite.prepare('SELECT state,message_id FROM outbox').get().state,'sent');assert.equal(f.sent[0].nonce,f.sent[1].nonce);
});

test('disabled subscriptions cancel queued work and partial source failure preserves another service',async()=>{
  const f=fixture();f.catalog.entries=[item()];const s=await saveSubscription(f);f.setSendMode('429');await runScheduler(f.env,clock);
  await f.store.toggle(s.id,guild,user,1,false,clock);assert.equal(f.sqlite.prepare('SELECT state FROM outbox').get().state,'cancelled');
  const f2=fixture();f2.catalog.entries=[item()];await saveSubscription(f2);await saveSubscription(f2,sub({id:'other',region:'jp'}));
  const original=globalThis.fetch;globalThis.fetch=async(url,options)=>new URL(url).searchParams.get('region')==='jp'?new Response('Unavailable',{status:503}):original(url,options);
  const result=await runScheduler(f2.env,clock);assert.equal(result.status,'partial');assert.equal(f2.sent.length,1);
});

test('permission failure, disable, unconfigured environment and failed source do not produce unsafe sends',async()=>{
  const f=fixture();f.catalog.entries=[item()];const s=await saveSubscription(f);f.setSendMode('403');
  await runScheduler(f.env,clock);assert.equal(f.sqlite.prepare('SELECT state FROM outbox').get().state,'failed');
  await f.store.toggle(s.id,guild,user,1,false,clock);clock+=60000;fresh(f);await runScheduler(f.env,clock);assert.equal(f.sent.length,1);
  assert.equal((await runScheduler({...f.env,SCHEDULER_ENABLED:'false'},clock)).status,'disabled');
  const f2=fixture();await saveSubscription(f2);globalThis.fetch=async()=>new Response('Service unavailable',{status:503});
  const result=await runScheduler(f2.env,clock);assert.equal(result.status,'failed');assert.equal(f2.sent.length,0);
});

test('public catalog cache uses ETag and rejects invalid/stale responses without replacing good saved data',async()=>{
  const f=fixture();await loadCatalog(f.env,'ko','kr',clock);const count=f.requests.length;
  await loadCatalog(f.env,'ko','kr',clock);assert.equal(f.requests.length,count);
  clock+=31000;globalThis.fetch=async(_url,options)=>{assert.equal(options.headers['If-None-Match'],'"'+'a'.repeat(64)+'"');return new Response(null,{status:304});};
  assert.equal((await loadCatalog(f.env,'ko','kr',clock)).schemaVersion,1);
  clock+=31000;globalThis.fetch=async()=>Response.json({...f.catalog,serverTime:new Date(clock-600000).toISOString()});
  await assert.rejects(()=>loadCatalog(f.env,'ko','kr',clock),/validation/);
  assert.equal(f.sqlite.prepare('SELECT etag FROM catalog_cache').get().etag,'"'+'a'.repeat(64)+'"');
});
