'use client';
import {useEffect} from 'react';
import {drawerGesture,DRAWER_EDGE_PX,type DrawerTouch} from '@/lib/mobile-drawer';
export function useMobileDrawer(open:boolean,onChange:(value:boolean)=>void,blocked=false){
 useEffect(()=>{
  let start:DrawerTouch|null=null,ignored=false;
  const down=(e:TouchEvent)=>{start=null;const t=e.touches[0],target=e.target as Element;ignored=blocked||e.touches.length!==1||!!target.closest('input,textarea,select,[contenteditable=true],dialog[open],.owner-inline-form,.editor-inspector,.photo-position-editor,.schedule-calendar,.calendar-panel,.pickup-montage.is-scrollable,.compact-card-rail,.game-pickup-tiles,.schedule-timeline,.game-section-tabs,.image-lightbox');if(!t||ignored)return;const inside=!!target.closest('#gagether-sidebar');if((!open&&t.clientX>Math.min(DRAWER_EDGE_PX,window.innerWidth*.2))||(open&&!inside))return;start={x:t.clientX,y:t.clientY,at:performance.now(),open};};
  const move=(e:TouchEvent)=>{if(!start||e.touches.length!==1)return;const t=e.touches[0],dx=t.clientX-start.x,dy=Math.abs(t.clientY-start.y);if(dy>18&&dy>Math.abs(dx)){start=null;return;}if(Math.abs(dx)>16&&Math.abs(dx)>dy*1.7&&e.cancelable)e.preventDefault();};
  const up=(e:TouchEvent)=>{const t=e.changedTouches[0];if(start&&t){const action=drawerGesture(start,{x:t.clientX,y:t.clientY,at:performance.now()},window.innerWidth,ignored);if(action){if(e.cancelable)e.preventDefault();onChange(action==='open');}}start=null;};
  const cancel=()=>{start=null;};
  document.addEventListener('touchstart',down,{passive:true});document.addEventListener('touchmove',move,{passive:false});document.addEventListener('touchend',up,{passive:false});document.addEventListener('touchcancel',cancel,{passive:true});
  return()=>{document.removeEventListener('touchstart',down);document.removeEventListener('touchmove',move);document.removeEventListener('touchend',up);document.removeEventListener('touchcancel',cancel);};
 },[open,onChange,blocked]);
 useEffect(()=>{
  if(!open||!window.matchMedia('(max-width:1100px)').matches)return;
  const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
  const sidebar=document.getElementById('gagether-sidebar');document.body.style.overflow='hidden';sidebar?.querySelector<HTMLElement>('button,a')?.focus();
  const key=(e:KeyboardEvent)=>{if(document.querySelector('dialog[open]'))return;if(e.key==='Escape'){e.preventDefault();onChange(false);}if(e.key==='Tab'&&sidebar){const items=[...sidebar.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],select')].filter(n=>n.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
  document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
 },[open,onChange]);
}
