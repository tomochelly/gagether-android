import type {Entry,Locale,Region} from './types';
import type {SiteSettings} from './editorial';
import type {Catalog,Game,Item} from '../discord/src/types';
import {catalogGames} from './editorial';
import {effectiveRegion} from './presentation';
import {audienceRestrictions,contentInAudience} from './content-audience';
import {displayTitle,displaySummary,originalName} from './content-display';
import {artworkForLocale,serviceArtworkLocale,isBrandArtwork} from './artwork';
import {timedSchedule} from './pickup-history';
import {gameBroadcasts,gameBroadcastArchive,broadcastState} from './broadcast-visibility';

// A public, bounded read projection. Never return editorial metadata or copy it back to storage.
export function discordFeed(entries:Entry[],settings:SiteSettings,locale:Locale,requested:Region,now:number):Omit<Catalog,'revision'|'serverTime'>{
  const allGames=catalogGames(settings),restrict=audienceRestrictions(entries);
  const games:Game[]=allGames.map(g=>({
    id:g.id,name:g.name[locale],icon:g.icon,color:g.color,regions:g.regions,
    canonicalRegions:Object.fromEntries((['kr','jp','global','cn'] as Region[]).map(r=>[r,effectiveRegion(g,r)])) as Game['canonicalRegions'],
  }));
  const visibleBroadcasts=new Set(allGames.flatMap(g=>[
    ...gameBroadcasts(entries,g,requested,locale,now),...gameBroadcastArchive(entries,g,requested,locale),
  ]).map(e=>e.id));
  const items:Item[]=[];
  for(const entry of entries){
    const game=allGames.find(g=>g.id===entry.gameId);
    if(!game||entry.hidden||requested==='cn'&&!game.regions.includes('cn')||!contentInAudience(restrict(entry),game,requested,locale))continue;
    if(entry.pickupArchive&&(entry.kind==='weapon'&&entry.poolType!=='support'||entry.poolType==='weapon'))continue;
    if(entry.broadcast&&!visibleBroadcasts.has(entry.id))continue;
    const art=(value:import('./types').EntityArtwork)=>{
      const selected=artworkForLocale(value,locale,'full',serviceArtworkLocale(entry.region,entry.gameId));
      return selected.imageVerified&&!isBrandArtwork(selected.image,game)?selected.image:undefined;
    };
    const b=entry.broadcast;
    items.push({
      id:entry.id,gameId:entry.gameId,region:entry.region,kind:entry.kind,
      title:displayTitle(entry,locale).slice(0,500),summary:displaySummary(entry,locale).slice(0,1200),
      url:`/${locale}/games/${encodeURIComponent(entry.gameId)}?region=${requested}&entry=${encodeURIComponent(entry.id)}`,
      sourceUrl:entry.sourceUrl,sourceKind:entry.sourceKind||'official',
      startAt:entry.startAt,endAt:entry.endAt,startDate:entry.startDate||entry.pickupArchive?.startDate,endDate:entry.endDate||entry.pickupArchive?.endDate,
      publishedAt:entry.publishedAt,forecast:entry.pickupArchive?.status==='forecast',
      timed:!b&&timedSchedule(entry)&&entry.pickupArchive?.status!=='forecast'&&!!(entry.startAt||entry.endAt),
      poolType:entry.poolType,group:entry.pickupGroup,image:art(entry),
      members:(entry.pickupMembers||[]).map(m=>({name:originalName(m.name,locale),role:m.role||'featured',type:m.type,rarity:m.rarity,image:art(m)})),
      ...(b?{broadcast:{status:b.status,scheduledAt:b.scheduledAt,programStartAt:b.programStartAt,scheduledDate:b.scheduledDate,
        checkedAt:b.statusCheckedAt||b.verifiedAt,url:b.sourceUrl,locale:b.locale,identity:b.youtubeId||b.sourceUrl,live:broadcastState(b,now)==='live'}}:{}),
    });
  }
  return {schemaVersion:1,locale,requestedRegion:requested,games,entries:items};
}
