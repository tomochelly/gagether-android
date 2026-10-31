'use client';
import {useRef,useState} from 'react';
import {MessageCircle} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {discordAccountUi} from '@/lib/discord-account-ui';
export default function DiscordSignIn({locale,returnTo,origin}:{locale:Locale;returnTo:string;origin:string}){
 const t=discordAccountUi[locale],locked=useRef(false);const [busy,setBusy]=useState(false),[error,setError]=useState(false);
 async function signIn(){
  if(locked.current)return;locked.current=true;setBusy(true);setError(false);
  try{
   if(window.location.origin!==origin){const account=new URL('/account',origin);account.searchParams.set('locale',locale);account.searchParams.set('returnTo',returnTo);window.location.assign(account.href);return;}
   const result=await fetch('/api/auth/discord',{method:'POST',headers:{'Content-Type':'application/json','X-Gagether-Auth':'1'},body:JSON.stringify({locale,returnTo}),cache:'no-store'});if(!result.ok)throw Error();
   const data=await result.json() as {url?:string};if(typeof data.url!=='string')throw Error();const url=new URL(data.url);if(url.origin!=='https://discord.com'||url.pathname!=='/oauth2/authorize')throw Error();
   window.location.assign(url.href);
  }catch{setError(true);setBusy(false);locked.current=false;}
 }
 return <div className="discord-signin"><button type="button" className="discord-signin-button" disabled={busy} onClick={()=>void signIn()}><MessageCircle size={20} aria-hidden="true"/>{busy?t.busy:t.signIn}</button>{error&&<p role="alert">{t.error}</p>}</div>;
}
