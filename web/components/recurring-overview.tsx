'use client';
import {EntryEdit} from './owner-inline';
import {useState} from 'react';
import {RotateCcw,ChevronRight} from 'lucide-react';
import type {Entry,Locale,Region} from '@/lib/types';
import {useCatalog} from './catalog-context';
import {contentInAudience} from '@/lib/content-audience';
import {remainingTime} from '@/lib/schedule';
import {recurringItems,recurringReset} from '@/lib/recurring-events';
import {eventState,hasPullRewards} from '@/lib/event-presentation';
import ArtworkMedia from './artwork-media';
import {artworkForLocale} from '@/lib/artwork';
import {languageLabel} from '@/lib/presentation';
import GameBadge from './game-badge';
import {EventRewards,EventClock} from './event-overview';
const copy={
 ko:{title:'주기 콘텐츠',intro:'주기적으로 돌아오는 도전과 가챠 재화 보상',reset:'초기화까지',date:'초기화 · 시각 미확인',unknown:'초기화 일정 확인 중',reward:'보상 상세 확인 중',next:'다음 회차',more:'모두 보기',less:'접기'},
 en:{title:'Recurring challenges',intro:'Recurring challenges and pull rewards',reset:'Resets in',date:'Reset · time unconfirmed',unknown:'Reset schedule unconfirmed',reward:'Reward details unconfirmed',next:'Next season',more:'Show all',less:'Show less'},
 ja:{title:'定期コンテンツ',intro:'繰り返し挑戦できるコンテンツとガチャ報酬',reset:'リセットまで',date:'リセット・時刻未確認',unknown:'リセット日程を確認中',reward:'報酬詳細を確認中',next:'次のシーズン',more:'すべて見る',less:'閉じる'},
 zh:{title:'周期内容',intro:'周期挑战与抽卡奖励',reset:'距离重置',date:'重置 · 时间未确认',unknown:'重置日程待确认',reward:'奖励详情待确认',next:'下一期',more:'查看全部',less:'收起'}
};
export function ResetClock({entry,locale,now}:{entry:Entry;locale:Locale;now:number}){
 const c=copy[locale],r=recurringReset(entry,now);
 if(!r&&(entry.endAt||entry.endDate||eventState(entry,now)==='upcoming'))return <span className="reset-clock"><EventClock entry={entry} locale={locale} now={now}/></span>;
 return <span className="reset-clock">{r?.at?<><small>{c.reset}</small><b><time dateTime={r.at}>{remainingTime(r.at,now,locale)}</time></b></>:r?.date?<><b>{r.date}</b></>:null}</span>;
}
export default function RecurringOverview({entries,locale,now,region,gameId,onOpen}:{entries:Entry[];locale:Locale;now:number;region:Region;gameId?:string;onOpen:(e:Entry)=>void}){
 const {byId,games}=useCatalog(),[expanded,setExpanded]=useState(false),c=copy[locale];
 const items=recurringItems(entries.filter(e=>(!gameId||e.gameId===gameId)&&byId[e.gameId]&&contentInAudience(e,byId[e.gameId],region,locale)),locale,now,games.map(g=>g.id));
 if(!items.length)return null;
 return <section className="content-panel recurring-overview" id="gagether-resets" aria-labelledby="gagether-resets-title">
  <header><RotateCcw size={18}/><div><h2 id="gagether-resets-title">{c.title}<small>{items.length}</small></h2><p>{c.intro}</p></div></header>
  <div className="reset-grid">{items.slice(0,expanded?items.length:6).map(e=><div className="owner-entry-row" key={e.id}><button className="reset-row" type="button" data-entry-id={e.id} onClick={()=>onOpen(e)}>
   {artworkForLocale(e,locale).image&&<span className="reset-art" aria-hidden="true"><ArtworkMedia art={e} locale={locale} alt=""/></span>}
   <span className="reset-name"><GameBadge gameId={e.gameId} locale={locale} force/>{artworkForLocale(e,locale).image&&artworkForLocale(e,locale).imageLocale!=='neutral'&&artworkForLocale(e,locale).imageLocale!==locale&&<small className="reset-image-language">{languageLabel(artworkForLocale(e,locale).imageLocale as Locale,locale)} · {({ko:'원본',en:'Original',ja:'原文',zh:'原文'})[locale]}</small>}{eventState(e,now)==='upcoming'&&<small>{c.next}</small>}<strong>{e.title[locale]}</strong><span>{e.recurring!.cycleLabel[locale]}</span></span>
   <span className="reset-reward">{hasPullRewards(e)?<EventRewards entry={e} locale={locale}/>:null}</span>
   <ResetClock entry={e} locale={locale} now={now}/><ChevronRight size={15}/>
  </button><EntryEdit entry={e} locale={locale} compact/></div>)}</div>
  {items.length>6&&<button className="reset-more" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}>{expanded?c.less:c.more}</button>}
 </section>;
}
