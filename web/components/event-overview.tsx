'use client';
import {EntryEdit} from './owner-inline';
import {useState,type CSSProperties} from 'react';
import {Clock3,Sparkles,ArrowUpRight,Star,Radio} from 'lucide-react';
import type {Entry,Locale,Region} from '@/lib/types';
import {eventText,eventState,eventEndingSoon,hasPullRewards,pullRewards,serviceZone} from '@/lib/event-presentation';
import {dateInZone} from '@/lib/display-time';
import {remainingTime} from '@/lib/schedule';
import {entryTitle,inSchedule,regionLabel} from '@/lib/presentation';
import {artworkForLocale} from '@/lib/artwork';
import {rewardIcon} from '@/lib/reward-catalog';
import {contentInAudience} from '@/lib/content-audience';
import {eventOverviewItems,eventTextForLocale} from '@/lib/event-overview-items';
import {useCatalog} from './catalog-context';
import {NativeIcon,rewardMethod} from './reward-display';
import ArtworkMedia from './artwork-media';
import GameBadge from './game-badge';
export function EventBadges({entry,locale,compact=false}:{entry:Entry;locale:Locale;compact?:boolean}){const t=eventText[locale];return <span className="event-badges">{entry.collaboration&&<span className="collaboration-badge">{compact?t.collab:<>{t[entry.collaboration.scope]} · {entry.collaboration.partner[locale]}</>}</span>}{hasPullRewards(entry)&&<span className="pull-reward-badge"><Sparkles size={12}/>{t[compact?'gacha':'reward']}</span>}</span>;}
export function EventRewards({entry,locale}:{entry:Entry;locale:Locale}){const rewards=pullRewards(entry).filter(r=>eventTextForLocale(r.name,locale));return rewards.length?<span className="event-reward-chips">{rewards.slice(0,4).map((r,i)=><span key={i}><NativeIcon icon={rewardIcon(entry.gameId,r)} alt=""/><span>{r.name[locale]}{r.quantity&&<strong> {r.quantity}</strong>}{r.acquisition&&<small className="reward-acquisition"> · {rewardMethod(r.acquisition,locale)}</small>}</span></span>)}</span>:null;}
export function EventClock({entry:e,locale,now,compact=false}:{entry:Entry;locale:Locale;now:number;compact?:boolean}){const t=eventText[locale],state=eventState(e,now),start=state==='upcoming',clock=start?e.startAt:e.endAt,date=start?e.startDate:e.endDate;
 if(state==='ended')return <span className="event-clock ended">{({ko:'종료',en:'Ended',ja:'終了',zh:'已结束'})[locale]}</span>;
 if(clock)return <span className={'event-clock'+(eventEndingSoon(e,now)?' urgent':'')}><Clock3 size={compact?12:16}/><span><small>{t[start?'starts':'ends']}</small><b>{compact?remainingTime(clock,now,locale).split(' ').slice(0,2).join(' '):remainingTime(clock,now,locale)}</b></span></span>;
 if(date){const days=(Date.parse(date)-Date.parse(dateInZone(now,serviceZone(e))))/86400000;return <span className="event-clock date-only"><Clock3 size={16}/><span><b>{!start&&days===0?t.today:`${date} · ${start?t.starts:`${days} ${t.days}`}`}</b></span></span>;}
 return null;
}
const overviewCopy={
 ko:{title:'게임별 이벤트',intro:'게임별 주요 이벤트와 남은 기간을 확인하세요.',all:'이벤트 전체 보기',gameTitle:'이벤트',hint:'이벤트를 누르면 참여 방법과 보상을 볼 수 있어요.'},
 en:{title:'Events by game',intro:'Key events and time remaining, grouped by game.',all:'View all events',gameTitle:'Events',hint:'Select an event for participation details and rewards.'},
 ja:{title:'ゲーム別イベント',intro:'主なイベントと残り期間をゲーム別に確認できます。',all:'イベントをすべて見る',gameTitle:'イベント',hint:'イベントを選ぶと参加方法と報酬を確認できます。'},
 zh:{title:'各游戏活动',intro:'按游戏查看主要活动和剩余时间。',all:'查看全部活动',gameTitle:'活动',hint:'点击活动查看参与方式及奖励。'},
};

function EventTile({entry:e,locale,now,onOpen,compact=false}:{entry:Entry;locale:Locale;now:number;onOpen:(e:Entry)=>void;compact?:boolean}){
 const [failed,setFailed]=useState(''),art=artworkForLocale(e,locale,'preview');
 return <article data-entry-id={e.id} data-game-id={e.gameId} className={'event-tile'+(compact?' event-tile-compact':'')+(e.collaboration?' collab-event':'')+(hasPullRewards(e)?' pull-event':'')}>
  <button type="button" onClick={()=>onOpen(e)}>
   {art.image&&failed!==art.image&&<span className="event-poster"><ArtworkMedia art={e} alt="" locale={locale} fitPreview="focus" onUnavailable={()=>setFailed(art.image!)}/></span>}
   <span className="event-tile-content">
    <GameBadge gameId={e.gameId} locale={locale}/><strong className="event-title"><span>{entryTitle(e,locale)}</span>{!compact&&<ArrowUpRight size={17}/>}</strong>
    <EventBadges entry={e} locale={locale} compact={compact}/>
    {!compact&&<><span className="event-summary">{eventTextForLocale(e.summary,locale)}</span><EventRewards entry={e} locale={locale}/></>}
    <EventClock entry={e} locale={locale} now={now} compact={compact}/>
   </span>
  </button>
 <EntryEdit entry={e} locale={locale} compact={compact}/></article>;
}

export default function EventOverview({entries,locale,now,onOpen,gameId,region,onGame}:{entries:Entry[];locale:Locale;now:number;onOpen:(e:Entry)=>void;gameId?:string;region:Region;onGame:(id:string,region:Region)=>void}){
 const {games,byId}=useCatalog(),t=eventText[locale],copy=overviewCopy[locale];
 const [filter,setFilter]=useState<'all'|'gacha'|'collab'|'ending'>('all'),[limit,setLimit]=useState(6);
 // Scope at the rendering boundary as well as the parent. A dedicated game
 // page must never display another game or a different actual service.
 const all=eventOverviewItems(entries.filter(e=>!e.recurring&&(!gameId||e.gameId===gameId)&&byId[e.gameId]&&contentInAudience(e,byId[e.gameId],region,locale)),locale,now);
 if(!all.length)return null;
 const matches=(e:Entry,f:typeof filter)=>f==='all'||f==='gacha'&&hasPullRewards(e)||f==='collab'&&!!e.collaboration||f==='ending'&&eventEndingSoon(e,now);
 const shown=all.filter(e=>matches(e,filter));
 const groups=games.map(game=>({game,entries:shown.filter(e=>e.gameId===game.id)})).filter(g=>g.entries.length);
 return <section className={'content-panel event-overview'+(!gameId?' event-dashboard':'')} id="gagether-events" data-game-id={gameId} aria-labelledby="gagether-events-title">
  <header><div><span className="event-section-kicker">EVENTS</span><h2 id="gagether-events-title">{gameId?copy.gameTitle:copy.title}<small>{all.length}</small></h2><p>{gameId?copy.hint:copy.intro}</p></div></header>
  <div className="event-filters" role="group" aria-label={t.title}>{(['all','gacha','collab','ending'] as const).map(f=><button key={f} type="button" aria-pressed={f===filter} onClick={()=>{setFilter(f);setLimit(6);}}>{t[f]}<small>{all.filter(e=>matches(e,f)).length}</small></button>)}</div>
  {gameId?<div className="event-overview-grid">{shown.slice(0,limit).map(e=><EventTile key={e.id+':'+locale} entry={e} locale={locale} now={now} onOpen={onOpen}/>)}</div>:<div className="event-game-grid">{groups.map(({game,entries:items})=><section className="event-game-group" key={game.id} data-game-id={game.id} style={{'--event-game-color':game.color} as CSSProperties}>
   <header><img src={game.icon||game.logo} alt="" width={32} height={32} loading="lazy"/><div><h3>{game.name[locale]}</h3><span>{regionLabel(game,items[0].region,locale)}</span></div><small>{items.length}</small></header>
   <div className="event-game-list">{items.slice(0,2).map(e=><EventTile key={e.id+':'+locale} entry={e} locale={locale} now={now} onOpen={onOpen} compact/>)}</div>
   <button type="button" className="event-game-more" aria-label={game.name[locale]+' · '+copy.all} onClick={()=>onGame(game.id,items[0].region)}>{copy.all}<span>{items.length}<ArrowUpRight size={14}/></span></button>
  </section>)}</div>}
  {!shown.length&&<p className="event-empty">{t.empty}</p>}
  {gameId&&shown.length>limit&&<button type="button" className="event-more" onClick={()=>setLimit(v=>Math.min(v+6,shown.length))}>{t.more} <span>{Math.min(limit,shown.length)} / {shown.length}</span></button>}
 </section>;
}
export function LibraryGameMeta({count,collaborating,locale,broadcast}:{count:number|null|undefined;collaborating:boolean;locale:Locale;broadcast?:'scheduled'|'live'}){const t=eventText[locale];return <span className="library-game-meta">{broadcast&&<span className={"library-broadcast "+broadcast} role="status"><Radio size={10}/>{broadcast==='live'&&<b className="library-live-label">LIVE</b>}{broadcast==='live'?({ko:'방송 중',en:'Live now',ja:'配信中',zh:'直播中'})[locale]:({ko:'방송 예정',en:'Stream scheduled',ja:'配信予定',zh:'直播预告'})[locale]}</span>}{collaborating&&<span className="library-collab"><Sparkles size={10}/>{t.ongoingCollab}</span>}<span className="library-favorite-count" title={t.countNote}><Star size={10}/><span><b>{count==null?'—':new Intl.NumberFormat(locale).format(count)}</b>{({ko:'명',en:'',ja:'人',zh:'人'})[locale]}</span></span></span>;}
