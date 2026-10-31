'use client';
import {PageReference} from './page-references';
import {useState,type ReactNode} from 'react';
import {ArrowUpRight} from 'lucide-react';
import type {Locale} from '@/lib/types';

const words={ko:'데이터 원문',en:'Source data',ja:'データ原文',zh:'原始数据'};
/** Technical provenance stays available after an intentional disclosure. */
export default function RosterSourceLink({href,locale,children}:{href:string;locale:Locale;children:ReactNode}){
 const [open,setOpen]=useState(false),host=new URL(href,'https://gagether.wiki').hostname;
 const technical=host==='github.com'||host.endsWith('.github.com')||host==='githubusercontent.com'||host.endsWith('.githubusercontent.com');
 const link=<a className="reference-source-link" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={13}/></a>;
 return <PageReference locale={locale}>{technical?<details className="roster-technical-source" onToggle={e=>{if(e.target===e.currentTarget)setOpen(e.currentTarget.open)}}><summary>{words[locale]}</summary>{open&&link}</details>:link}</PageReference>;
}
