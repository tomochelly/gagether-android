'use client';
import {createElement,useEffect,useState,type ButtonHTMLAttributes} from 'react';
import type {Entry} from '@/lib/types';
import {detailKey,detailsDeferred} from '@/lib/catalog-index';
import {useDetailIntent} from './use-detail-intent';

// Cache only opened details in this page; a stored/owner revision invalidates them.
const cache=new Map<string,Entry>();
const requests=new Map<string,Promise<Entry>>();
async function loadDetail(entry:Entry,key:string){
 const cached=cache.get(key);if(cached)return cached;
 const pending=requests.get(key);if(pending)return pending;
 const request=(async()=>{
  const response=await fetch('/api/entry?id='+encodeURIComponent(entry.id),{cache:'no-store'});
  if(!response.ok)throw new Error('Unable to load detail');
  const data=await response.json() as {entry:Entry};
  if(data.entry?.id!==entry.id||data.entry.gameId!==entry.gameId||detailsDeferred(data.entry))throw new Error('Invalid detail response');
  cache.set(key,data.entry);if(cache.size>20)cache.delete(cache.keys().next().value!);
  return data.entry;
 })();
 requests.set(key,request);
 try{return await request;}finally{requests.delete(key);}
}
export function useEntryIntent(entry:Entry){return useDetailIntent(()=>loadDetail(entry,detailKey(entry)),detailKey(entry),detailsDeferred(entry));}
export function EntryIntentButton({entry,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{entry:Entry}){const intent=useEntryIntent(entry);return createElement('button',{...props,...intent});}
export function useEntryDetail(summary:Entry|null){
 const deferred=detailsDeferred(summary),key=summary&&deferred?detailKey(summary):'';
 const [result,setResult]=useState<{key:string;entry?:Entry;error?:boolean}>({key:''});
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!summary||!deferred)return;
  let active=true;setResult({key,entry:cache.get(key)});
  void loadDetail(summary,key).then(entry=>{if(active)setResult({key,entry});},()=>{if(active)setResult({key,error:true});});
  return()=>{active=false;};
 },[key,attempt]);
 const loaded=result.key===key?result.entry:cache.get(key);
 // An owner canvas has complete records and must retain its live local preview.
 return {entry:deferred&&loaded?loaded:summary,loading:deferred&&!loaded&&!(result.key===key&&result.error),error:deferred&&!loaded&&result.key===key&&!!result.error,retry:()=>setAttempt(n=>n+1)};
}
