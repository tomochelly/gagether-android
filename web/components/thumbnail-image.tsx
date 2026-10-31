'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ImageOff} from 'lucide-react';
import type {ImageFrame,PreviewFocus} from '@/lib/types';
import {fillThumbnailFrame,type ThumbnailHead} from '@/lib/thumbnail-framing';
/** A clean, clipped original: no duplicated backdrop, feathered edges or source modification. */
export default function ThumbnailImage({src,alt,head,focus,frame,priority=false,onUnavailable}:{src:string;alt:string;head?:ThumbnailHead;focus?:PreviewFocus;frame?:ImageFrame;priority?:boolean;onUnavailable?:()=>void}){
 const box=useRef<HTMLSpanElement>(null),image=useRef<HTMLImageElement>(null),[style,setStyle]=useState<CSSProperties>(),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{setStyle(undefined);setFailed(false);setRetry(0);if(image.current?.complete)measure()},[src]);
 useEffect(()=>{if(!failed)return;if(retry<2){const timer=setTimeout(()=>{setRetry(n=>n+1);setFailed(false)},retry?1400:350);return()=>clearTimeout(timer);}onUnavailable?.();},[failed,retry,onUnavailable]);
 const measure=()=>{const el=image.current,parent=box.current;if(!el?.naturalWidth||!parent)return;const rect=parent.getBoundingClientRect(),placement=fillThumbnailFrame({width:el.naturalWidth,height:el.naturalHeight},rect,head,focus,frame);if(placement)setStyle({position:'absolute',width:placement.width,height:placement.height,left:placement.left,top:placement.top,maxWidth:'none',maxHeight:'none',objectFit:'fill',margin:0,transform:'none'});};
 useEffect(()=>{const el=box.current;if(!el)return;const observer=new ResizeObserver(measure);observer.observe(el);measure();return()=>observer.disconnect()},[src,head?.left,head?.top,head?.right,head?.bottom,focus?.x,focus?.y,focus?.zoom,frame?.x,frame?.y,frame?.zoom,frame?.fit]);
 return <span ref={box} className="thumbnail-image" data-image-unavailable={failed&&retry>=2||undefined}>{failed&&retry>=2?<span className="thumbnail-missing" aria-label={alt}><ImageOff size={20}/></span>:<img key={src+'|'+retry} ref={image} src={src} alt={alt} title={alt} style={style} loading={priority?'eager':'lazy'} decoding="async" fetchPriority={priority?'high':'auto'} referrerPolicy="no-referrer" onLoad={measure} onError={()=>setFailed(true)}/>}</span>;
}
