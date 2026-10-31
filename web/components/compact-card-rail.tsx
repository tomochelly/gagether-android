'use client';
import {useEffect,useId,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import type {Locale} from '@/lib/types';
const copy={ko:{prev:'이전 항목',next:'다음 항목',items:'개 항목'},en:{prev:'Previous items',next:'Next items',items:'items'},ja:{prev:'前の項目',next:'次の項目',items:'件'},zh:{prev:'之前的项目',next:'之后的项目',items:'项'}};

export default function CompactCardRail({children,count,label,locale,className=''}:{children:ReactNode;count:number;label:string;locale:Locale;className?:string}){
 const ref=useRef<HTMLDivElement>(null),id=useId(),[position,setPosition]=useState({overflow:false,start:true,end:true}),c=copy[locale];
 useEffect(()=>{const el=ref.current;if(!el)return;const update=()=>{const max=el.scrollWidth-el.clientWidth;setPosition(p=>{const next={overflow:max>2,start:el.scrollLeft<2,end:el.scrollLeft>=max-2};return p.overflow===next.overflow&&p.start===next.start&&p.end===next.end?p:next;});};update();el.addEventListener('scroll',update,{passive:true});const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(update);observer?.observe(el);return()=>{observer?.disconnect();el.removeEventListener('scroll',update);};},[count]);
 const move=(direction:number)=>{const el=ref.current;if(el)el.scrollBy({left:direction*Math.max(220,el.clientWidth*.8),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
 return <div className="compact-rail-shell"><div id={id} ref={ref} className={'compact-card-rail '+className} style={{'--rail-count':Math.max(1,count)} as CSSProperties} role="region" aria-label={label} tabIndex={position.overflow?0:undefined}>{children}</div><div className="compact-rail-navigation" aria-hidden={!position.overflow} style={{visibility:position.overflow?'visible':'hidden'}}><span>{count} {c.items}</span><button aria-label={c.prev} aria-controls={id} disabled={!position.overflow||position.start} tabIndex={position.overflow?undefined:-1} onClick={()=>move(-1)}><ChevronLeft size={15}/></button><button aria-label={c.next} aria-controls={id} disabled={!position.overflow||position.end} tabIndex={position.overflow?undefined:-1} onClick={()=>move(1)}><ChevronRight size={15}/></button></div></div>;
}
