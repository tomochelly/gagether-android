'use client';
import {PageReference} from './page-references';
import {useState} from 'react';
import RosterSourceLink from './roster-source-link';
import {rosterCopy,rosterArt,type RosterCharacter} from '@/lib/character-roster';
import type {Locale} from '@/lib/types';
import ImageLightbox from './image-lightbox';

type Reward=NonNullable<RosterCharacter['potentialRewards']>[number];
const words={
 ko:{title:'잠재능력 해금 보상',level:'잠재능력',illustration:'기념사진',namecard:'명함 테마',view:'전체 보기',source:'출처',artist:'작가',original:'원문'},
 en:{title:'Potential unlock rewards',level:'Potential',illustration:'Snapshot',namecard:'Profile theme',view:'View full image',source:'Source',artist:'Artist',original:'Original'},
 ja:{title:'潜在能力の解放報酬',level:'潜在能力',illustration:'記念写真',namecard:'名刺テーマ',view:'全体を見る',source:'出典',artist:'作者',original:'原文'},
 zh:{title:'潜能解锁奖励',level:'潜能',illustration:'纪念照片',namecard:'名片主题',view:'查看全图',source:'来源',artist:'画师',original:'原文'}
};
function nativeSize(e:React.SyntheticEvent<HTMLImageElement>){const img=e.currentTarget,dpr=Math.max(1,window.devicePixelRatio||1);img.style.maxWidth=img.naturalWidth/dpr+'px';img.style.maxHeight=img.naturalHeight/dpr+'px';}
function RewardPicture({reward,character,locale}:{reward:Reward;character:RosterCharacter;locale:Locale}){
 const t=words[locale],[failed,setFailed]=useState(false),[sourcesOpen,setSourcesOpen]=useState(false),art=reward.image?rosterArt({...character,image:reward.image,images:[]},locale):undefined,title=rosterCopy(reward.title,locale),caption=[title,reward.credit&&t.artist+' · '+reward.credit,art?.caption&&(typeof art.caption==='string'?art.caption:rosterCopy(art.caption,locale))].filter(Boolean).join(' · ');
 return <figure className="roster-unlock-item">
  {art&&!failed&&<ImageLightbox src={art.url} alt={title} locale={locale} triggerLabel={title+' · '+t.view} caption={caption}><img src={art.url} alt={title} width={art.width} height={art.height} loading="lazy" decoding="async" referrerPolicy="no-referrer" onLoad={nativeSize} onError={()=>setFailed(true)}/></ImageLightbox>}
  <figcaption><strong>{title}</strong><small>{t[reward.type]}{!reward.title[locale]?' · '+t.original:''}{reward.credit?' · '+t.artist+' '+reward.credit:''}</small>{art?.caption&&<small>{typeof art.caption==='string'?art.caption:rosterCopy(art.caption,locale)}</small>}{reward.note&&<p>{rosterCopy(reward.note,locale)}</p>}<PageReference locale={locale}><details className="roster-unlock-sources" onToggle={e=>{if(e.target===e.currentTarget)setSourcesOpen(e.currentTarget.open)}}><summary>{t.source}</summary>{sourcesOpen&&<><RosterSourceLink href={art?.sourceUrl||reward.sourceUrl} locale={locale}>{t.source}</RosterSourceLink>{art&&art.sourceUrl!==reward.sourceUrl&&<RosterSourceLink href={reward.sourceUrl} locale={locale}>{t.source}</RosterSourceLink>}</>}</details></PageReference></figcaption>
 </figure>;
}
function PotentialLevel({level,rewards,character,locale}:{level:number;rewards:Reward[];character:RosterCharacter;locale:Locale}){
 const [open,setOpen]=useState(false),t=words[locale],counts=(['illustration','namecard'] as const).map(type=>({type,count:rewards.filter(r=>r.type===type).length})).filter(x=>x.count);
 return <details className="roster-unlock-level" onToggle={e=>setOpen(e.currentTarget.open)}><summary><strong>{t.level} {level}</strong><small>{counts.map(c=>t[c.type]+' '+c.count).join(' · ')}</small></summary>{open&&<div className="roster-unlock-items">{rewards.map(reward=><RewardPicture key={reward.id} reward={reward} character={character} locale={locale}/>)}</div>}</details>;
}
export default function RosterPotentialRewards({character,locale}:{character:RosterCharacter;locale:Locale}){
 const rewards=character.potentialRewards;if(!rewards?.length)return null;const levels=[...new Set(rewards.map(r=>r.level))].sort((a,b)=>a-b);
 return <section className="roster-potential-rewards"><h3>{words[locale].title}</h3>{levels.map(level=><PotentialLevel key={level} level={level} rewards={rewards.filter(r=>r.level===level)} character={character} locale={locale}/>)}</section>;
}
