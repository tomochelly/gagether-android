import type {Catalog,Env,Item,Message,Subscription,Topic} from './types';
import {BotStore} from './store';
import {loadCatalog} from './catalog';
import {hash,safeUrl} from './security';
import {discordRequest,DiscordError} from './rest';
import {itemEmbed,clock} from './views';
import {t,topicText} from './i18n';

export type Delivery={id:string;subscriptionId:string;guildId:string;channelId:string;payload:Message;expiresAt:number};
type OutboxRow={id:string;subscription_id:string;guild_id:string;channel_id:string;payload:string;state:string;attempts:number;claim_token:string;created_at:number;expires_at:number};
const GRACE=5*60000;
const topicFor=(item:Item,edge:'start'|'end'):Topic|undefined=>item.kind==='pickup'||item.kind==='weapon'?`pickup-${edge}`:item.kind==='event'?`event-${edge}`:item.kind==='package'&&edge==='end'?'package-end':undefined;
export const noticeKey=(e:Item)=>[e.gameId,e.region,e.sourceUrl||e.id].join('|');

/** Pure planning, apart from stable hashes. No clock is synthesized for date-only or forecast rows. */
export async function planDeliveries(catalog:Catalog,sub:Subscription,now:number,origin:string,newNotices:Set<string>=new Set()):Promise<Delivery[]>{
  const items=catalog.entries.filter(e=>sub.games.includes(e.gameId));
  const planned=new Map<string,{key:string;items:Item[];topic:Topic|'live';clock?:string;expires:number}>();
  for(const item of items){
    const b=item.broadcast;
    if(b){
      if(!sub.topics.includes('broadcast'))continue;
      const age=now-Date.parse(b.checkedAt);
      if(!Number.isFinite(age)||age< -300000||age>2*3600000)continue;
      if(b.status==='live'&&b.live){
        const key=['live',item.gameId,item.region,b.identity].join('|');
        planned.set(key,{key,items:[item],topic:'live',expires:now+GRACE});
      }else if(b.status==='scheduled'){
        const start=b.programStartAt||b.scheduledAt,at=Date.parse(start||'');
        if(!Number.isFinite(at)||at<now-GRACE)continue;
        for(const offset of sub.offsets){
          const due=at-offset*60000;
          if(due<=now&&due>now-GRACE&&due>=sub.createdAt){
            const key=['broadcast',item.gameId,item.region,b.identity,start,offset].join('|');
            planned.set(key,{key,items:[item],topic:'broadcast',clock:start!,expires:Math.min(due+GRACE,at+GRACE)});
          }
        }
      }
      continue;
    }
    if(sub.topics.includes('notice')&&item.kind==='update'&&item.sourceKind==='official'&&newNotices.has(noticeKey(item))){
      const published=Date.parse(item.publishedAt||'');
      if(!Number.isFinite(published)||published<=now&&published>now-7*86400000){
        const key='notice|'+noticeKey(item);
        planned.set(key,{key,items:[item],topic:'notice',expires:now+86400000});
      }
    }
    if(!item.timed||item.forecast)continue;
    for(const edge of ['start','end'] as const){
      const topic=topicFor(item,edge),value=edge==='start'?item.startAt:item.endAt,at=Date.parse(value||'');
      if(!topic||!sub.topics.includes(topic)||!Number.isFinite(at))continue;
      // A delayed reminder must never say an already ended pickup is about to end.
      if(edge==='end'&&at<now-60000||edge==='start'&&item.endAt&&Date.parse(item.endAt)<=now)continue;
      for(const offset of sub.offsets){
        const due=at-offset*60000;
        if(due>now||due<=now-GRACE||due<sub.createdAt)continue;
        const group=item.group||item.id;
        const key=[topic,item.gameId,item.region,item.poolType||item.kind,group,value,offset].join('|');
        const old=planned.get(key);
        if(old)old.items.push(item);else planned.set(key,{key,items:[item],topic,clock:value!,expires:Math.min(due+GRACE,edge==='end'?at+60000:Infinity)});
      }
    }
  }
  const deliveries:Delivery[]=[];
  for(const job of planned.values()){
    // Delivery identity is channel/event based, not subscription based: overlapping rules do not spam.
    const id=(await hash([sub.guildId,sub.channelId,sub.locale,job.key].join('|'))).slice(0,24);
    const title=job.topic==='live'?'🔴 LIVE':job.topic==='notice'?t('newNotice',sub.locale):job.topic==='broadcast'?t('broadcastReminder',sub.locale):topicText(job.topic,sub.locale);
    const payload:Message={content:`**${title}**${job.clock?' · '+clock(job.clock,true):''}`,embeds:job.items.slice(0,5).map(item=>itemEmbed(item,catalog,origin,now)),components:[{type:1,components:[{type:2,style:5,label:t('site',sub.locale),url:safeUrl(job.items[0].url,origin)}]}],allowed_mentions:{parse:[]}};
    deliveries.push({id,subscriptionId:sub.id,guildId:sub.guildId,channelId:sub.channelId,payload,expiresAt:job.expires});
  }
  return deliveries;
}

export async function runScheduler(env:Env,now=Date.now()){
  if(env.BOT_ENABLED!=='true'||env.SCHEDULER_ENABLED!=='true'||!env.DISCORD_BOT_TOKEN)return {status:'disabled'};
  const store=new BotStore(env.DB),token=crypto.randomUUID();
  const started=Date.now();
  const lease=await env.DB.prepare(`INSERT INTO leases(id,token,expires_at) VALUES('scheduler',?,?)
    ON CONFLICT(id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE leases.expires_at<?`).bind(token,now+55000,now).run();
  if(!lease.meta?.changes)return {status:'busy'};
  const errors:string[]=[],validJobs=new Map<string,Delivery>();let sent=0,held=0,failed=0;
  try{
    const active=await store.subscriptions();
    // Rotate the starting point so a slow source cannot starve the same later subscriptions.
    const pivot=active.length?Math.floor(now/60000)%active.length:0;
    const subscriptions=[...active.slice(pivot),...active.slice(0,pivot)];
    if(subscriptions.length>50)throw new Error('Subscription capacity exceeded');
    const feeds=new Map<string,Catalog>();
    for(const sub of subscriptions){
      if(Date.now()-started>15000){errors.push('run-budget');break;}
      const scope=sub.locale+':'+sub.region;
      try{
        let catalog=feeds.get(scope);if(!catalog){catalog=await loadCatalog(env,sub.locale,sub.region,now);feeds.set(scope,catalog);}
        const rows=(await env.DB.prepare('SELECT notice_key FROM notice_seen WHERE subscription_id=?').bind(sub.id).all<{notice_key:string}>()).results;
        const seen=new Set(rows.map(r=>r.notice_key));
        const notices=catalog.entries.filter(e=>e.kind==='update'&&!e.broadcast&&e.sourceKind==='official'&&sub.games.includes(e.gameId));
        const fresh=new Set(notices.map(noticeKey).filter(k=>!seen.has(k)));
        const jobs=await planDeliveries(catalog,sub,now,env.GAGETHER_ORIGIN,sub.initialized?fresh:new Set());
        const statements=[];
        for(const job of jobs){
          validJobs.set(job.id,job);
          statements.push(env.DB.prepare(`INSERT INTO outbox(id,subscription_id,guild_id,channel_id,payload,available_at,expires_at,created_at)
            VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload WHERE outbox.state='pending'`).bind(job.id,sub.id,sub.guildId,sub.channelId,JSON.stringify(job.payload),now,job.expiresAt,now));
        }
        if(fresh.size)statements.push(env.DB.prepare('INSERT OR IGNORE INTO notice_seen(subscription_id,notice_key) SELECT ?,value FROM json_each(?)').bind(sub.id,JSON.stringify([...fresh])));
        if(!sub.initialized)statements.push(env.DB.prepare('UPDATE subscriptions SET initialized=1 WHERE id=? AND revision=?').bind(sub.id,sub.revision));
        for(let index=0;index<statements.length;index+=25)await env.DB.batch(statements.slice(index,index+25));
      }catch{errors.push('catalog:'+scope);}
    }
    // Expired claims are uncertain, not silently retried. Discord may already have received them.
    await env.DB.prepare("UPDATE outbox SET state='uncertain',last_error='Interrupted send' WHERE state='sending' AND available_at<?").bind(now-2*60000).run();
    const uncertain=(await env.DB.prepare("SELECT * FROM outbox WHERE state='uncertain' ORDER BY created_at LIMIT 5").all<OutboxRow>()).results;
    const recoveredChannels=new Map<string,Record<string,unknown>[]>();
    for(const job of uncertain){
      if(Date.now()-started>15000)break;
      try{
        let messages=recoveredChannels.get(job.channel_id);
        if(!messages){const value=await discordRequest(env,`/channels/${job.channel_id}/messages?limit=100`);messages=Array.isArray(value)?value:[];recoveredChannels.set(job.channel_id,messages);}
        const found=messages.find(m=>String(m.nonce)===job.id);
        if(found?.id)await env.DB.prepare("UPDATE outbox SET state='sent',message_id=?,last_error=NULL WHERE id=? AND state='uncertain'").bind(String(found.id),job.id).run();
        else held++;
      }catch{held++;}
    }
    const due=(await env.DB.prepare("SELECT * FROM outbox WHERE state='pending' AND available_at<=? AND expires_at>? ORDER BY created_at LIMIT 20").bind(now,now).all<OutboxRow>()).results;
    for(const job of due){
      if(Date.now()-started>20000)break;
      // Refresh delivery content and validate the current schedule before each send.
      const planned=validJobs.get(job.id);
      const sub=subscriptions.find(s=>s.id===job.subscription_id);
      if(!sub)continue;
      const scope=sub.locale+':'+sub.region;
      if(!feeds.has(scope)||errors.includes('catalog:'+scope))continue;
      if(!planned){
        // Notice jobs can survive a Discord rate limit after their ID entered notice_seen.
        const payload=JSON.parse(job.payload) as Message;
        const isNotice=payload.content===`**${t('newNotice',sub.locale)}**`;
        if(!isNotice){await env.DB.prepare("UPDATE outbox SET state='cancelled' WHERE id=? AND state='pending'").bind(job.id).run();continue;}
        const current=feeds.get(scope)!.entries.find(e=>e.kind==='update'&&!e.broadcast&&payload.embeds?.some(x=>x.url===safeUrl(e.url,env.GAGETHER_ORIGIN)));
        if(!current||!sub.topics.includes('notice')||!sub.games.includes(current.gameId)){await env.DB.prepare("UPDATE outbox SET state='cancelled' WHERE id=? AND state='pending'").bind(job.id).run();continue;}
      }
      const currentLease=await env.DB.prepare("SELECT token FROM leases WHERE id='scheduler' AND expires_at>?").bind(Date.now()+8000).first<{token:string}>();
      if(currentLease?.token!==token)break;
      const claim=crypto.randomUUID();
      const locked=await env.DB.prepare("UPDATE outbox SET state='sending',claim_token=?,attempts=attempts+1,available_at=? WHERE id=? AND state='pending'").bind(claim,Date.now(),job.id).run();
      if(!locked.meta?.changes)continue;
      // Disable may race with planning; recheck authoritative subscription immediately before POST.
      const enabled=await env.DB.prepare('SELECT enabled,revision FROM subscriptions WHERE id=?').bind(sub.id).first<{enabled:number;revision:number}>();
      if(!enabled?.enabled||enabled.revision!==sub.revision){await env.DB.prepare("UPDATE outbox SET state='cancelled' WHERE id=? AND claim_token=?").bind(job.id,claim).run();continue;}
      try{
        const result=await discordRequest(env,`/channels/${job.channel_id}/messages`,'POST',{...(planned?.payload||JSON.parse(job.payload)),nonce:job.id,enforce_nonce:true,allowed_mentions:{parse:[]}});
        if(!result?.id)throw new Error('Missing Discord message receipt');
        await env.DB.prepare("UPDATE outbox SET state='sent',message_id=?,last_error=NULL WHERE id=? AND claim_token=?").bind(String(result.id),job.id,claim).run();sent++;
      }catch(error){
        const retry=error instanceof DiscordError&&error.status===429;
        const permanent=error instanceof DiscordError&&error.status>=400&&error.status<500&&!retry;
        await env.DB.prepare('UPDATE outbox SET state=?,available_at=?,last_error=? WHERE id=? AND claim_token=?').bind(retry?'pending':permanent?'failed':'uncertain',Date.now()+(retry?error.retryAfter:0),retry?'rate-limited':permanent?'permission-or-request':'send-result-unknown',job.id,claim).run();
        if(permanent)failed++;
        if(!retry&&!permanent)held++;
        if(retry||error instanceof DiscordError&&error.status===401)break;
      }
    }
    await env.DB.prepare("UPDATE outbox SET state='expired' WHERE state='pending' AND expires_at<=?").bind(now).run();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now),
      env.DB.prepare('DELETE FROM interaction_receipts WHERE expires_at<?').bind(now),
      env.DB.prepare("DELETE FROM outbox WHERE state IN ('sent','cancelled','expired') AND created_at<?").bind(now-90*86400000),
    ]);
    const result={status:errors.length?(feeds.size?'partial':'failed'):held||failed?'partial':'success',sent,held,failed,errors};await store.health('scheduler',result,now);return result;
  }catch{
    await store.health('scheduler',{status:'failed'},now);return {status:'failed'};
  }finally{await env.DB.prepare("DELETE FROM leases WHERE id='scheduler' AND token=?").bind(token).run();}
}
