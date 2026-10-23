import type {Database,Session,Settings,Subscription,Region} from './types';
type SubscriptionRow={id:string;guild_id:string;channel_id:string;actor_id:string;settings:string;enabled:number;revision:number;created_at:number;updated_at:number;initialized:number};
export class Conflict extends Error {constructor(){super('Settings changed or expired. Open /알림 again.');}}
export class BotStore {
  constructor(public db:Database){}
  async subscriptions(guildId?:string){
    const query=guildId?this.db.prepare('SELECT * FROM subscriptions WHERE guild_id=? ORDER BY updated_at DESC').bind(guildId):this.db.prepare('SELECT * FROM subscriptions WHERE enabled=1 ORDER BY updated_at DESC LIMIT 200');
    const rows=(await query.all<SubscriptionRow>()).results;
    return rows.map(r=>({...JSON.parse(r.settings) as Settings,id:r.id,guildId:r.guild_id,channelId:r.channel_id,actorId:r.actor_id,enabled:!!r.enabled,revision:r.revision,createdAt:r.created_at,updatedAt:r.updated_at,initialized:!!r.initialized} satisfies Subscription));
  }
  async newSession(guildId:string,actorId:string,locale:Settings['locale'],now:number){
    const s:Session={id:crypto.randomUUID().replaceAll('-',''),guildId,actorId,settings:{games:[],region:'kr',locale,topics:['pickup-start','pickup-end','broadcast','notice'],offsets:[60,0],channelId:''},revision:0,expiresAt:now+15*60000};
    await this.db.prepare('INSERT INTO sessions(id,guild_id,actor_id,settings,revision,expires_at) VALUES(?,?,?,?,?,?)').bind(s.id,guildId,actorId,JSON.stringify(s.settings),0,s.expiresAt).run();return s;
  }
  async session(id:string,guildId:string,actorId:string,revision:number,now:number){
    const r=await this.db.prepare('SELECT * FROM sessions WHERE id=? AND guild_id=? AND actor_id=? AND revision=? AND expires_at>?').bind(id,guildId,actorId,revision,now).first<{settings:string;expires_at:number}>();
    if(!r)throw new Conflict();return {id,guildId,actorId,settings:JSON.parse(r.settings),revision,expiresAt:r.expires_at} as Session;
  }
  async advance(s:Session){
    const r=await this.db.prepare('UPDATE sessions SET settings=?,revision=revision+1 WHERE id=? AND revision=? AND expires_at>?').bind(JSON.stringify(s.settings),s.id,s.revision,Date.now()).run();
    if(!r.meta?.changes)throw new Conflict();return {...s,revision:s.revision+1};
  }
  async commit(s:Session,now:number){
    // Replaying a Save click cannot overwrite a newer subscription or restart its notice baseline.
    const id=[s.guildId,s.settings.channelId,s.settings.region,s.settings.locale].join(':');
    const result=await this.db.batch([
      this.db.prepare(`INSERT INTO subscriptions(id,guild_id,channel_id,actor_id,settings,created_at,updated_at)
        SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE id=? AND revision=? AND expires_at>?)
        ON CONFLICT(id) DO UPDATE SET settings=excluded.settings,actor_id=excluded.actor_id,enabled=1,revision=subscriptions.revision+1,updated_at=excluded.updated_at,initialized=0
        WHERE subscriptions.revision=?`).bind(id,s.guildId,s.settings.channelId,s.actorId,JSON.stringify(s.settings),now,now,s.id,s.revision,now,s.settings.baseRevision||0),
      this.db.prepare('INSERT INTO audit(guild_id,actor_id,action,target_id,created_at) SELECT ?,?,?,?,? WHERE changes()>0').bind(s.guildId,s.actorId,'save',id,now),
      this.db.prepare('DELETE FROM sessions WHERE id=? AND revision=? AND expires_at>? AND changes()>0').bind(s.id,s.revision,now),
    ]);
    if(!(result[0] as {meta?:{changes?:number}})?.meta?.changes)throw new Conflict();
    await this.db.prepare("UPDATE outbox SET state='cancelled' WHERE subscription_id=? AND state='pending'").bind(id).run();
    return id;
  }
  async toggle(id:string,guildId:string,actorId:string,revision:number,enabled:boolean,now:number){
    const r=await this.db.prepare('UPDATE subscriptions SET enabled=?,revision=revision+1,updated_at=?,initialized=0 WHERE id=? AND guild_id=? AND revision=?').bind(enabled?1:0,now,id,guildId,revision).run();
    if(!r.meta?.changes)throw new Conflict();
    await this.db.prepare("UPDATE outbox SET state='cancelled' WHERE subscription_id=? AND state='pending'").bind(id).run();
    await this.db.prepare('INSERT INTO audit(guild_id,actor_id,action,target_id,created_at) VALUES(?,?,?,?,?)').bind(guildId,actorId,enabled?'enable':'disable',id,now).run();
  }
  async preference(guildId:string,userId:string,gameId='all'){return (await this.db.prepare('SELECT region FROM preferences WHERE id=?').bind(guildId+':'+userId+':'+gameId).first<{region:Region}>())?.region;}
  async remember(guildId:string,userId:string,region:Region,gameId='all'){await this.db.prepare('INSERT INTO preferences(id,region) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET region=excluded.region').bind(guildId+':'+userId+':'+gameId,region).run();}
  async health(id:string,value:unknown,now:number){await this.db.prepare('INSERT INTO bot_health(id,value,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(id,JSON.stringify(value),now).run();}
}
