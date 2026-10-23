'use client';
import {EntryEdit} from './owner-inline';
import {useDisplayZone} from './display-time';
import {useMemo,useState,type CSSProperties} from 'react';
import {ArrowUpRight,Bell,Radio,Play,Star,ChevronRight,Clock3} from 'lucide-react';
import type {Entry,Game,Locale,Region} from '@/lib/types';
import {gameBroadcasts,gameBroadcastArchive} from '@/lib/broadcast-visibility';
import {favoriteBroadcasts,favoriteBroadcastArchive,favoriteNoticeGroups,broadcastState} from '@/lib/favorite-updates';
import {broadcastArchiveText} from '@/lib/broadcast-archive';
import {favoriteUpdatesText} from '@/lib/favorite-updates-i18n';
import {entryTitle,regionLabel} from '@/lib/presentation';
import {localeCode} from '@/lib/i18n';
import {broadcastReminderText} from '@/lib/broadcast-reminder-i18n';
import {videoLanguages} from '@/lib/studio-i18n';
import {useCatalog,editEntryTarget} from './catalog-context';

type Props={entries:Entry[];favorites:string[];locale:Locale;region:Region;gameRegions:Partial<Record<string,Region>>;now:number;onOpen:(e:Entry)=>void;onGame:(id:string,region:Region)=>void;onChooseGames:()=>void;onBroadcastSettings?:()=>void};
const date=(value:string,locale:Locale,time=false,zone='UTC')=>!Number.isFinite(Date.parse(value))?'—':new Intl.DateTimeFormat(localeCode[locale],{month:'2-digit',day:'2-digit',...(time?{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}:{}),timeZone:zone}).format(new Date(value));
export default function FavoriteUpdates(props:Props){
 const zone=useDisplayZone();
 const {entries,favorites,locale,region,gameRegions,now,onOpen,onGame,onChooseGames,onBroadcastSettings}=props;
 const {games,t,editMode,openEditor,simpleMode}=useCatalog(),l=favoriteUpdatesText[locale];const [expanded,setExpanded]=useState<string[]>([]),[newsGame,setNewsGame]=useState('');
 const groups=useMemo(()=>favoriteNoticeGroups(entries,games,favorites,region,gameRegions,locale),[entries,games,favorites,region,gameRegions,locale]);
 const broadcasts=useMemo(()=>favoriteBroadcasts(entries,games,favorites,region,gameRegions,locale,now),[entries,games,favorites,region,gameRegions,locale,now]);
 const ended=useMemo(()=>favoriteBroadcastArchive(entries,games,favorites,region,gameRegions,locale),[entries,games,favorites,region,gameRegions,locale]);
 const open=(e:Entry)=>onOpen(e);
 const shownGroups=simpleMode?groups.filter(g=>g.game.id===(groups.some(g=>g.game.id===newsGame)?newsGame:groups[0]?.game.id)):groups;
 return <div id="gagether-news" className="favorite-updates">
  <section className="favorite-news" aria-label={l.news}><header className="favorite-section-heading"><div><Bell size={18}/><h2>{l.news}</h2><span>{groups.length}</span></div><p>{l.newsSub}</p></header>
   {simpleMode&&groups.length>1&&<nav className="simple-news-tabs" aria-label={l.news}>{groups.map(({game})=><button key={game.id} aria-pressed={shownGroups[0]?.game.id===game.id} onClick={()=>setNewsGame(game.id)}><img src={game.icon||game.logo} alt=""/>{game.name[locale]}</button>)}</nav>}
   {!groups.length?<div className="favorite-empty"><Star size={22}/><p>{l.noGames}</p><button onClick={onChooseGames}>{l.choose}<ChevronRight size={15}/></button></div>:<div className="favorite-news-grid">{shownGroups.map(({game,region:service,notices})=><article key={game.id} className="favorite-news-game" style={{'--game-color':game.color} as CSSProperties}><header><img src={game.icon||game.logo} alt=""/><div><h3>{game.name[locale]}</h3><small>{regionLabel(game,service,locale,t)}</small></div><button onClick={()=>onGame(game.id,service)} aria-label={game.name[locale]+' · '+l.openGame}><ArrowUpRight size={17}/></button></header><div className="favorite-notice-list">{notices.slice(0,expanded.includes(game.id)?12:3).map(e=><div key={e.id} className="owner-entry-row"><button type="button" className="favorite-notice-button" onClick={()=>open(e)}><span><time>{e.publishedAt?date(e.publishedAt,locale,false,zone):'—'}</time><small>{e.broadcast?l.broadcast:t[e.kind]}</small></span><strong>{entryTitle(e,locale)}</strong><ChevronRight size={14}/></button><EntryEdit entry={e} locale={locale} compact/></div>)}{!notices.length&&<p className="favorite-no-news">{l.empty}</p>}</div>{notices.length>3&&!expanded.includes(game.id)&&<button className="favorite-news-more" onClick={()=>setExpanded(v=>[...v,game.id])}>{l.more}<span>{Math.min(notices.length,12)}</span><ChevronRight size={13}/></button>}</article>)}</div>}
  </section>
  <BroadcastRoom entries={broadcasts} archive={ended} locale={locale} now={now} onOpen={open} onReminder={onBroadcastSettings}/>
 </div>;
}
export function GameBroadcasts({entries,game,region,locale,now,onOpen}:{entries:Entry[];game:Game;region:Region;locale:Locale;now:number;onOpen:(e:Entry)=>void}){
 const broadcasts=useMemo(()=>gameBroadcasts(entries,game,region,locale,now),[entries,game,region,locale,now]);
 const ended=useMemo(()=>gameBroadcastArchive(entries,game,region,locale),[entries,game,region,locale]);
 if(!broadcasts.length&&!ended.length)return null;
 return <BroadcastRoom key={game.id+':'+region+':'+locale} entries={broadcasts} archive={ended} locale={locale} now={now} onOpen={onOpen}/>;
}
export function BroadcastRoom({entries,archive=[],locale,now,onOpen,onReminder}:{entries:Entry[];archive?:Entry[];locale:Locale;now:number;onOpen:(e:Entry)=>void;onReminder?:()=>void}){
 const zone=useDisplayZone();
 const {byId}=useCatalog(),l=favoriteUpdatesText[locale],a=broadcastArchiveText[locale];const [chosen,setChosen]=useState(''),[view,setView]=useState<'active'|'ended'>('active');const list=view==='ended'?archive:entries,e=list.find(e=>e.id===chosen)||list[0];
 return <section className={'broadcast-room'+(!e&&!archive.length?' is-inactive':'')} aria-label={l.broadcast}><header className="favorite-section-heading"><div><Radio size={19}/><h2>{l.broadcast}</h2><span className={e&&view==='active'?'broadcast-on':''}>{view==='ended'?list.length:e?list.length:l.inactive}</span></div>{onReminder&&<button className="broadcast-reminder-link" onClick={onReminder}><Bell size={15}/>{broadcastReminderText[locale].short}</button>}</header><nav className="broadcast-view-tabs" aria-label={l.broadcast}>{(['active','ended'] as const).map(v=><button type="button" key={v} aria-pressed={view===v} onClick={()=>{setView(v);setChosen('');}}>{v==='active'?a.active:a.ended}<span>{v==='active'?entries.length:archive.length}</span></button>)}</nav>{!e?<div className="broadcast-standby"><Radio size={28}/><div><strong>{view==='ended'?a.empty:l.noBroadcast}</strong>{view==='active'&&<p>{l.inactiveNote}</p>}</div></div>:<>{list.length>1&&<div className="broadcast-tabs" aria-label={l.broadcast}>{list.map(item=><button className={item.id===e.id?'active':''} key={item.id} aria-pressed={item.id===e.id} onClick={()=>setChosen(item.id)}><img src={byId[item.gameId].icon||byId[item.gameId].logo} alt=""/><span>{view==='ended'?entryTitle(item,locale):byId[item.gameId].name[locale]}</span><small>{videoLanguages[item.broadcast!.locale]}</small></button>)}</div>}<div className="broadcast-feature"><BroadcastPlayer key={e.id} entry={e} locale={locale}/><div className="broadcast-copy"><EntryEdit entry={e} locale={locale} scope="broadcast" label={a.status}/><div className="broadcast-game"><img src={byId[e.gameId].icon||byId[e.gameId].logo} alt=""/><span>{byId[e.gameId].name[locale]}</span></div><span className={'broadcast-state '+(view==='ended'?'ended':broadcastState(e.broadcast!,now))}><i/>{view==='ended'?a.ended:broadcastState(e.broadcast!,now)==='live'?l.live:l.scheduled}</span><h3>{entryTitle(e,locale)}</h3><p className="broadcast-schedule"><Clock3 size={15}/><span>{l.transmission} · {e.broadcast!.scheduledAt?date(e.broadcast!.scheduledAt,locale,true,zone)+' · '+zone:e.broadcast!.scheduledDate||l.datePending}</span></p>{e.broadcast!.programStartAt&&Date.parse(e.broadcast!.programStartAt)!==Date.parse(e.broadcast!.scheduledAt||'')&&<p className="broadcast-schedule">{l.program} · {date(e.broadcast!.programStartAt,locale,true,zone)} · {zone}</p>}<small>{e.broadcast!.channel||''} · {videoLanguages[e.broadcast!.locale]}</small><button className="broadcast-notice" onClick={()=>onOpen(e)}>{l.viewNotice}<ChevronRight size={15}/></button><div className="broadcast-sources"><span>{l.source}</span><a href={e.broadcast!.announcementUrl} target="_blank" rel="noreferrer">{l.announcement}<ArrowUpRight size={10}/></a>{e.broadcast!.youtubeId&&<a href={e.broadcast!.sourceUrl} target="_blank" rel="noreferrer">YouTube<ArrowUpRight size={10}/></a>}</div></div></div></>}</section>;
}
function BroadcastPlayer({entry,locale}:{entry:Entry;locale:Locale}){
 const [playing,setPlaying]=useState(false),b=entry.broadcast!,l=favoriteUpdatesText[locale],playLabel=b.status==='ended'?broadcastArchiveText[locale].replay:l.play;const zone=useDisplayZone();const {simpleMode}=useCatalog();
 return <div className={'broadcast-screen'+(playing?' is-playing':'')}>{b.youtubeId?(playing?<iframe title={entryTitle(entry,locale)} src={`https://www.youtube-nocookie.com/embed/${b.youtubeId}?autoplay=1&playsinline=1&rel=0&hl=${locale}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<button onClick={()=>setPlaying(true)} aria-label={playLabel+' · '+entryTitle(entry,locale)}>{!simpleMode&&<img src={b.thumbnailUrl||`https://i.ytimg.com/vi/${b.youtubeId}/hqdefault.jpg`} alt="" loading="lazy"/>}<span className="broadcast-play"><Play size={25} fill="currentColor"/></span><strong>{playLabel}</strong></button>):<div className="broadcast-link-pending"><Radio size={32}/><p>{l.waiting}</p></div>}</div>;
}
