'use client';
import AccountSyncStatus from './account-sync-status';
import {useEffect,useState} from 'react';
import {UserRound,ArrowUpRight} from 'lucide-react';
import type {Locale} from '@/lib/types';
export default function VisitorAccountLink({locale,appMode}:{locale:Locale;appMode:boolean}){
 const [name,setName]=useState<string|null>(null);
 useEffect(()=>{let active=true;const read=()=>{fetch('/api/auth/session',{cache:'no-store'}).then(async r=>{if(!r.ok)return;const data=await r.json() as {user?:{name?:string}|null};if(active)setName(data.user?.name||null);}).catch(()=>{});};read();window.addEventListener('gagether:account-changed',read);return()=>{active=false;window.removeEventListener('gagether:account-changed',read);};},[]);
 const label=({ko:'Google 로그인',en:'Sign in with Google',ja:'Googleでログイン',zh:'Google登录'})[locale];
 return <><a className="visitor-account-link" href={'/account?locale='+locale+(appMode?'&returnTo=%2Fmobile':'')} title={name||label}><UserRound size={15}/><span>{name||label}</span><ArrowUpRight size={15}/></a><AccountSyncStatus locale={locale}/></>;
}
