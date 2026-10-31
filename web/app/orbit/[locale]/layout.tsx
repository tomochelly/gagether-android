import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/visitor-locale';
import {localeMetadataDefaults} from '@/lib/seo';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return {...localeMetadataDefaults(locale),title:'GAGETHER ORBIT · BETA',robots:{index:false,follow:true}};}
export default function OrbitLocaleLayout({children}:{children:ReactNode}){return children;}
