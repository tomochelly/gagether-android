'use client';
import {useEffect,useRef,type ReactNode} from 'react';
/** Native modal focus/escape handling; only the backdrop itself dismisses. */
export default function FocusedDialog({children,onClose,label,className=''}:{children:ReactNode;onClose:()=>void;label:string;className?:string}){
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const node=ref.current,previous=document.activeElement as HTMLElement|null;if(!node)return;node.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{node.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};},[]);
 return <dialog ref={ref} className={'focused-dialog '+className} aria-label={label} onCancel={e=>{e.preventDefault();close.current();}} onClick={e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close.current();}}>{children}</dialog>;
}
