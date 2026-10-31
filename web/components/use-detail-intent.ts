'use client';
import {createElement,useEffect,useRef,type AnchorHTMLAttributes,type ButtonHTMLAttributes} from 'react';

let speculative=0;
export function prefetchPublicDetail(load:()=>Promise<unknown>){
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
 if(document.visibilityState==='hidden'||connection?.saveData||speculative>=2)return;
 speculative++;
 void load().catch(()=>{}).finally(()=>{speculative--;});
}
/** Prepare just the hovered/focused item. Click readers join the same promise. */
export function useDetailIntent(load:()=>Promise<unknown>,key:string,enabled=true){
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),latest=useRef(load);latest.current=load;
 const cancel=()=>{clearTimeout(timer.current);timer.current=undefined;};
 const start=()=>{cancel();if(enabled)prefetchPublicDetail(()=>latest.current());};
 useEffect(()=>cancel,[key,enabled]);
 return {onPointerEnter:()=>{cancel();if(enabled)timer.current=setTimeout(start,120);},onPointerLeave:cancel,onFocus:start,onBlur:cancel,onPointerDown:(e:{pointerType:string})=>{if(e.pointerType==='touch')start();}};
}
export function DetailIntentLink({load,cacheKey,enabled=true,...props}:AnchorHTMLAttributes<HTMLAnchorElement>&{load:()=>Promise<unknown>;cacheKey:string;enabled?:boolean}){const intent=useDetailIntent(load,cacheKey,enabled);return createElement('a',{...props,...intent});}
export function DetailIntentButton({load,cacheKey,enabled=true,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{load:()=>Promise<unknown>;cacheKey:string;enabled?:boolean}){const intent=useDetailIntent(load,cacheKey,enabled);return createElement('button',{...props,...intent});}
