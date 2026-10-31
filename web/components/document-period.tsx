'use client';
import {useEffect,useState} from 'react';
import {displayZone} from '@/lib/display-time';
import {localeCode} from '@/lib/i18n';
import type {Locale} from '@/lib/types';
export default function DocumentPeriod({locale,startAt,endAt,startDate,endDate}:{locale:Locale;startAt:string|null;endAt:string|null;startDate?:string;endDate?:string}){
 const [visitor,setVisitor]=useState('UTC');useEffect(()=>{setVisitor(Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC');},[]);
 const zone=displayZone(locale,visitor),format=(value:string)=>new Intl.DateTimeFormat(localeCode[locale],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:zone}).format(new Date(value));
 const start=startAt||startDate,end=endAt||endDate;
 return <dd>{start&&<time dateTime={start}>{startAt?format(startAt):startDate}</time>}{start&&end?' — ':''}{end&&<time dateTime={end}>{endAt?format(endAt):endDate}</time>}{(startAt||endAt)&&<small> · {zone}</small>}</dd>;
}
