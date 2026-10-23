'use client';
import {EntryEdit} from './owner-inline';
import type {OpenEntry} from '@/lib/pickup-detail';
import SecondaryPickups from './secondary-pickups';
import {useDisplayZone} from './display-time';
import {ownerUi} from '@/lib/owner-ui';
import {useEffect,useState,type CSSProperties} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Clock3,ExternalLink,ImageOff,Pause,Play,Pencil,Star} from 'lucide-react';
import type {Entry,Game,Locale,Region} from '@/lib/types';
import {entryState} from '@/lib/types';
import {entryTitle,matchedArtwork,regionLabel,versionCaption} from '@/lib/presentation';
import {editorText} from '@/lib/editor-i18n';
import {pickupBannerLabel,type SpotlightSlide} from '@/lib/spotlight';
import {useCatalog,editEntryTarget} from './catalog-context';
import ArtworkMedia from './artwork-media';
import {artworkForLocale,serviceArtworkLocale,isBrandArtwork} from '@/lib/artwork';
import {isPickup,pickupPeriod,pickupStart,pickupEnd,historyText} from '@/lib/pickup-history';
import {isForecast,pickupEstimate,pickupStartLabel,estimateText} from '@/lib/pickup-estimates';

export default function Spotlight({slides,index,onIndex,locale,now,region,fallbackGame,gameView,blocked=false,onOpen,onGame,favorite,onFavorite}:{slides:SpotlightSlide[];index:number;onIndex:(n:number)=>void;locale:Locale;now:number;region:Region;fallbackGame:Game;gameView:boolean;blocked?:boolean;onOpen:OpenEntry;onGame:(id:string)=>void;favorite:boolean;onFavorite:()=>void}){
 const zone=useDisplayZone();const {t,byId,settings,editMode,openEditor}=useCatalog();const labels=editorText[locale];
 const [paused,setPaused]=useState(false);const [hover,setHover]=useState(false);const [focus,setFocus]=useState(false);const [hidden,setHidden]=useState(false);const [reduced,setReduced]=useState(false);
 const current=slides[index%Math.max(1,slides.length)];const e=current?.entry;const art=current?.art;const game=e?byId[e.gameId]:fallbackGame;
 const candidate=art?artworkForLocale(art,locale,'preview',serviceArtworkLocale(art.region,art.gameId)):undefined;
 const resolvedArt=candidate&&!isBrandArtwork(candidate.image,game)?candidate:undefined;
 const seconds=settings.carouselSeconds||6;const signature=slides.map(s=>s.id).join('|');const running=!blocked&&!paused&&!hover&&!focus&&!hidden&&!reduced&&slides.length>1;
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const motion=()=>setReduced(media.matches);const visibility=()=>setHidden(document.hidden);motion();visibility();media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{if(!running)return;const timer=setTimeout(()=>onIndex((index+1)%slides.length),seconds*1000);return()=>clearTimeout(timer);},[running,index,seconds,signature,onIndex,slides.length]);
 const state=e?(isPickup(e)?({current:'active',upcoming:'upcoming',past:'ended'} as const)[pickupPeriod(e,now)]:entryState(e,now)):'notice';
 const future=state==='upcoming',forecast=!!e&&isForecast(e),estimate=e&&pickupEstimate(e),exactAt=future?e?.startAt:e?.endAt,dateOnly=state==='active'&&!e?.startAt;
 const time=exactAt?new Intl.DateTimeFormat(locale==='ko'?'ko-KR':locale==='ja'?'ja-JP':locale==='zh'?'zh-CN':'en-GB',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:zone}).format(new Date(exactAt)):null;
 const advance=(n:number)=>onIndex((index+n+slides.length)%slides.length);
 return <div className="owner-banner-frame"><section className={'spotlight'+(art?.imageKind==='banner'?' is-banner':'')+(state==='upcoming'?' is-upcoming':'')+(dateOnly?' is-date-only':'')} aria-label={t.featured} aria-roledescription="carousel" style={{'--spot-color':game.color,'--slide-duration':seconds+'s'} as CSSProperties} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocus(false);}}>
  <div className="spotlight-scene" key={current?.id||game.id}>
   <div className="spotlight-glow" style={{backgroundImage:resolvedArt?.imageVerified&&resolvedArt.image?`url(${resolvedArt.image})`:undefined}}/>
   <div className="spotlight-visual">{art?(resolvedArt?.imageVerified&&resolvedArt.image?<ArtworkMedia locale={locale} serviceLocale={serviceArtworkLocale(art.region,art.gameId)} art={art} alt={entryTitle(art,locale)} priority banner/>:<span className="art-pending"><ImageOff size={32}/>{t.imagePending}</span>):<span className="art-pending"><ImageOff size={32}/>{t.imagePending}</span>}</div>
   <div className="spotlight-wash"/>{editMode&&e&&<button className="canvas-image-edit edit-chip" onClick={()=>openEditor({...editEntryTarget(e),focus:e.pickupMembers?.some(m=>m.image)?'members':'image'})}><Pencil size={14}/>{ownerUi[locale].editImage}</button>}
   <div className="spotlight-copy"><div className="spotlight-kicker"><span className="live-dot"/>{e&&isPickup(e)?pickupBannerLabel(e,now,locale):state==='active'?t.now:future?t.upcoming:t.featured}<span>{versionCaption(art||e||({} as Entry),locale)}</span></div><img className="spotlight-logo" src={game.logo} alt={game.name[locale]}/>
    <div className="spotlight-badges">{art?.pickupType&&<span className={'pickup-badge '+art.pickupType}>{art.pickupType==='new'?t.newPickup:art.pickupType==='rerun'?t.rerunPickup:art.pickupType==='mixed'?t.mixedPickup:t.unknownPickup}</span>}<span>{regionLabel(game,e?.region||region,locale,t)}</span></div>
    <h2>{art?entryTitle(art,locale):game.name[locale]}</h2><p>{e?.summary[locale]||game.genre[locale]}</p>{e&&<SecondaryPickups entry={e} locale={locale}/>}
    {time?<div className="spotlight-deadline"><Clock3 size={14}/><span>{future?t.starts:t.ends} <b>{time}</b> <small>{zone}</small></span></div>:e&&isPickup(e)&&<div className="spotlight-deadline"><Clock3 size={14}/><span><b>{future?pickupStartLabel(e,locale,pickupStart(e,zone)):pickupEnd(e)?t.ends+' '+pickupEnd(e)!.replaceAll('-','.'):pickupStartLabel(e,locale,pickupStart(e,zone))}</b><small>{estimate?.scope==='version'?estimateText[locale].version:forecast?estimateText[locale][estimate?.method==='cycle'?'cycle':'community']:historyText[locale].dateOnly}</small></span></div>}
    <div className="spotlight-actions"><button className="primary-button" onClick={()=>gameView&&e?onOpen(e,art?.title):onGame(game.id)}>{gameView?t.more:t.openGame}<ArrowUpRight size={18}/></button></div>
   </div>
  </div>
  <div className="spotlight-top"><span>{game.short} / {art?.poolType==='support'?t.supportPool:t.characterPool}</span><div>{editMode&&<button className="edit-chip" onClick={()=>openEditor(e?editEntryTarget(e):{tab:'games',gameId:game.id})}><Pencil size={13}/>{labels.editor}</button>}{gameView&&<button className={'spotlight-follow '+(favorite?'followed':'')} onClick={onFavorite} aria-label={favorite?t.unfavorite:t.favorite}><Star size={17} fill={favorite?'currentColor':'none'}/></button>}</div></div>
  {slides.length>1&&<div className="spotlight-navigation"><div className="spotlight-switches" aria-label={t.simultaneous}>{slides.map((slide,i)=><button key={slide.id} className={i===index%slides.length?'active':''} onClick={()=>onIndex(i)} aria-current={i===index%slides.length?'true':undefined} aria-label={entryTitle(slide.art,locale)}>{slide.art.imageVerified&&slide.art.image&&<ArtworkMedia locale={locale} serviceLocale={serviceArtworkLocale(slide.art.region,slide.art.gameId)} art={slide.art} alt="" className="spotlight-thumb"/>}<span><small>{slide.art.pickupType==='new'?t.newPickup:slide.art.pickupType==='rerun'?t.rerunPickup:t.featured}</small><strong>{entryTitle(slide.art,locale)}</strong></span>{i===index%slides.length&&<i key={current.id+':'+running} className={'slide-progress'+(running?' running':'')}/>}</button>)}</div><div className="spotlight-stepper"><button aria-label={t.prev} onClick={()=>advance(-1)}><ArrowLeft size={17}/></button><span>{String(index%slides.length+1).padStart(2,'0')}<i> / {String(slides.length).padStart(2,'0')}</i></span><button aria-label={t.next} onClick={()=>advance(1)}><ArrowRight size={17}/></button><button className="spotlight-pause" aria-label={paused?labels.play:labels.pause} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div></div>}
 </section>{e&&<EntryEdit key={current.id} entry={e} member={art?.title} locale={locale}/>}</div>;
}
