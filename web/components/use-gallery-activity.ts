'use client';
import {useEffect,type RefObject} from 'react';
/** One observer for the list; unseen seams do not run hundreds of SVG animations. */
export function useGalleryActivity(ref:RefObject<HTMLElement|null>,key:unknown){
 useEffect(()=>{
  const gallery=ref.current;if(!gallery||typeof IntersectionObserver==='undefined')return;
  gallery.classList.add('gallery-windowed');
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)entry.target.setAttribute('data-gallery-visible','');else entry.target.removeAttribute('data-gallery-visible');}},{rootMargin:'160px'});
  for(const card of gallery.children)observer.observe(card);
  return()=>{observer.disconnect();gallery.classList.remove('gallery-windowed');};
 },[ref,key]);
}
