'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {calendarPreferences,calendarPreferencesKey,defaultCalendarPreferences,CALENDAR_PREFERENCES_CHANGED,type CalendarPreferences} from '@/lib/calendar-preferences';
export function useCalendarPreferences(gameId?:string,myOnly=false){
 const key=calendarPreferencesKey(gameId),[value,setValue]=useState(()=>defaultCalendarPreferences(myOnly)),[error,setError]=useState(false),current=useRef(value);current.current=value;
 useEffect(()=>{const read=()=>{try{setValue(calendarPreferences(JSON.parse(localStorage.getItem(key)||'null'),myOnly));setError(false);}catch{setError(true);}};read();const changed=(e:StorageEvent)=>{if(e.key===key||e.key===null)read();};const local=(e:Event)=>{if((e as CustomEvent).detail===key)read();};window.addEventListener('storage',changed);window.addEventListener(CALENDAR_PREFERENCES_CHANGED,local);return()=>{window.removeEventListener('storage',changed);window.removeEventListener(CALENDAR_PREFERENCES_CHANGED,local);};},[key,myOnly]);
 const change=useCallback((patch:Partial<Omit<CalendarPreferences,'version'>>)=>{
  let saved=false;let next=calendarPreferences({...current.current,...patch},myOnly);
  try{const raw=localStorage.getItem(key);if(raw)next=calendarPreferences({...calendarPreferences(JSON.parse(raw),myOnly),...patch},myOnly);localStorage.setItem(key,JSON.stringify(next));saved=true;setError(false);}catch{setError(true);}
  current.current=next;setValue(next);
  if(saved)window.dispatchEvent(new window.CustomEvent(CALENDAR_PREFERENCES_CHANGED,{detail:key}));
 },[key,myOnly]);
 return {value,change,error};
}
