'use client';
import {useState} from 'react';
import {ArrowUpRight,Bookmark,ChevronDown,ChevronUp,Flag,Play} from 'lucide-react';
import {useCatalog} from './catalog-context';
import {useDisplayZone} from './display-time';
import SignatureWeapons from './signature-weapons';
import {signatureWeapons} from '@/lib/weapon-links';
import {dashboardGroups,previewGameEntries,dashboardEntryDate,dashboardDateLabel} from '@/lib/dashboard-groups';
import type {Entry,Game,Locale} from '@/lib/types';
import {entryTitle,regionLabel} from '@/lib/presentation';
import {entryPath} from '@/lib/discovery';
import {textAppearance,textAppearanceStyle} from '@/lib/text-appearance';

export const dashboardCopy={ko:{title:'게임별 소식',more:'더 보기',less:'접기',moreGames:'다른 게임 더 보기',open:'게임 페이지'},en:{title:'Updates by game',more:'Show more',less:'Show less',moreGames:'More games',open:'Game page'},ja:{title:'ゲーム別の情報',more:'もっと見る',less:'閉じる',moreGames:'ほかのゲームを見る',open:'ゲームページ'},zh:{title:'各游戏动态',more:'展开',less:'收起',moreGames:'更多游戏',open:'游戏页面'}};
export default function DashboardGameFeed({entries,weaponEntries,games,favorites,locale,now,saved,onSave,onOpen}:{entries:Entry[];weaponEntries:Entry[];games:Game[];favorites:string[];locale:Locale;now:number;saved:string[];onSave:(id:string)=>void;onOpen:(entry:Entry)=>void}){
 const groups=dashboardGroups(entries,games,favorites),[limit,setLimit]=useState(6),c=dashboardCopy[locale];
 return <div className="dashboard-game-feed"><div className="dashboard-game-grid">{groups.slice(0,limit).map(group=><GameNews key={group.game.id} {...group} weaponEntries={weaponEntries} locale={locale} now={now} saved={saved} onSave={onSave} onOpen={onOpen}/>)}</div>{groups.length>limit&&<button className="dashboard-more-games" onClick={()=>setLimit(n=>n+6)}>{c.moreGames}<span>{Math.min(limit,groups.length)} / {groups.length}</span><ChevronDown size={14}/></button>}</div>;
}
function GameNews({game,entries,weaponEntries,locale,now,saved,onSave,onOpen}:{game:Game;entries:Entry[];weaponEntries:Entry[];locale:Locale;now:number;saved:string[];onSave:(id:string)=>void;onOpen:(entry:Entry)=>void}){
 const [expanded,setExpanded]=useState(false),c=dashboardCopy[locale],shown=expanded?entries:previewGameEntries(entries),{t}=useCatalog(),zone=useDisplayZone();
 return <section className="dashboard-game-panel" aria-label={game.name[locale]}>
  <header><a href={`/${locale}/games/${game.id}`}><img src={game.icon||game.logo} alt="" loading="lazy"/><h3>{game.name[locale]}</h3><ArrowUpRight size={14}/></a><span>{entries.length}</span></header>
  <div className="dashboard-game-rows">{shown.map(e=>{
   const {at,kind}=dashboardEntryDate(e,now),links=signatureWeapons(e,weaponEntries);
   return <article className="dashboard-game-row" key={e.id}>
    <div className="dashboard-row-main"><div className="dashboard-row-meta"><span>{e.poolType==='support'?t.supportPool:t[e.kind]}</span><span>{regionLabel(game,e.region,locale,t)}</span></div><a href={entryPath(locale,e)} onClick={event=>{if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onOpen(e);}}}><strong style={textAppearanceStyle(textAppearance(e,locale),'title')}>{entryTitle(e,locale)}</strong></a>{!!links.length&&<SignatureWeapons links={links} locale={locale} compact onOpen={onOpen}/>}</div>
    <div className="dashboard-row-date">{at&&<><span className={kind}>{kind==='ends'?<Flag size={11}/>:kind==='starts'?<Play size={11}/>:null}{t[kind]}</span><time dateTime={at}>{dashboardDateLabel(at,locale,zone)}</time></>}</div>
    <button className="dashboard-row-save" aria-label={saved.includes(e.id)?t.unbookmark:t.bookmark} aria-pressed={saved.includes(e.id)} onClick={()=>onSave(e.id)}><Bookmark size={14} fill={saved.includes(e.id)?'currentColor':'none'}/></button>
   </article>;
  })}</div>
  {entries.length>4&&<button className="dashboard-group-expand" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?c.less:c.more}{!expanded&&<span>+{entries.length-shown.length}</span>}{expanded?<ChevronUp size={13}/>:<ChevronDown size={13}/>}</button>}
 </section>;
}
