'use client';
import {useEffect,useRef,useState} from 'react';
import type {Locale} from '@/lib/types';
import AccountSyncStatus from './account-sync-status';
import {prepareAccountExit,completeAccountExit,cancelAccountExit} from '@/lib/account-sync-client';
import {accountUi} from '@/lib/account-ui';
import {discordAccountUi} from '@/lib/discord-account-ui';
import type {VisitorUser} from '@/lib/visitor-identity';
import DiscordSignIn from './discord-sign-in';
type GoogleId={initialize:(options:{client_id:string;nonce:string;callback:(response:{credential?:string})=>void;auto_select:boolean;ux_mode:'popup';use_fedcm_for_button:boolean})=>void;renderButton:(element:HTMLElement,options:{type:string;theme:string;size:string;text:string;shape:string;logo_alignment:string;locale:string;width:number})=>void;disableAutoSelect:()=>void};
const googleId=()=>(window as unknown as {google?:{accounts?:{id?:GoogleId}}}).google?.accounts?.id;
let sdk:Promise<void>|undefined;
function loadGoogle(locale:Locale){
 if(googleId())return Promise.resolve();
 if(!sdk)sdk=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client?hl='+locale;script.async=true;const timer=setTimeout(fail,15000);function fail(){clearTimeout(timer);script.remove();sdk=undefined;reject(Error('Google unavailable'));}script.onload=()=>{clearTimeout(timer);if(googleId())resolve();else fail();};script.onerror=fail;document.head.appendChild(script);});return sdk;
}
export default function GoogleAccount({locale,user,discordOrigin=null,returnTo='/',discordResult}:{locale:Locale;user:VisitorUser|null;discordOrigin?:string|null;returnTo?:string;discordResult?:'cancelled'|'failed'}){
 const t=accountUi[locale],dt=discordAccountUi[locale],target=useRef<HTMLDivElement>(null),locked=useRef(false);
 const [attempt,setAttempt]=useState(0),[loading,setLoading]=useState(!user),[busy,setBusy]=useState(false),[error,setError]=useState(false),[native,setNative]=useState(false);
 useEffect(()=>{
  if(user)return;let cancelled=false;let resize:ResizeObserver|undefined;
  if(window.PatchworkNative||/; wv\)/.test(navigator.userAgent)){setNative(true);setLoading(false);return;}
  setLoading(true);setError(false);
  (async()=>{try{
   const r=await fetch('/api/auth/google',{headers:{'X-Gagether-Auth':'1'},cache:'no-store'});if(!r.ok)throw Error();
   const {clientId,nonce}=await r.json() as {clientId:string;nonce:string};await loadGoogle(locale);if(cancelled||!target.current)return;
   const google=googleId()!;
   google.initialize({client_id:clientId,nonce,auto_select:false,ux_mode:'popup',use_fedcm_for_button:true,callback:async response=>{
    if(cancelled||locked.current)return;locked.current=true;setBusy(true);setError(false);
    try{if(!response.credential)throw Error();const result=await fetch('/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json','X-Gagether-Auth':'1'},body:JSON.stringify({credential:response.credential,nonce}),cache:'no-store'});if(!result.ok)throw Error();window.location.reload();}
    catch{if(!cancelled)setError(true);}finally{locked.current=false;if(!cancelled)setBusy(false);}
   }});
   const slot=target.current;let renderedWidth=0;
   const render=()=>{if(cancelled)return;const width=Math.min(320,Math.floor(slot.clientWidth||260));if(width===renderedWidth)return;renderedWidth=width;slot.replaceChildren();google.renderButton(slot,{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'rectangular',logo_alignment:'left',locale,width});};
   render();if(typeof ResizeObserver!=='undefined'){resize=new ResizeObserver(render);resize.observe(slot);}setLoading(false);
  }catch{if(!cancelled){setError(true);setLoading(false);}}})();
  return()=>{cancelled=true;resize?.disconnect();};
 },[user,locale,attempt]);
 async function endSession(action:'logout'|'delete-account'){
  if(locked.current||action==='delete-account'&&!window.confirm(t.confirm))return;locked.current=true;setBusy(true);setError(false);
  try{await prepareAccountExit(action==='delete-account');const r=await fetch('/api/auth/session',{method:'POST',headers:{'Content-Type':'application/json','X-Gagether-Auth':'1'},body:JSON.stringify({action}),cache:'no-store'});if(!r.ok)throw Error();completeAccountExit(action==='delete-account');googleId()?.disableAutoSelect();window.location.reload();}catch{cancelAccountExit();setError(true);setBusy(false);locked.current=false;}
 }
 return <>{user?<><p className="account-status">{user.provider==='discord'?dt.signedIn:t.signedIn}</p><h2>{user.name}</h2>{user.email&&<p className="account-email">{user.email}</p>}<button className="account-action" disabled={busy} onClick={()=>endSession('logout')}>{t.signOut}</button><button className="account-delete" disabled={busy} onClick={()=>endSession('delete-account')}>{t.remove}</button></>:<><p>{discordOrigin?dt.intro:t.intro}</p>{native?<><p>{discordOrigin?dt.browser:t.browser}</p><a className="account-action" href={'https://gagether.wiki/account?locale='+locale} target="_blank" rel="noopener noreferrer">{t.openBrowser}</a></>:<><div className="account-providers"><div className="google-signin-slot" aria-label={t.signIn} aria-busy={loading} ref={target} inert={busy}/>{discordOrigin&&<DiscordSignIn locale={locale} returnTo={returnTo} origin={discordOrigin}/>}</div>{discordOrigin&&<p className="account-provider-note">{dt.separate}</p>}</>}{discordResult&&<p role={discordResult==='cancelled'?'status':'alert'}>{discordResult==='cancelled'?dt.cancelled:dt.error}</p>}<p>{t.anonymous}</p></>}{(loading||busy)&&<p role="status">{busy?t.busy:t.loading}</p>}{error&&<div role="alert"><p>{user?t.sessionError:t.error}</p>{!user&&<button className="account-action" disabled={busy} onClick={()=>setAttempt(v=>v+1)}>{t.retry}</button>}</div>}<AccountSyncStatus locale={locale} detail/><p className="account-local-note">{t.local}</p><details className="account-privacy"><summary>{t.privacy}</summary><p>{discordOrigin||user?.provider==='discord'?dt.privacy:t.privacyText}</p></details></>;
}
