import type {Entry,Locale} from './types';
import {entryState} from './types';
import {featuredMembers,editedEntryArtwork} from './presentation';
import {isPickup,pickupPeriod,pickupStart,pickupEnd} from './pickup-history';
import {estimatedStart,isForecast} from './pickup-estimates';
import {dayKey,deadlineUrgency} from './schedule';
import {bluearchivePickupArtwork} from './bluearchive-pickup-artwork';
import {reviewedPickupArtwork,reviewedPickupGroupFallback} from './reviewed-pickup-artwork';

const pickupBannerText={
 ko:{upcoming:'픽업 예정',current:'픽업 진행 중',ending:'픽업 종료 임박',past:'픽업 종료'},
 en:{upcoming:'Upcoming banner',current:'Banner ongoing',ending:'Banner ending soon',past:'Banner ended'},
 ja:{upcoming:'ピックアップ開催予定',current:'ピックアップ開催中',ending:'ピックアップ終了間近',past:'ピックアップ終了'},
 zh:{upcoming:'卡池即将开启',current:'卡池进行中',ending:'卡池即将结束',past:'卡池已结束'}
};
export function pickupBannerLabel(entry:Entry,now:number,locale:Locale):string{
 const period=pickupPeriod(entry,now),labels=pickupBannerText[locale];
 if(period!=='current')return labels[period];
 // Follow the existing 72-hour deadline rule. Date-only schedules gain no clock;
 // their final calendar day alone is enough to show the ending-soon label.
 const ending=deadlineUrgency(entry,now)||!entry.endAt&&pickupEnd(entry)===dayKey(now);
 return ending?labels.ending:labels.current;
}

export type SpotlightSlide={id:string;entry:Entry;art:Entry};
export function spotlightSlides(entries:Entry[],now:number,gameId?:string):SpotlightSlide[]{
 const originals=new Map(entries.map(e=>[e.id,e]));
 const scope=entries.filter(e=>(!gameId||e.gameId===gameId)&&!e.hidden).map(reviewedPickupArtwork).map(bluearchivePickupArtwork);
 const pools=new Map<string,Entry[]>();
 for(const e of scope){
  if(!isPickup(e)||pickupPeriod(e,now)==='past'||(pickupEnd(e)||'9999')<dayKey(now))continue;
  const key=[e.gameId,e.region,e.poolType||'character'].join('|');
  pools.set(key,[...pools.get(key)||[],e]);
 }
 let selected:Entry[]=[];
 // Handoff happens independently for each actual service and pool, even while
 // another game still has an active banner. Stored archive records are eligible.
 for(const pool of pools.values()){
  const active=pool.filter(e=>pickupPeriod(e,now)==='current');
  if(active.length){selected.push(...active);continue;}
  const future=pool.filter(e=>pickupPeriod(e,now)==='upcoming');
  const date=(e:Entry)=>pickupStart(e)||estimatedStart(e)||'9999';
  const nearest=future.map(date).sort()[0];
  selected.push(...future.filter(e=>date(e)===nearest));
 }
 if(!selected.length)selected=scope.filter(e=>!e.pickupArchive&&e.featured&&entryState(e,now)!=='ended');
 const rank={new:0,mixed:1,rerun:2,unknown:3};
 const slides=[...selected].sort((a,b)=>Number(pickupPeriod(a,now)==='upcoming')-Number(pickupPeriod(b,now)==='upcoming')||Number(!!b.featured)-Number(!!a.featured)||rank[a.pickupType||'unknown']-rank[b.pickupType||'unknown']).flatMap(entry=>{
  const members=featuredMembers(entry)||[];
  if(!members.length||reviewedPickupGroupFallback(entry))return [{id:entry.id,entry,art:entry}];
  return members.map((member,i)=>{
   const edited=new Set(entry.editor?.fields||[]);
   const entryArtEdited=!!editedEntryArtwork(entry);
   const ownArt=entryArtEdited||members.length===1&&!member.image&&!member.localizedArtwork?entry:member;
   const art:Entry={...entry,title:member.name,pickupType:member.type,rarity:member.rarity||entry.rarity,pickupMembers:[member],image:ownArt.image,imageCaption:ownArt.imageCaption,originalLanguageFallback:ownArt.originalLanguageFallback,textFreePreview:ownArt.textFreePreview,imageSource:ownArt.imageSource,imageVerified:ownArt.imageVerified,imageFit:ownArt.imageFit,imageKind:ownArt.imageKind,imagePosition:ownArt.imagePosition,imageFraming:ownArt.imageFraming,previewFocus:ownArt.previewFocus,previewBounds:ownArt.previewBounds,imageLocale:ownArt.imageLocale,previewArtwork:ownArt.previewArtwork,localizedArtwork:ownArt.localizedArtwork};
   if(pickupPeriod(entry,now)==='upcoming'&&!entryArtEdited&&!edited.has('pickupMembers')){
    // Grayscale/framing is presentation only. Keep the original file and owner focus.
    art.previewArtwork=undefined;art.previewBounds=undefined;art.textFreePreview=false;
   }
   return {id:entry.id+':'+i,entry,art};
  });
 });
 const unique=new Map<string,SpotlightSlide>();
 for(const slide of slides){
  const e=slide.entry,key=[e.gameId,e.region,e.poolType||'character',pickupStart(e)||estimatedStart(e)||e.pickupGroup||e.version||e.id,slide.art.title.en||slide.art.title.ko].join('|');
  const old=unique.get(key),score=(s:SpotlightSlide)=>(isForecast(s.entry)?0:8)+(!s.entry.pickupArchive?4:0)+(s.art.imageVerified?2:0);
  if(!old||score(slide)>score(old))unique.set(key,slide);
 }
 return [...unique.values()].map(slide=>({...slide,entry:originals.get(slide.entry.id)||slide.entry}));
}
