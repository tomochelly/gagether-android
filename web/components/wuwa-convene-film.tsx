'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Volume2} from 'lucide-react';
import {conveneClip,conveneMediaUrl,type ConveneMediaClip} from '@/lib/wuwa-convene-media';
/** Only committed draws mount media. Segments retain the capture's original audio. */
export default function ConveneFilm({grade,sound,soundLabel,onDone,clipOverride,startAt=0,endAt}:{grade:number;sound:boolean;soundLabel:string;onDone:()=>void;clipOverride?:ConveneMediaClip;startAt?:number;endAt?:number}){
 const clip=clipOverride||conveneClip(grade),video=useRef<HTMLVideoElement>(null),done=useRef(onDone);
 done.current=onDone;
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[mutedFallback,setMutedFallback]=useState(false),[fallback,setFallback]=useState(false);
 const sourceHash=fallback&&clip.fallbackSha256?clip.fallbackSha256:clip.sha256;
 const stopAt=Math.min(endAt??clip.duration,clip.duration);
 useEffect(()=>{
  const el=video.current;if(!el)return;
  let closed=false,completed=false;let timer:ReturnType<typeof setTimeout>;
  setReady(false);setFailed(false);
  const finish=()=>{if(closed||completed)return;completed=true;el.pause();clearTimeout(timer);done.current();};
  const fail=()=>{if(closed||completed)return;el.pause();clearTimeout(timer);if(!fallback&&clip.fallbackSha256){setFallback(true);return;}setFailed(true);timer=setTimeout(finish,2000);};
  const playing=()=>{if(closed)return;setReady(true);clearTimeout(timer);timer=setTimeout(finish,Math.max(.1,stopAt-startAt)*1000+2000);};
  const tick=()=>{if(el.currentTime>=stopAt-.025)finish();};
  const play=()=>{if(closed)return;void el.play().catch(async()=>{if(closed)return;if(sound){el.muted=true;setMutedFallback(true);try{await el.play();}catch{fail();}}else fail();});};
  const prepare=()=>{if(closed)return;if(startAt>0){el.currentTime=startAt;}else play();};
  const seeked=()=>{if(!closed&&el.currentTime>=startAt-.05)play();};
  el.volume=1;el.addEventListener('playing',playing);el.addEventListener('error',fail);el.addEventListener('ended',finish);el.addEventListener('timeupdate',tick);el.addEventListener('loadedmetadata',prepare);el.addEventListener('seeked',seeked);
  timer=setTimeout(fail,7000);
  if(el.readyState>=1)prepare();
  return()=>{closed=true;clearTimeout(timer);el.removeEventListener('playing',playing);el.removeEventListener('error',fail);el.removeEventListener('ended',finish);el.removeEventListener('timeupdate',tick);el.removeEventListener('loadedmetadata',prepare);el.removeEventListener('seeked',seeked);el.pause();el.removeAttribute('src');el.load();};
 },[sourceHash,sound,startAt,stopAt]);
 return <>{!failed&&<video ref={video} className={'convene-film'+(ready?' is-playing':'')+(grade===3?' is-blue':'')+(clip.fit==='screen'?' is-screen-fit':'')} src={conveneMediaUrl(sourceHash)} style={{'--film-width':clip.width+'px','--film-height':clip.height+'px'} as CSSProperties} muted={!sound||mutedFallback} playsInline preload="auto" aria-hidden="true"/>}{!failed&&sound&&mutedFallback&&<button className="convene-film-sound" onClick={()=>{const el=video.current;if(!el)return;el.muted=false;void el.play().then(()=>setMutedFallback(false)).catch(()=>{el.muted=true;});}}><Volume2 size={16}/>{soundLabel}</button>}</>;
}
