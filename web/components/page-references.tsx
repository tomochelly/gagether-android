'use client';
import {createContext,useContext,useId,useMemo,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import type {Locale} from '@/lib/types';
const words={ko:'출처 · 원문',en:'Sources · originals',ja:'出典・原文',zh:'来源 · 原文'};
const Target=createContext<HTMLElement|null|undefined>(undefined);
const Inside=createContext(false);
/** Portals retain each source's original data/context and disappear on unmount. */
export function ReferenceScope({children,locale,className=''}:{children:ReactNode;locale:Locale;className?:string}){
 const [host,setHost]=useState<HTMLDivElement|null>(null);
 const value=useMemo(()=>host,[host]);
 return <Target.Provider value={value}>{children}<footer className={'page-references '+className} data-page-references><details><summary>{words[locale]}</summary><div className="page-reference-groups" ref={setHost}/></details></footer></Target.Provider>;
}
/** No JavaScript/context fallback keeps the same links inside a native closed disclosure. */
export function PageReference({children,locale='ko',label}:{children:ReactNode;locale?:Locale;label?:ReactNode}){
 const host=useContext(Target),inside=useContext(Inside),id=useId();
 if(inside||host===undefined)return <>{children}</>;
 const content=<Inside.Provider value={true}><section className="page-reference-group" data-reference-content>{label&&<h3>{label}</h3>}{children}</section></Inside.Provider>;
 return host?createPortal(content,host,id):<details className="page-reference-fallback"><summary>{label||words[locale]}</summary>{content}</details>;
}
