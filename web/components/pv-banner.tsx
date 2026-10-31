'use client';
import {useEffect,useState,type CSSProperties} from 'react';
import {Play,X,ArrowUpRight} from 'lucide-react';
import {collectVideos,languageScopedVideos} from '@/lib/videos';
import {byId} from '@/lib/games';
import {textAppearanceStyle} from '@/lib/text-appearance';
import type {Entry,Locale} from '@/lib/types';
export function recentPVClips(entries:Entry[],locale:Locale,now:number){return languageScopedVideos(collectVideos(entries,locale).filter(v=>{
 const at=v.publishedAt||v.discoveredAt;return v.format==='pv'&&at&&Number.isFinite(Date.parse(at))&&Date.parse(at)<=now+300000&&now-Date.parse(at)<=7*86400000;
}),locale).slice(0,12);}
const words={ko:{new:'신규 PV',play:'PV 재생',close:'영상 닫기',original:'공식 원본',open:'YouTube에서 보기'},en:{new:'NEW PV',play:'Play trailer',close:'Close video',original:'Official original',open:'Watch on YouTube'},ja:{new:'新着PV',play:'PVを再生',close:'動画を閉じる',original:'公式原文',open:'YouTubeで見る'},zh:{new:'全新PV',play:'播放PV',close:'关闭视频',original:'官方原文',open:'在YouTube观看'}};
const languages={ko:'한국어',en:'English',ja:'日本語',zh:'中文'};
export default function PVBanner({entries,locale,now}:{entries:Entry[];locale:Locale;now:number}){
 const clips=recentPVClips(entries,locale,now),[chosen,setChosen]=useState(''),[playing,setPlaying]=useState(''),[failed,setFailed]=useState<string[]>([]),v=clips.find(c=>c.youtubeId===chosen)||clips[0],t=words[locale];
 useEffect(()=>{setChosen('');setPlaying('')},[locale]);
 if(!v)return null;
 const entry=entries.find(e=>v.entryIds.includes(e.id)&&e.sourceUrl===v.sourceUrl),title=entry?.title[locale]||v.title[locale]||v.originalTitle||v.title[v.locale],game=byId[v.gameId],fallback=`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,thumbnail=v.thumbnailUrl&&!failed.includes(v.thumbnailUrl)?v.thumbnailUrl:fallback;
 return <section className="pv-banner" aria-label={t.new} style={{'--pv-accent':game.color} as CSSProperties} onKeyDown={e=>{if(e.key==='Escape'&&playing){e.preventDefault();setPlaying('')}}}><div className="pv-banner-scene" key={v.youtubeId}>
 <div className="pv-banner-visual">{!failed.includes(thumbnail)?<img src={thumbnail} alt="" loading="lazy" onError={()=>setFailed(a=>[...a,thumbnail])}/>:<span className="pv-poster-fallback" aria-hidden="true"><Play size={72} strokeWidth={.75}/><span>PV</span></span>}</div><div className="pv-banner-wash"/>
 <div className="pv-banner-copy"><div className="pv-banner-eyebrow"><span className="pv-banner-kicker"><i/>{t.new} <small>{languages[v.locale]}</small></span><span className="pv-banner-game">{game.name[locale]}</span></div><h2 style={textAppearanceStyle(entry?.textStyle?.[locale],'title')}>{title}</h2><div className="pv-banner-actions"><button className="primary-button" onClick={()=>setPlaying(v.youtubeId)}><Play size={17} fill="currentColor"/>{t.play}</button><a href={v.sourceUrl} target="_blank" rel="noreferrer">{t.open}<ArrowUpRight size={14}/></a></div></div>
 {playing===v.youtubeId&&<div className="pv-banner-player"><iframe src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&playsinline=1&rel=0&hl=${locale}`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/><button autoFocus aria-label={t.close} onClick={()=>setPlaying('')}><X size={20}/></button></div>}
 </div>{clips.length>1&&<nav className="pv-banner-choices" aria-label={t.new}>{clips.map(c=><button key={c.gameId+':'+c.youtubeId} aria-pressed={c.youtubeId===v.youtubeId} onClick={()=>{setChosen(c.youtubeId);setPlaying('')}}><span>{byId[c.gameId].short} · {languages[c.locale]}</span>{c.title[locale]||c.originalTitle||c.title[c.locale]}</button>)}</nav>}</section>;
}
