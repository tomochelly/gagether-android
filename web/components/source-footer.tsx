'use client';
import {useDisplayZone} from './display-time';
import {useMemo} from 'react';
import type {Entry,Locale,RelatedSource} from '@/lib/types';
import {useCatalog} from './catalog-context';
import {rewardIcon,rewardDefinition} from '@/lib/reward-catalog';
import {artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';

export default function SourceFooter({entries,locale,detail=false}:{entries:Entry[];locale:Locale;detail?:boolean}){
 const zone=useDisplayZone();const {t,byId}=useCatalog();
 const sources=useMemo(()=>{
  const map=new Map<string,RelatedSource>();
  const add=(s:RelatedSource)=>{if(!map.has(s.url))map.set(s.url,s);};
  for(const e of entries){
   add({kind:e.sourceKind||'official',url:e.sourceUrl,title:`${byId[e.gameId].name[locale]} · ${e.sourceTitle}`});
   for(const source of e.relatedSources||[])add(source);
   for(const video of e.videos||[])add({kind:"video",url:video.sourceUrl,title:video.title[locale],publisher:video.channel});
   for(const reward of e.rewards||[]){add({kind:reward.sourceKind,url:reward.sourceUrl,title:reward.name[locale]});const icon=rewardIcon(e.gameId,reward);if(icon)add({kind:rewardDefinition(e.gameId,reward)?.sourceKind||(/wiki|github|biligame|gamewith|gametora/.test(icon.imageSource)?'community':'official'),url:icon.imageSource,title:reward.name[locale]+' · '+({ko:'아이콘 출처',en:'Icon source',ja:'アイコン出典',zh:'图标来源'})[locale]});}
   for(const url of e.collaboration?.sourceUrls||[])add({kind:'official',url,title:e.collaboration!.partner[locale]});
   for(const section of e.detailSections||[])for(const url of section.sourceUrls||[])add({kind:section.sourceKind||'official',url,title:section.title[locale]});
   for(const profile of e.entityDetails||[]){
    for(const source of profile.sources)add(source);
    for(const group of profile.groups)for(const url of group.sourceUrls||[])add({kind:group.sourceKind,url,title:`${profile.name[locale]} · ${group.title[locale]}`});
   }
   for(const art of [e,...e.pickupMembers||[],...e.detailImages||[]]){
    const images=[artworkForLocale(art,locale,'full',serviceArtworkLocale(e.region,e.gameId)),artworkForLocale(art,locale,'preview',serviceArtworkLocale(e.region,e.gameId))];
    for(const image of images)if(image.image&&image.imageVerified&&image.imageSource)add({kind:/inven\.co\.kr|arca\.live|dcinside\.com|iopwiki\.com|patchwiki\.com|gametora\.com|event-ugc-hoyowiki/.test(image.imageSource)?'community':'official',url:image.imageSource,title:image.imageCaption?.[locale]||`${e.title[locale]} · ${t.original}`});
   }
  }
  return [...map.values()];
 },[entries,locale,byId,t]);
 const latest=entries.map(e=>e.verifiedAt).sort().at(-1);
 const label=(kind:string)=>kind==='official'?t.officialNews:kind==='community'?t.communityInfo:t.videoInfo;
 return <details key={entries.map(e=>e.id).join('|')+locale} className={'source-footer'+(detail?' source-footer-detail':'')}>
  <summary>{t.referenceLinks} <span>{sources.length}</span>{latest&&<small>{t.checked} · {new Intl.DateTimeFormat(locale==='ko'?'ko-KR':locale==='ja'?'ja-JP':locale==='zh'?'zh-CN':'en-GB',{month:'2-digit',day:'2-digit',timeZone:zone}).format(new Date(latest))}</small>}</summary>
  <div className="source-footer-links">{sources.map((s,i)=><a key={s.url} href={s.url} target="_blank" rel="noreferrer"><span>[{label(s.kind)}]</span> {s.title} <small>{t.openSource} ↗</small></a>)}</div>
 </details>;
}
