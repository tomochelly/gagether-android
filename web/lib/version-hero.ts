import type {Entry,Game,Region} from './types';
import {inSchedule} from './presentation';

// A newly reviewed preview must never displace the currently released version.
export function currentVersion(entries:Entry[],game:Game,region:Region,now:number):Entry|undefined{
 return entries.filter(e=>e.gameId===game.id&&e.versionHero&&!e.hidden&&inSchedule(e,game,region)
  &&(!e.startAt||Date.parse(e.startAt)<=now)&&(!e.endAt||Date.parse(e.endAt)>now)
  &&(!e.publishedAt||Date.parse(e.publishedAt)<=now))
  .sort((a,b)=>(Date.parse(b.startAt||b.publishedAt||'1970-01-01')-Date.parse(a.startAt||a.publishedAt||'1970-01-01'))||a.id.localeCompare(b.id))[0];
}
