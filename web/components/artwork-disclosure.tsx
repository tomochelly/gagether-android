'use client';
import {useId,useState,type ReactNode} from 'react';
import {ChevronDown,Image} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {personalUi} from '@/lib/personal-ui';

export default function ArtworkDisclosure({locale,label,children,className=''}:{locale:Locale;label?:string;children:ReactNode;className?:string}){
 const [open,setOpen]=useState(false),id=useId(),l=personalUi[locale];
 return <div className={'art-disclosure '+className+(open?' is-open':'')}><button className="art-disclosure-toggle" type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}><Image size={16}/><span>{label||l.artwork}</span><small>{open?l.less:l.showArt}</small><ChevronDown size={16}/></button><div id={id} hidden={!open}>{open&&children}</div></div>;
}
