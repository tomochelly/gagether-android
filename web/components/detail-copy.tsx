'use client';
import type {Locale} from '@/lib/types';
import {detailText} from '@/lib/content-display';
import {rewardCatalog} from '@/lib/reward-catalog';
import {NativeIcon} from './reward-display';
/** Native reward icons supplement exact item names; they never infer a reward or an amount. */
export default function DetailCopy({text,locale,gameId}:{text?:string;locale:Locale;gameId?:string}){
 const copy=detailText(text);if(!copy)return null;
 const items=rewardCatalog.filter(item=>item.gameId===gameId&&item.icon&&item.name[locale]?.length>1).sort((a,b)=>b.name[locale].length-a.name[locale].length);
 const line=(value:string)=>{
  const item=items.find(item=>value.includes(item.name[locale])&&value.length<200&&/\d/.test(value));
  if(!item)return value;
  const index=value.indexOf(item.name[locale]);return <>{value.slice(0,index)}<span className="inline-currency"><NativeIcon icon={item.icon} alt=""/>{item.name[locale]}</span>{value.slice(index+item.name[locale].length)}</>;
 };
 return <div className="detail-copy">{copy.split(/\n\n+/).map((paragraph,i)=><p key={i}>{paragraph.split('\n').map((value,n)=><span className="detail-copy-line" key={n}>{line(value)}</span>)}</p>)}</div>;
}
