// Anonymous daily browser IDs, never account IDs. No IP, URL query or personal content.
export const usageViews=['overview','game','library','timeline','videos','history','saved','sources','detail'] as const;
const gameIds=['wuwa','bluearchive','nikke','endfield','umamusume','nte','gfl2','arknights','genshin','hsr','zzz','trickcal','hi3','reverse1999','stellasora'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type UsageInput={visitorId:string;eventId:string;type:'view'|'heartbeat';view:string;gameId:string|null;device:string;locale:string;referrer:string};
export function usageDay(now=Date.now()){return new Date(now+9*3600000).toISOString().slice(0,10);}
export function usageInput(raw:unknown):UsageInput|null{
 if(!raw||typeof raw!=='object')return null;const x=raw as Record<string,unknown>;
 if(typeof x.visitorId!=='string'||!uuid.test(x.visitorId)||typeof x.eventId!=='string'||!uuid.test(x.eventId)||!['view','heartbeat'].includes(String(x.type))||!usageViews.includes(x.view as typeof usageViews[number]))return null;
 if(!['web-desktop','web-mobile','web-tablet','android-app'].includes(String(x.device))||!['ko','en','ja','zh'].includes(String(x.locale)))return null;
 if(x.gameId!=null&&!gameIds.includes(String(x.gameId)))return null;
 let referrer='direct';if(typeof x.referrer==='string'&&x.referrer.length<254&&/^(?:[a-z0-9-]+\.)+[a-z]{2,63}$/i.test(x.referrer))referrer=x.referrer.toLowerCase();
 return {visitorId:x.visitorId,eventId:x.eventId,type:x.type as UsageInput['type'],view:String(x.view),gameId:x.gameId?String(x.gameId):null,device:String(x.device),locale:String(x.locale),referrer};
}
export function usageAllowed(request:Request){
 const origin=request.headers.get('origin');
 return origin===new URL(request.url).origin&&request.headers.get('sec-fetch-site')!=='cross-site'&&!/bot|crawler|spider|headless|preview/i.test(request.headers.get('user-agent')||'')&&request.headers.get('dnt')!=='1'&&request.headers.get('sec-gpc')!=='1';
}
export type UsageSummary={asOf:string;startedAt:string|null;days:number;active:number;todayVisitors:number;todayViews:number;periodVisitors:number;periodViews:number;daily:{day:string;visitors:number;views:number}[];games:{key:string;count:number}[];pages:{key:string;count:number}[];devices:{key:string;count:number}[];locales:{key:string;count:number}[];referrers:{key:string;count:number}[]};
