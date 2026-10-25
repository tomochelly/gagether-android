'use client';
import {useCallback,useEffect,useState,type CSSProperties,type RefObject} from 'react';
import {frameGeometry} from '@/lib/image-framing';
import type {ImageFrame} from '@/lib/types';
/** Manual placement deliberately honors the owner's zoom beyond native pixels. */
export function useRosterArtFrame(ref:RefObject<HTMLImageElement|null>,url:string,frame:ImageFrame|undefined){
 const [box,setBox]=useState<{width:number;height:number;naturalWidth:number;naturalHeight:number}>();
 const measure=useCallback(()=>{const image=ref.current,target=image?.parentElement;if(!image?.naturalWidth||!target)return;const rect=target.getBoundingClientRect();if(rect.width&&rect.height)setBox(old=>{const next={width:rect.width,height:rect.height,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight};return old&&Object.keys(next).every(k=>old[k as keyof typeof old]===next[k as keyof typeof next])?old:next;});},[url]);
 useEffect(()=>{if(!frame)return;const target=ref.current?.parentElement;measure();const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(measure);if(target)observer?.observe(target);window.addEventListener('resize',measure);return()=>{observer?.disconnect();window.removeEventListener('resize',measure)};},[url,!!frame,measure]);
 const geometry=frame&&box?frameGeometry({width:box.naturalWidth,height:box.naturalHeight},box,frame):undefined;
 const style:CSSProperties|undefined=geometry?{position:'absolute',inset:'auto',margin:0,left:geometry.left,top:geometry.top,width:geometry.width,height:geometry.height,maxWidth:'none',maxHeight:'none',objectFit:'fill',objectPosition:'50% 50%',transform:'none'}:undefined;
 return {style,measure};
}
