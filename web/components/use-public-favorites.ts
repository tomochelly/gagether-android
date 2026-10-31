'use client';
import {useEffect,useRef,useState} from 'react';
import {games} from '@/lib/games';
const validGames=new Set(games.map(g=>g.id));
type FavoriteResponse={revision:number;counts:Record<string,number>;countsVersion?:number|null};
const countCacheKey='gagether.public-counts.v1';
function readFavoriteResponse(value:unknown,withRevision=false):FavoriteResponse{const d=value as FavoriteResponse;if(!d||!d.counts||typeof d.counts!=='object'||Array.isArray(d.counts)||Object.entries(d.counts).some(([id,n])=>!validGames.has(id)||!Number.isSafeInteger(n)||n<0)||d.countsVersion!=null&&(!Number.isSafeInteger(d.countsVersion)||d.countsVersion<0)||withRevision&&(!Number.isSafeInteger(d.revision)||d.revision<0))throw new Error('Invalid favorite counts');return d;}
export function usePublicFavorites(favorites:string[],ready:boolean){
 const [counts,setCounts]=useState<Record<string,number>>({}),[error,setError]=useState(false);
 const wanted=useRef('[]'),applied=useRef<string|null>(null),revision=useRef<number|null>(null),busy=useRef(false),alive=useRef(true),retry=useRef<ReturnType<typeof setTimeout>|null>(null);
 const latestCountVersion=useRef<number|null>(null);
 const acceptCounts=(d:FavoriteResponse)=>{if(d.countsVersion!=null&&latestCountVersion.current!==null&&d.countsVersion<latestCountVersion.current)return;if(d.countsVersion!=null)latestCountVersion.current=d.countsVersion;if(alive.current){setCounts(d.counts);try{localStorage.setItem(countCacheKey,JSON.stringify({counts:d.counts,countsVersion:d.countsVersion??null,savedAt:Date.now()}))}catch{}}};
 wanted.current=JSON.stringify([...new Set(favorites.filter(id=>validGames.has(id)))].sort());
 const sync=async()=>{if(!ready||busy.current||wanted.current===applied.current)return;busy.current=true;try{
  if(revision.current===null){const r=await fetch('/api/favorites?session=1',{cache:'no-store',headers:{'X-Gagether-Favorites':'1'}});if(!r.ok)throw new Error();const d=readFavoriteResponse(await r.json(),true);revision.current=d.revision;acceptCounts(d);}
  for(let attempts=0;attempts<4&&wanted.current!==applied.current;attempts++){
   const sent=wanted.current;const r=await fetch('/api/favorites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({favorites:JSON.parse(sent),revision:revision.current})});const raw=await r.json();if(r.status===428){revision.current=null;applied.current=null;throw new Error('Favorite session expired');}const d=readFavoriteResponse(raw,true);if(r.status===409){revision.current=d.revision;continue;}if(!r.ok)throw new Error();revision.current=d.revision;applied.current=sent;acceptCounts(d);
  }if(alive.current)setError(false);
 }catch{if(alive.current){setError(true);retry.current=setTimeout(()=>{retry.current=null;void sync();},30000);}}finally{busy.current=false;if(alive.current&&wanted.current!==applied.current&&!retry.current)retry.current=setTimeout(()=>{retry.current=null;void sync();},1000);}};
 useEffect(()=>{alive.current=true;let staleRetries=0,staleTimer:ReturnType<typeof setTimeout>|undefined;
  try{const saved=JSON.parse(localStorage.getItem(countCacheKey)||'null');if(saved&&Date.now()-saved.savedAt>=0&&Date.now()-saved.savedAt<300000)acceptCounts(readFavoriteResponse(saved));}catch{}
  const load=async()=>{try{const r=await fetch('/api/favorites',{cache:'default'});if(!r.ok)throw new Error();const d=readFavoriteResponse(await r.json());acceptCounts(d);if(r.headers?.get('X-Gagether-Public-Cache')==='STALE'&&staleRetries++<3)staleTimer=setTimeout(load,2000);else staleRetries=0;}catch{if(alive.current)setError(true);}};void load();const timer=setInterval(()=>{if(!document.hidden)void load();},60000);return()=>{alive.current=false;clearInterval(timer);clearTimeout(staleTimer);if(retry.current)clearTimeout(retry.current);};},[]);
 useEffect(()=>{if(!ready)return;const timer=setTimeout(()=>{void sync();},250);return()=>clearTimeout(timer);},[ready,JSON.stringify(favorites)]);
 return {counts,error};
}
