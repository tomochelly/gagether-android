import {Flag,CalendarDays,Sparkles,ArrowDown} from 'lucide-react';
import type {Entry,Locale} from '@/lib/types';
import {linkedWeaponOnly} from '@/lib/linked-weapon-presentation';
import {pickupPeriod} from '@/lib/pickup-history';
export default function ScheduleBrief({entries,locale,now}:{entries:Entry[];locale:Locale;now:number}){
 const t={ko:['일정 한눈에','24시간 내 종료','진행 중 픽업','다음 픽업'],en:['At a glance','Ending in 24h','Live banners','Upcoming banners'],ja:['日程の概要','24時間以内に終了','開催中のガチャ','今後のガチャ'],zh:['日程速览','24小时内结束','开放中卡池','即将开放卡池']}[locale],rows=entries.filter(e=>!linkedWeaponOnly(e)),counts=[rows.filter(e=>e.endAt&&Date.parse(e.endAt)>now&&Date.parse(e.endAt)<=now+86400000).length,rows.filter(e=>(e.kind==='pickup'||e.poolType==='support')&&pickupPeriod(e,now)==='current').length,rows.filter(e=>(e.kind==='pickup'||e.poolType==='support')&&pickupPeriod(e,now)==='upcoming').length];
 return <nav className="schedule-brief" aria-label={t[0]}>{[Flag,CalendarDays,Sparkles].map((Icon,i)=><a key={i} href={['#gagether-timeline','#gagether-content',counts[2]?'#gagether-upcoming':'#gagether-timeline'][i]}><Icon size={16}/><span>{t[i+1]}</span><strong>{counts[i]}</strong><ArrowDown size={12}/></a>)}</nav>;
}
