'use client';
import {useRef,useState} from 'react';
import type {Locale} from '@/lib/types';
export default function CharacterSectionNav({locale,items}:{locale:Locale;items:{key:string;label:string}[]}){
 const ref=useRef<HTMLElement>(null),[active,setActive]=useState(items[0]?.key);
 return <nav ref={ref} className="character-section-nav" aria-label={({ko:'스테이터스 바로가기',en:'Character section navigation',ja:'ステータスの項目へ移動',zh:'角色详情导航'})[locale]}>{items.map(item=><button type="button" key={item.key} aria-current={active===item.key?'location':undefined} onClick={()=>{
  const root=ref.current?.closest('[data-character-content]'),target=root?.querySelector<HTMLElement>('[data-character-section="'+item.key+'"]');if(!target)return;
  setActive(item.key);if(target instanceof HTMLDetailsElement)target.open=true;let parent=target.parentElement;while(parent&&parent!==root){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}
  target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  const heading=target.querySelector<HTMLElement>('summary,h2,h3,h4');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
 }}>{item.label}</button>)}</nav>;
}
