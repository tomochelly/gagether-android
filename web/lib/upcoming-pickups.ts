import type {Entry,EntityArtwork,Locale,Localized} from './types';
import {featuredMembers} from './presentation';
import {isPickup,pickupPeriod,pickupStart,pickupEnd} from './pickup-history';
import {artworkForLocale,serviceArtworkLocale} from './artwork';
import {dayKey} from './schedule';
import {estimatedStart} from './pickup-estimates';

export type UpcomingPickup={id:string;entry:Entry;name:Localized;type:string;art?:EntityArtwork;start?:string;end?:string};
// Only reviewed full compositions belong in this preview. A character cutout or
// version poster must never silently fill an unreleased character's image slot.
export function upcomingArtwork(art:EntityArtwork|undefined,entry:Entry,locale:Locale){
 if(!art)return undefined;
 const full=artworkForLocale(art,locale,'full',serviceArtworkLocale(entry.region,entry.gameId));
 if(!full.image||!full.imageVerified||!['splash','banner','support'].includes(full.imageKind||''))return undefined;
 // Use this full banner's composition, not a legacy text-free face crop.
 const {previewArtwork,previewBounds,textFreePreview,localizedArtwork,...composition}=full;
 return composition;
}
export function upcomingPickups(entries:Entry[],locale:Locale,now:number,zone='Asia/Tokyo'):UpcomingPickup[]{
 const items=new Map<string,UpcomingPickup>();
 for(const entry of entries){
  if(entry.hidden||!isPickup(entry)||pickupPeriod(entry,now)!=='upcoming')continue;
  const start=pickupStart(entry,zone),end=pickupEnd(entry,zone);
  if(end&&end<dayKey(now))continue;
  const members=featuredMembers(entry)||[];
  const subjects:(EntityArtwork&{name:Localized;type:string})[]=members.length?members:[{name:entry.title,type:entry.pickupType||'unknown'}];
  subjects.forEach(member=>{
   const art=upcomingArtwork(member,entry,locale)||(subjects.length===1?upcomingArtwork(entry,entry,locale):undefined);
   const period=start||entry.pickupGroup||entry.version||end||entry.id;
   const id=[entry.gameId,entry.region,entry.poolType||'character',period,member.name.en||member.name.ko||JSON.stringify(member.name)].join('|');
   const next={id,entry,name:member.name,type:member.type,art,start,end};
   const previous=items.get(id);
   const score=(item:UpcomingPickup)=>(item.art?2:0)+(item.entry.pickupArchive?.status!=='forecast'&&(item.entry.sourceKind||'official')==='official'?4:0);
   if(!previous||score(next)>score(previous))items.set(id,next);
  });
 }
 return [...items.values()].sort((a,b)=>(a.start||estimatedStart(a.entry)||'9999').localeCompare(b.start||estimatedStart(b.entry)||'9999')||a.entry.gameId.localeCompare(b.entry.gameId)||(a.type==='new'?-1:1)-(b.type==='new'?-1:1)||a.id.localeCompare(b.id));
}
export const upcomingText={
 ko:{title:'픽업 예정',starts:'픽업 시작 예정',unknown:'시작일 미정',ends:'종료',estimated:'기간은 커뮤니티 자료 기준',more:'예정 픽업 더 보기',less:'접기'},
 en:{title:'Upcoming banners',starts:'Scheduled to start',unknown:'Start date unannounced',ends:'Ends',estimated:'Dates from community sources',more:'More upcoming banners',less:'Show less'},
 ja:{title:'ピックアップ予定',starts:'開催予定',unknown:'開始日未発表',ends:'終了',estimated:'日程はコミュニティ資料に基づきます',more:'開催予定をもっと見る',less:'閉じる'},
 zh:{title:'即将开启的卡池',starts:'预计开启',unknown:'开始日期未公布',ends:'结束',estimated:'日期来自社区资料',more:'查看更多预告',less:'收起'},
};
