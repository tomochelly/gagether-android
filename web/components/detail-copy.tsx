'use client';
import type {Locale,TextAppearance} from '@/lib/types';
import {normalizeLineBreaks,textAppearanceStyle} from '@/lib/text-appearance';
import {detailText} from '@/lib/content-display';
import {cleanPublicInformationText} from '@/lib/public-information-text';
import {rewardCatalog} from '@/lib/reward-catalog';
import {NativeIcon} from './reward-display';
/** Native reward icons supplement exact item names; they never infer a reward or an amount. */
export default function DetailCopy({text,locale,gameId,preserve=false,sourceOriginal=false,appearance}:{text?:string;locale:Locale;gameId?:string;preserve?:boolean;sourceOriginal?:boolean;appearance?:TextAppearance}){
 const publicText=cleanPublicInformationText(text,{sourceOriginal}),literal=preserve||sourceOriginal,copy=literal?normalizeLineBreaks(publicText):detailText(publicText);if(!copy)return null;
 const items=rewardCatalog.filter(item=>item.gameId===gameId&&item.icon&&item.name[locale]?.length>1).sort((a,b)=>b.name[locale].length-a.name[locale].length);
 const line=(value:string)=>{
  const item=items.find(item=>value.includes(item.name[locale])&&value.length<200&&/\d/.test(value));
  if(!item)return value;
  const index=value.indexOf(item.name[locale]);return <>{value.slice(0,index)}<span className="inline-currency"><NativeIcon icon={item.icon} alt=""/>{item.name[locale]}</span>{value.slice(index+item.name[locale].length)}</>;
 };
 if(literal)return <div className="detail-copy is-verbatim" style={textAppearanceStyle(appearance)}>{copy.split('\n').map((value,i)=><span className="detail-copy-line" key={i}>{line(value)||'\u00a0'}</span>)}</div>;
 return <div className="detail-copy" style={textAppearanceStyle(appearance)}>{copy.split(/\n\n+/).map((paragraph,i)=><p key={i}>{paragraph.split('\n').map((value,n)=><span className="detail-copy-line" key={n}>{line(value)}</span>)}</p>)}</div>;
}
