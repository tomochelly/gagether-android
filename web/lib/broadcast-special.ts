import type {Entry,Game,Locale,Region} from './types';
import {contentInAudience,contentLanguage} from './content-audience';
import reviewedLocales from '../content/reviewed-recap-locales.json' with {type:'json'};
const bannerLifetime=3*86400000;
/** A fresh review or extended editor deadline cannot revive an old show. */
export function broadcastBannerTime(e:Entry,entries:Entry[]){
 const r=e.broadcastRecap;if(!r)return NaN;
 const b=entries.find(x=>x.gameId===e.gameId&&x.broadcast?.youtubeId===r.youtubeId&&x.broadcast.official&&x.broadcast.metadataVerified&&x.broadcast.status==='ended'&&(!e.sourceLocale||x.broadcast.locale===e.sourceLocale))?.broadcast;
 const end=Date.parse(b?.endedAt||'');if(Number.isFinite(end))return end;
 // When the end is unavailable, use original publication/start as a
 // conservative fallback. Review/import/check clocks are never used.
 const published=Date.parse(e.publishedAt||'');return Number.isFinite(published)?published:Date.parse(b?.actualStartAt||b?.programStartAt||b?.scheduledAt||'');
}
export function broadcastSpecial(entries:Entry[],game:Game,region:Region,locale:Locale,now:number){
 const target=contentLanguage(game,region,locale),native=(e:Entry)=>!e.sourceLocale||e.sourceLocale===target;
 return entries.filter(e=>{
  const r=e.broadcastRecap;if(e.hidden||e.kind!=='update'||!r||!contentInAudience(e,game,region,locale))return false;
  if(locale==='ko'&&e.sourceLocale==='ja')return false;
  if(!native(e)&&!(e.translatedLocales?.includes(locale)&&reviewedLocales.some(s=>s.id===e.id&&s.gameId===e.gameId&&s.sourceUrl===e.sourceUrl&&s.locales.includes(locale))))return false;
  const time=broadcastBannerTime(e,entries),expiry=Math.min(Date.parse(r.bannerUntil),time+bannerLifetime);
  return Number.isFinite(time)&&time<=now+300000&&expiry>now&&Date.parse(r.reviewedAt)<=now+300000&&!!e.title[locale];
 }).sort((a,b)=>Number(native(b))-Number(native(a))||broadcastBannerTime(b,entries)-broadcastBannerTime(a,entries)||Date.parse(b.broadcastRecap!.reviewedAt)-Date.parse(a.broadcastRecap!.reviewedAt)||a.id.localeCompare(b.id))[0];
}
