'use client';
import {useState} from 'react';
import {ArrowUpRight,Play} from 'lucide-react';
import type {LeakVideo as Video} from '@/lib/leaks';
import type {Locale} from '@/lib/types';
const labels={ko:{load:'영상 불러오기',source:'원문에서 보기',quality:'화질',failed:'영상을 불러오지 못했습니다.'},en:{load:'Load video',source:'View original post',quality:'Quality',failed:'Could not load this video.'},ja:{load:'動画を読み込む',source:'原文で見る',quality:'画質',failed:'動画を読み込めませんでした。'},zh:{load:'加载视频',source:'查看原帖',quality:'画质',failed:'无法加载此视频。'}};
export default function LeakVideo({video,locale}:{video:Video;locale:Locale}){
 const [loaded,setLoaded]=useState(false),[selected,setSelected]=useState(video.url),[failed,setFailed]=useState(false),[posterFailed,setPosterFailed]=useState(false),t=labels[locale];
 const variants=video.variants?.length?video.variants:[{url:video.url,width:video.width,height:video.height}];
 return <figure className="leak-video">
  {!loaded?<button type="button" className="leak-video-load" onClick={()=>setLoaded(true)}>{video.poster&&!posterFailed&&<img src={video.poster.url} alt="" loading="lazy" decoding="async" width={video.poster.width} height={video.poster.height} onError={()=>setPosterFailed(true)}/>}<span><Play size={22}/>{t.load}</span></button>:failed?<p role="status">{t.failed}</p>:<video key={selected} src={selected} poster={video.poster?.url} controls playsInline preload="metadata" width={video.width} height={video.height} onError={()=>setFailed(true)} aria-label={video.caption[locale]}/>}
  <figcaption><span>{video.caption[locale]}</span>{variants.length>1&&<label>{t.quality}<select aria-label={t.quality} value={selected} onChange={e=>{setSelected(e.target.value);setFailed(false)}}>{variants.map((v,i)=><option key={v.url} value={v.url}>{v.height?v.height+'p':v.bitrate?Math.round(v.bitrate/1000)+' kbps':String(i+1)}</option>)}</select></label>}<a href={video.sourceUrl} target="_blank" rel="noopener noreferrer">{t.source}<ArrowUpRight size={13}/></a></figcaption>
 </figure>;
}
