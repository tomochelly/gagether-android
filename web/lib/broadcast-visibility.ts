import type {Entry,Game,Locale,Region,OfficialBroadcast} from './types';
import {inSchedule} from './presentation';
import {contentLanguage} from './content-audience';
import {dayKey} from './schedule';
// A stale reservation never becomes a live broadcast merely because its clock passed.
export function broadcastState(b:OfficialBroadcast,now:number):'scheduled'|'live'|'inactive'{
 if(!b.official||!b.metadataVerified||b.status==='ended'||b.status==='cancelled'||b.endedAt&&Date.parse(b.endedAt)<=now)return 'inactive';
 const age=now-Date.parse(b.statusCheckedAt||b.verifiedAt);if(!Number.isFinite(age)||age< -300000)return 'inactive';
 if(b.status==='live')return age<=2*3600000?'live':'inactive';
 if(b.scheduledAt){const start=Date.parse(b.scheduledAt);return now<=start||now-start<=2*3600000&&age<=2*3600000?'scheduled':'inactive';}
 if(b.scheduledDate)return dayKey(now)<=b.scheduledDate?'scheduled':'inactive';
 return age<=24*3600000?'scheduled':'inactive';
}

/** A display language never selects another service's stream as a fallback. */
export function gameBroadcasts(entries:Entry[],game:Game,region:Region,locale:Locale,now:number){
 const videos=new Map<string,Entry>();
 for(const e of entries){
  if(e.hidden||e.gameId!==game.id||!e.broadcast||e.broadcast.locale!==contentLanguage(game,region,locale)||!inSchedule(e,game,region)||broadcastState(e.broadcast,now)==='inactive')continue;
  const key=e.broadcast.youtubeId||e.id,old=videos.get(key);
  if(!old||Date.parse(e.broadcast.statusCheckedAt||e.broadcast.verifiedAt)>Date.parse(old.broadcast!.statusCheckedAt||old.broadcast!.verifiedAt))videos.set(key,e);
 }
 return [...videos.values()].sort((a,b)=>Number(b.broadcast!.status==='live')-Number(a.broadcast!.status==='live')||(Date.parse(a.broadcast!.scheduledAt||a.broadcast!.scheduledDate||'')||Infinity)-(Date.parse(b.broadcast!.scheduledAt||b.broadcast!.scheduledDate||'')||Infinity));
}
