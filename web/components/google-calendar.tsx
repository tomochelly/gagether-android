'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {CalendarPlus,ExternalLink} from 'lucide-react';
import type {Entry,Game,Locale} from '@/lib/types';
import {calendarEvent,calendarEventId,calendarScope,calendarTemplateUrl,calendarUi,CalendarRequestError,insertCalendarEvent} from '@/lib/google-calendar';
import {useDisplayZone} from './display-time';
type TokenResponse={access_token?:string;expires_in?:number;error?:string;scope?:string};
type GoogleOAuth={initTokenClient:(config:{client_id:string;scope:string;include_granted_scopes:boolean;callback:(response:TokenResponse)=>void;error_callback:()=>void})=>{requestAccessToken:(config:{prompt:string})=>void};hasGrantedAllScopes:(response:TokenResponse,scope:string)=>boolean;revoke:(token:string,callback:(result:{successful:boolean})=>void)=>void};
const oauth=()=> (window as unknown as {google?:{accounts?:{oauth2?:GoogleOAuth}}}).google?.accounts?.oauth2;
let sdk:Promise<void>|undefined;
function loadSdk(){
 if(oauth())return Promise.resolve();
 if(!sdk)sdk=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
  const timeout=setTimeout(()=>fail(),15000);
  function fail(){clearTimeout(timeout);script.remove();sdk=undefined;reject(Error('Google unavailable'));}
  script.onload=()=>{clearTimeout(timeout);if(oauth())resolve();else fail();};script.onerror=fail;document.head.appendChild(script);
 });
 return sdk;
}
export default function GoogleCalendar({entry,game,locale}:{entry:Entry;game:Game;locale:Locale}){
 const l=calendarUi[locale],event=calendarEvent(entry,game,locale),zone=useDisplayZone(),id=useId();
 const [open,setOpen]=useState(false),[clientId,setClientId]=useState<string|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[connected,setConnected]=useState(false),[native,setNative]=useState(false),[message,setMessage]=useState(''),[result,setResult]=useState<{duplicate:boolean;url:string}|null>(null);
 const token=useRef<{value:string;until:number}|null>(null),locked=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;token.current=null;};},[]);
 useEffect(()=>{
  if(!open||!event)return;
  let cancelled=false;
  const embedded=!!window.PatchworkNative||/; wv\)/.test(navigator.userAgent);setNative(embedded);
  if(embedded)return;
  fetch('/api/google-calendar/config',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();const config=await r.json() as {clientId?:unknown}|null;if(cancelled||!config||typeof config.clientId!=='string'||!config.clientId.endsWith('.apps.googleusercontent.com'))return;setClientId(config.clientId);await loadSdk();if(!cancelled)setReady(true);}).catch(()=>{if(!cancelled)setReady(false);});
  return()=>{cancelled=true;};
 },[open,entry.id]);
 const finish=()=>{locked.current=false;if(mounted.current)setBusy(false);};
 function connect(){
  const google=oauth();if(!ready||!clientId||!google||locked.current)return;
  locked.current=true;setBusy(true);setMessage('');setResult(null);setConnected(false);token.current=null;
  const fail=()=>{finish();if(mounted.current)setMessage(l.authError);};
  try{google.initTokenClient({client_id:clientId,scope:calendarScope,include_granted_scopes:false,error_callback:fail,callback:response=>{
   if(!mounted.current){finish();return;}
   if(response.error||!response.access_token||!google.hasGrantedAllScopes(response,calendarScope)){fail();return;}
   token.current={value:response.access_token,until:Date.now()+Number(response.expires_in||0)*1000};setConnected(true);finish();
  }}).requestAccessToken({prompt:'select_account'});}catch{fail();}
 }
 async function add(){
  if(!event||locked.current)return;
  if(!token.current||token.current.until<Date.now()+30000){token.current=null;setConnected(false);setMessage(l.expired);return;}
  locked.current=true;setBusy(true);setMessage('');
  try{const added=await insertCalendarEvent(token.current.value,await calendarEventId(entry),event);if(mounted.current)setResult(added);}
  catch(error){if(mounted.current){if(error instanceof CalendarRequestError&&error.status===401){token.current=null;setConnected(false);setMessage(l.expired);}else setMessage(l.error);}}finally{finish();}
 }
 function disconnect(){
  if(locked.current||!token.current)return;locked.current=true;setBusy(true);setMessage('');
  const value=token.current.value;token.current=null;setConnected(false);setResult(null);
  const timeout=setTimeout(()=>{finish();if(mounted.current)setMessage(l.revokeError);},15000);
  try{oauth()?.revoke(value,response=>{clearTimeout(timeout);finish();if(mounted.current&&!response.successful)setMessage(l.revokeError);});}catch{clearTimeout(timeout);finish();setMessage(l.revokeError);}
 }
 const dateLabel=(value:NonNullable<typeof event>['start'])=>'date'in value?value.date:new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'medium',timeZone:zone}).format(new Date(value.dateTime));
 return <section className="google-calendar-action">
  <button type="button" className="google-calendar-trigger" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}><CalendarPlus size={18}/>{l.title}</button>
  {open&&<div className="google-calendar-panel" id={id}>
   {!event?<p>{l.blocked}</p>:<>
    <strong>{event.summary}</strong><p>{dateLabel(event.start)} — {'date'in event.end?(entry.pickupArchive?.endDate||entry.endDate):dateLabel(event.end)}</p>
    {'date'in event.start&&<small>{l.allDay}</small>}
    <p>{l.note}</p>{clientId&&!native&&<small>{l.reminders}</small>}
    {clientId&&!native&&<><p className="calendar-permission">{l.scope}</p><div className="google-calendar-buttons">
     {!connected?<button disabled={!ready||busy} onClick={connect}>{busy?l.busy:l.connect}</button>:<><button disabled={busy||!!result} onClick={add}>{busy?l.busy:l.add}</button><button disabled={busy} onClick={connect}>{l.switch}</button><button disabled={busy} onClick={disconnect}>{l.disconnect}</button></>}
    </div></>}
    {native&&<p>{l.browser}</p>}
    <div className="google-calendar-buttons"><a href={calendarTemplateUrl(event)} target="_blank" rel="noreferrer">{l.review}<ExternalLink size={14}/></a></div>
    {result&&<p role="status">{result.duplicate?l.exists:l.done} <a href={result.url} target="_blank" rel="noreferrer">{l.open}</a></p>}
    {message&&<p role="alert">{message}</p>}
   </>}
   <div className="google-calendar-links"><a href={'/calendar-privacy?locale='+locale} target="_blank" rel="noreferrer">{l.privacy}</a><a href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">{l.permissions}</a></div>
  </div>}
 </section>;
}
