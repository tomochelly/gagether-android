'use client';
import {useEffect,useRef} from 'react';
import {usageDay} from '@/lib/usage';
export default function UsageTracker({enabled,view,gameId,locale,appMode,pageKey}:{enabled:boolean;view:string;gameId?:string;locale:string;appMode:boolean;pageKey?:string}){
 const current=useRef({view,gameId,locale,appMode});current.current={view,gameId,locale,appMode};
 const pending=useRef<{key:string;id:string}|null>(null);
 useEffect(()=>{
  if(!enabled||typeof globalThis.crypto?.randomUUID!=='function')return;
  const key=view+':'+(gameId||'')+':'+(pageKey||'');
  if(pending.current?.key!==key)pending.current={key,id:crypto.randomUUID()};
  const eventId=pending.current.id;let disposed=false,sent=false,busy=false;
  const send=async()=>{
   if(document.hidden||disposed||busy||navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl)return;
   try{
    if(localStorage.getItem('gagether.usage.optout')==='1')return;
    const day=usageDay();let visitor: {day:string;id:string}|null=null;
    try{visitor=JSON.parse(localStorage.getItem('gagether.usage.daily')||'null');}catch{}
    if(!visitor||visitor.day!==day){visitor={day,id:crypto.randomUUID()};localStorage.setItem('gagether.usage.daily',JSON.stringify(visitor));}
    const v=current.current;let referrer='direct';try{const u=new URL(document.referrer);if(u.hostname!==location.hostname)referrer=u.hostname;}catch{}
    const nativeApp=v.appMode&&!!window.PatchworkNative;
    const device=nativeApp?'android-app':/iPad|Tablet/i.test(navigator.userAgent)?'web-tablet':/Mobi|Android/i.test(navigator.userAgent)?'web-mobile':'web-desktop';
    busy=true;const r=await fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId:visitor.id,eventId,type:sent?'heartbeat':'view',view:v.view,gameId:v.gameId||null,locale:v.locale,device,referrer}),keepalive:true});if(r.ok)sent=true;
   }catch{/* Analytics must never interrupt browsing. */}finally{busy=false;}
  };
  const delay=setTimeout(()=>void send(),600);const timer=setInterval(()=>void send(),60000);const visible=()=>void send();document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;clearTimeout(delay);clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[enabled,view,gameId,pageKey]);
 return null;
}
