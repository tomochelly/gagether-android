'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {displayZone} from '@/lib/display-time';
import type {Locale} from '@/lib/types';
const TimeZoneContext=createContext('UTC');
export function DisplayTimeProvider({locale,children}:{locale:Locale;children:ReactNode}){
 const [visitorZone,setVisitorZone]=useState('UTC');
 useEffect(()=>{setVisitorZone(Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC');},[]);
 return <TimeZoneContext.Provider value={displayZone(locale,visitorZone)}>{children}</TimeZoneContext.Provider>;
}
export const useDisplayZone=()=>useContext(TimeZoneContext);
