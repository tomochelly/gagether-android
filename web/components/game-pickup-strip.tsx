'use client';
import {useRef,type CSSProperties} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight} from 'lucide-react';
import type {Locale} from '@/lib/types';
import type {OpenEntry} from '@/lib/pickup-detail';
import {entryPath} from '@/lib/discovery';
import {entryTitle} from '@/lib/presentation';
import {characterRarity} from '@/lib/character-rarity';
import {pickupBannerLabel,type SpotlightSlide} from '@/lib/spotlight';
import PickupThumbnail from './pickup-thumbnail';

const copy={ko:{title:'픽업 캐릭터',previous:'이전 픽업 보기',next:'다음 픽업 보기'},en:{title:'Featured characters',previous:'Previous banners',next:'Next banners'},ja:{title:'ピックアップキャラクター',previous:'前のピックアップ',next:'次のピックアップ'},zh:{title:'当期角色',previous:'上一组卡池',next:'下一组卡池'}};

/** One shared illustration band; canonical entries and member-specific artwork stay separate. */
export default function GamePickupStrip({slides,locale,now,onOpen}:{slides:SpotlightSlide[];locale:Locale;now:number;onOpen:OpenEntry}){
 const rail=useRef<HTMLUListElement>(null),words=copy[locale];
 if(!slides.length)return null;
 const move=(direction:number)=>{const node=rail.current;if(node)node.scrollBy({left:direction*node.clientWidth*.8,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 return <section className="game-pickup-strip" aria-label={words.title}>
  <header><h2>{words.title}</h2>{slides.length>1&&<div><button type="button" onClick={()=>move(-1)} aria-label={words.previous}><ArrowLeft size={16}/></button><button type="button" onClick={()=>move(1)} aria-label={words.next}><ArrowRight size={16}/></button></div>}</header>
  <ul ref={rail} className="game-pickup-tiles" style={{'--pickup-count':slides.length} as CSSProperties}>
   {slides.map(({id,entry,art},index)=>{const name=entryTitle(art,locale),grade=characterRarity(entry.gameId,{rarity:art.rarity},locale);return <li key={id}><a title={name} href={entryPath(locale,entry)} onClick={event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onOpen(entry,art.title);}}>
    <PickupThumbnail entry={entry} art={art} name={art.title} locale={locale} priority={index<4}/>
    <span className="game-pickup-caption"><small>{pickupBannerLabel(entry,now,locale)}{grade&&<span className="game-pickup-grade">{grade.text}</span>}</small><strong>{name.replace(/^[\[［][^\]］]+[\]］]\s*/,'')}</strong></span><ArrowUpRight className="game-pickup-open" size={17} aria-hidden="true"/>
   </a></li>;})}
  </ul>
 </section>;
}
