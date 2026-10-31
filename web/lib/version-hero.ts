import type {Entry,Game,Region} from './types';
import {dateInZone} from './display-time';
import {serviceZone} from './event-presentation';
import {inSchedule} from './presentation';

// A newly reviewed preview must never displace the currently released version.
export function currentVersion(entries:Entry[],game:Game,region:Region,now:number):Entry|undefined{
 return entries.filter(e=>e.gameId===game.id&&e.versionHero&&!e.hidden&&inSchedule(e,game,region)
  &&(!e.startAt||Date.parse(e.startAt)<=now)&&(!e.endAt||Date.parse(e.endAt)>now)
  &&(!e.startDate||e.startAt||e.startDate<=dateInZone(now,serviceZone(e)))&&(!e.endDate||e.endAt||e.endDate>=dateInZone(now,serviceZone(e)))
  &&(!e.publishedAt||Date.parse(e.publishedAt)<=now))
  .sort((a,b)=>(Date.parse(b.startAt||b.startDate||b.publishedAt||'1970-01-01')-Date.parse(a.startAt||a.startDate||a.publishedAt||'1970-01-01'))||a.id.localeCompare(b.id))[0];
}
