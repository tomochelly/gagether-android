'use client';
import {useCallback,useEffect,useState,type RefObject,type CSSProperties} from 'react';
import {gallerySubject,galleryBackground,galleryProtectedHead,safeGalleryFrame,safePortraitFrame} from '@/lib/gallery-framing';
/** Background compositions stay on their existing path. Owner frames always take precedence. */
export function useAutomaticRosterFrame(ref:RefObject<HTMLImageElement|null>,url:string,kind:string|undefined,manual:boolean,portrait=false){
 const bounds=gallerySubject(url),enabled=!manual&&!galleryBackground(url)&&(!!bounds||kind==='full-body'),[state,setState]=useState<{url:string;style:CSSProperties}>();
 const measure=useCallback(()=>{const image=ref.current,parent=image?.parentElement;if(!enabled||!image?.naturalWidth||!parent)return;const box=parent.getBoundingClientRect(),card=parent.closest('.roster-card'),slant=card?parseFloat(window.getComputedStyle(card).getPropertyValue('--roster-slant'))||0:0,matching=bounds?.width===image.naturalWidth&&bounds?.height===image.naturalHeight?bounds:undefined,head=portrait&&matching?galleryProtectedHead(url):undefined,size={width:image.naturalWidth,height:image.naturalHeight},frame=head&&matching?safePortraitFrame(size,box,matching,head,slant,window.devicePixelRatio||1):safeGalleryFrame(size,box,matching,slant,window.devicePixelRatio||1);if(!frame)return;
  const style:CSSProperties={position:'absolute',inset:'auto',margin:0,left:frame.left,top:frame.top,width:frame.width,height:frame.height,maxWidth:'none',maxHeight:'none',objectFit:'fill',objectPosition:'50% 50%',transform:'none'};
  // Cached/native load handlers may have written old CSS caps. Geometry already caps actual source pixels.
  image.style.maxWidth='none';image.style.maxHeight='none';
  setState(old=>old?.url===url&&JSON.stringify(old.style)===JSON.stringify(style)?old:{url,style});
 },[url,enabled,bounds,portrait]);
 useEffect(()=>{if(!enabled)return;measure();const target=ref.current?.parentElement,observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(measure);if(target)observer?.observe(target);window.addEventListener('resize',measure);return()=>{observer?.disconnect();window.removeEventListener('resize',measure)};},[measure,enabled]);
 return {measure,style:enabled&&state?.url===url?state.style:undefined};
}
