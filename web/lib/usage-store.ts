import {env} from 'cloudflare:workers';
import {usageDay,type UsageInput,type UsageSummary} from './usage';
export async function recordUsage(x:UsageInput,now=Date.now()){
 const db=env.DB!;const day=usageDay(now),id=day+':'+x.visitorId;
 const statements=[db.prepare('INSERT OR IGNORE INTO usage_meta (key,value) VALUES (?,?)').bind('startedAt',new Date(now).toISOString()),db.prepare('INSERT INTO usage_visitors (id,day,first_seen,last_seen,device,locale,referrer) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=MAX(usage_visitors.last_seen,excluded.last_seen)').bind(id,day,now,now,x.device,x.locale,x.referrer)];
 if(x.type==='view')statements.push(db.prepare('INSERT OR IGNORE INTO usage_views (id,visitor_id,day,created_at,view,game_id) VALUES (?,?,?,?,?,?)').bind(day+':'+x.eventId,id,day,now,x.view,x.gameId));
 await db.batch(statements);
 // Bounded retention cleanup, also run when the owner opens the dashboard.
 if(Math.random()<0.02)await pruneUsage(now);
}
export async function pruneUsage(now=Date.now()){
 const cutoff=usageDay(now-30*86400000);const db=env.DB!;
 await db.batch([db.prepare('DELETE FROM usage_views WHERE id IN (SELECT id FROM usage_views WHERE day<? LIMIT 500)').bind(cutoff),db.prepare('DELETE FROM usage_visitors WHERE id IN (SELECT id FROM usage_visitors WHERE day<? LIMIT 500)').bind(cutoff)]);
}
export async function readUsage(days:number,now=Date.now()):Promise<UsageSummary>{
 const db=env.DB!,today=usageDay(now),from=usageDay(now-(days-1)*86400000);
 const results=await db.batch([
  db.prepare("SELECT value FROM usage_meta WHERE key='startedAt'"),
  db.prepare('SELECT COUNT(*) AS count FROM usage_visitors WHERE day=? AND last_seen>=?').bind(today,now-5*60000),
  db.prepare('SELECT day,COUNT(*) AS count FROM usage_visitors WHERE day>=? GROUP BY day ORDER BY day').bind(from),
  db.prepare('SELECT day,COUNT(*) AS count FROM usage_views WHERE day>=? GROUP BY day ORDER BY day').bind(from),
  db.prepare('SELECT game_id AS key,COUNT(*) AS count FROM usage_views WHERE day>=? AND game_id IS NOT NULL GROUP BY game_id ORDER BY count DESC').bind(from),
  db.prepare('SELECT view AS key,COUNT(*) AS count FROM usage_views WHERE day>=? GROUP BY view ORDER BY count DESC').bind(from),
  ...['device','locale','referrer'].map(column=>db.prepare(`SELECT ${column} AS key,COUNT(*) AS count FROM usage_visitors WHERE day>=? GROUP BY ${column} ORDER BY count DESC LIMIT 12`).bind(from))
 ]);
 const visitors=new Map((results[2].results as {day:string;count:number}[]).map(x=>[x.day,x.count]));const views=new Map((results[3].results as {day:string;count:number}[]).map(x=>[x.day,x.count]));
 const daily=Array.from({length:days},(_,i)=>{const day=usageDay(now-(days-1-i)*86400000);return {day,visitors:visitors.get(day)||0,views:views.get(day)||0};});
 return {asOf:new Date(now).toISOString(),startedAt:(results[0].results[0] as {value:string}|undefined)?.value||null,days,active:Number((results[1].results[0] as {count:number}|undefined)?.count||0),todayVisitors:visitors.get(today)||0,todayViews:views.get(today)||0,periodVisitors:daily.reduce((n,x)=>n+x.visitors,0),periodViews:daily.reduce((n,x)=>n+x.views,0),daily,games:results[4].results as UsageSummary['games'],pages:results[5].results as UsageSummary['pages'],devices:results[6].results as UsageSummary['devices'],locales:results[7].results as UsageSummary['locales'],referrers:results[8].results as UsageSummary['referrers']};
}
