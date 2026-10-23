'use client';
import {useState} from 'react';
import {Gift} from 'lucide-react';
import type {Entry,Locale,GameIcon,RewardItem} from '@/lib/types';
import {rewardIcon} from '@/lib/reward-catalog';
import {rewardAssetUrl} from '@/lib/reward-assets';
import {studioText} from '@/lib/studio-i18n';
export const rewardMethod=(method:NonNullable<RewardItem['acquisition']>,locale:Locale)=>({ko:{free:'무료',conditional:'조건부',purchase:'구매'},en:{free:'Free',conditional:'Conditional',purchase:'Purchase'},ja:{free:'無料',conditional:'条件付き',purchase:'購入'},zh:{free:'免费',conditional:'有条件',purchase:'购买'}})[locale][method];
export function NativeIcon({icon,alt,className=''}:{icon?:GameIcon;alt:string;className?:string}){
 const [failed,setFailed]=useState('');const src=icon?rewardAssetUrl(icon.image):'';
 return icon&&failed!==src?<img key={src} className={'native-game-icon '+className+(icon.image.includes('zzz-srank')?' dark-glyph':'')} src={src} alt={alt} width={icon.width} height={icon.height} style={{maxWidth:icon.width,maxHeight:icon.height}} loading="lazy" decoding="async" onError={()=>setFailed(src)}/>:null;
}
export function RewardThumbnail({entry,locale,detail=false}:{entry:Entry;locale:Locale;detail?:boolean}){const t=studioText[locale];const items=entry.rewards||[];return <span className={'reward-thumbnail'+(detail?' reward-full':'')}><span className="reward-thumb-heading"><Gift size={15}/>{items.length?t.rewards:t.benefits}</span>{!!items.length&&<span className="reward-thumb-items">{items.slice(0,detail?12:4).map((r,i)=><span className="reward-thumb-item" key={i}><NativeIcon icon={rewardIcon(entry.gameId,r)} alt=""/><span><strong>{r.name[locale]}</strong>{r.quantity&&<b>{r.quantity}</b>}{r.acquisition&&<small className="reward-acquisition">{rewardMethod(r.acquisition,locale)}</small>}{r.note?.[locale]&&<small className="reward-item-note">{r.note[locale]}</small>}</span></span>)}</span>}{entry.rewardNote&&<span className="reward-thumb-note">{entry.rewardNote[locale]}</span>}</span>;}
export function RewardDetails({entry,locale}:{entry:Entry;locale:Locale}){if(!entry.rewards?.length)return null;return <section className="reward-details"><h3><Gift size={18}/>{studioText[locale].rewards}</h3><RewardThumbnail entry={entry} locale={locale} detail/><small>{studioText[locale].rewardNote}{entry.rewards.some(r=>r.translatedLocales?.includes(locale)&&!r.officialLocales?.includes(locale))&&<> · {studioText[locale].translated}</>}</small></section>;}
